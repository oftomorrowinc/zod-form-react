import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  CollectionReference,
  Firestore,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { User } from 'firebase/auth';

export interface FirestoreFormConfig<T extends z.ZodType> {
  schema: T;
  firestore: Firestore;
  collection?: string;
  documentId?: string;
  documentRef?: DocumentReference;
  user?: User | null;
  autoSave?: boolean;
  autoSaveDelay?: number;
  onSuccess?: (data: z.infer<T>) => void | Promise<void>;
  onError?: (error: Error) => void;
  includeMetadata?: boolean;
  transformBeforeSave?: (data: any) => any;
  transformAfterLoad?: (data: any) => any;
}

export interface FirestoreFormReturn<T extends z.ZodType> extends UseFormReturn<z.infer<T>> {
  loading: boolean;
  saving: boolean;
  error: Error | null;
  documentId: string | null;
  saveToFirestore: (data?: z.infer<T>) => Promise<DocumentReference | void>;
  deleteFromFirestore: () => Promise<void>;
}

/**
 * React hook for synchronizing form state with Firestore documents
 *
 * @description
 * Provides real-time synchronization between a React Hook Form and Firestore documents.
 * Supports auto-save, real-time updates, and automatic metadata tracking.
 *
 * @example
 * ```tsx
 * const form = useFirestoreForm({
 *   schema: userSchema,
 *   firestore,
 *   collection: 'users',
 *   documentId: userId,
 *   autoSave: true,
 *   autoSaveDelay: 2000,
 * });
 * ```
 *
 * @param config - Configuration object for the form
 * @returns Extended React Hook Form instance with Firestore functionality
 */
export function useFirestoreForm<T extends z.ZodType>({
  schema,
  firestore,
  collection: collectionName,
  documentId,
  documentRef,
  user,
  autoSave = false,
  autoSaveDelay = 2000,
  onSuccess,
  onError,
  includeMetadata = true,
  transformBeforeSave,
  transformAfterLoad,
}: FirestoreFormConfig<T>): FirestoreFormReturn<T> {
  const [loading, setLoading] = useState(!!documentId || !!documentRef);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(documentId || null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
  });

  // Load existing document
  useEffect(() => {
    if (!documentRef && (!collectionName || !documentId)) return;

    const docRef = documentRef || doc(firestore, collectionName!, documentId!);

    const unsubscribe = onSnapshot(
      docRef,
      snapshot => {
        if (snapshot.exists()) {
          let data = snapshot.data();

          // Transform timestamps to dates
          data = transformTimestamps(data);

          // Apply custom transformation
          if (transformAfterLoad) {
            data = transformAfterLoad(data);
          }

          form.reset(data as z.infer<T>);
          setCurrentDocId(snapshot.id);
        }
        setLoading(false);
      },
      err => {
        setError(err as Error);
        setLoading(false);
        if (onError) onError(err as Error);
      }
    );

    return () => unsubscribe();
  }, [documentRef, collectionName, documentId, firestore, form, transformAfterLoad, onError]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;

    const subscription = form.watch(data => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        if (form.formState.isValid) {
          saveToFirestore(data as z.infer<T>);
        }
      }, autoSaveDelay);
    });

    return () => {
      subscription.unsubscribe();
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [autoSave, autoSaveDelay, form]);

  const saveToFirestore = useCallback(
    async (data?: z.infer<T>) => {
      try {
        setSaving(true);
        setError(null);

        const formData = data || form.getValues();
        let dataToSave = { ...formData };

        // Add metadata
        if (includeMetadata) {
          dataToSave = {
            ...dataToSave,
            _metadata: {
              updatedAt: serverTimestamp(),
              updatedBy: user?.uid || null,
              ...(currentDocId
                ? {}
                : {
                    createdAt: serverTimestamp(),
                    createdBy: user?.uid || null,
                  }),
            },
          };
        }

        // Apply custom transformation
        if (transformBeforeSave) {
          dataToSave = transformBeforeSave(dataToSave);
        }

        let docRef: DocumentReference;

        if (documentRef) {
          await setDoc(documentRef, dataToSave, { merge: true });
          docRef = documentRef;
        } else if (collectionName && currentDocId) {
          docRef = doc(firestore, collectionName, currentDocId);
          await updateDoc(docRef, dataToSave);
        } else if (collectionName) {
          docRef = await addDoc(collection(firestore, collectionName), dataToSave);
          setCurrentDocId(docRef.id);
        } else {
          throw new Error(
            'FirestoreForm: No collection name or document reference provided. ' +
              'Please provide either a "collection" prop or a "documentRef" prop.'
          );
        }

        if (onSuccess) {
          await onSuccess(formData);
        }

        setSaving(false);
        return docRef;
      } catch (err) {
        setError(err as Error);
        setSaving(false);
        if (onError) onError(err as Error);
        throw err;
      }
    },
    [
      form,
      firestore,
      collectionName,
      currentDocId,
      documentRef,
      user,
      includeMetadata,
      transformBeforeSave,
      onSuccess,
      onError,
    ]
  );

  const deleteFromFirestore = useCallback(async () => {
    // Implementation for delete
    throw new Error('Delete not implemented yet');
  }, []);

  return {
    ...form,
    loading,
    saving,
    error,
    documentId: currentDocId,
    saveToFirestore,
    deleteFromFirestore,
  };
}

// Helper function to transform Firestore Timestamps to Dates
function transformTimestamps(data: any): any {
  if (!data || typeof data !== 'object') return data;

  if (data instanceof Timestamp) {
    return data.toDate();
  }

  if (Array.isArray(data)) {
    return data.map(transformTimestamps);
  }

  const transformed: any = {};
  for (const [key, value] of Object.entries(data)) {
    transformed[key] = transformTimestamps(value);
  }

  return transformed;
}

// File upload hook
export interface UseFirebaseStorageUploadOptions {
  storage: FirebaseStorage;
  path: string;
  metadata?: any;
  onProgress?: (progress: number) => void;
  onComplete?: (url: string) => void;
  onError?: (error: Error) => void;
}

/**
 * React hook for uploading files to Firebase Storage
 *
 * @description
 * Handles file uploads with progress tracking, error handling, and automatic URL retrieval.
 * Supports custom metadata and configurable upload paths.
 *
 * @example
 * ```tsx
 * const { upload, uploading, progress, downloadURL } = useFirebaseStorageUpload({
 *   storage,
 *   path: 'user-avatars',
 *   onComplete: (url) => console.log('Upload complete:', url),
 *   onProgress: (progress) => console.log('Progress:', progress),
 * });
 *
 * // Upload a file
 * await upload(file);
 * ```
 *
 * @param options - Configuration for the upload
 * @returns Upload function and state
 */
export function useFirebaseStorageUpload({
  storage,
  path,
  metadata,
  onProgress,
  onComplete,
  onError,
}: UseFirebaseStorageUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      setProgress(0);

      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        'state_changed',
        snapshot => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(prog);
          if (onProgress) onProgress(prog);
        },
        err => {
          setError(err as Error);
          setUploading(false);
          if (onError) onError(err as Error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setDownloadURL(url);
            setUploading(false);
            if (onComplete) onComplete(url);
          } catch (err) {
            setError(err as Error);
            setUploading(false);
            if (onError) onError(err as Error);
          }
        }
      );
    },
    [storage, path, metadata, onProgress, onComplete, onError]
  );

  return {
    upload,
    uploading,
    progress,
    downloadURL,
    error,
  };
}

// Document picker hook for selecting existing Firestore documents
export interface UseDocumentPickerOptions {
  firestore: Firestore;
  collection: string;
  query?: any; // Firebase Query constraints
  transform?: (doc: any) => { label: string; value: string };
}

export function useDocumentPicker({
  firestore,
  collection: collectionName,
  query,
  transform,
}: UseDocumentPickerOptions) {
  const [documents, setDocuments] = useState<Array<{ label: string; value: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // TODO: Implementation would fetch documents and transform them
    // This is a placeholder implementation
    setLoading(false);
    // Future implementation will use setDocuments and setError
  }, [firestore, collectionName, query, transform]);

  return { documents, loading, error };
}
