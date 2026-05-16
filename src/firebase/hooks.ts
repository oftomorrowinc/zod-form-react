import { useCallback, useEffect, useRef, useState } from 'react';
import { type FieldValues, type Resolver, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  addDoc,
  collection,
  doc,
  type DocumentReference,
  type Firestore,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable, type FirebaseStorage } from 'firebase/storage';
import { type User } from 'firebase/auth';

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
  transformBeforeSave?: (data: unknown) => unknown;
  transformAfterLoad?: (data: unknown) => unknown;
}

export interface FirestoreFormReturn<T extends z.ZodType> extends UseFormReturn<FieldValues> {
  loading: boolean;
  saving: boolean;
  error: Error | null;
  documentId: string | null;
  saveToFirestore: (data?: z.infer<T>) => Promise<DocumentReference | void>;
  deleteFromFirestore: () => Promise<void>;
}

/**
 * React Hook Form bound to a Firestore document. Subscribes to live updates,
 * optionally auto-saves on debounced change, and stamps createdAt/updatedAt
 * + createdBy/updatedBy metadata if `user` and `includeMetadata` are set.
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
  const [currentDocId, setCurrentDocId] = useState<string | null>(documentId ?? null);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<FieldValues>({
    resolver: zodResolver(schema as Parameters<typeof zodResolver>[0]) as Resolver<FieldValues>,
  });

  useEffect(() => {
    if (!documentRef && (!collectionName || !documentId)) return undefined;
    const ref = documentRef ?? doc(firestore, collectionName as string, documentId as string);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          let data: unknown = snap.data();
          data = transformTimestamps(data);
          if (transformAfterLoad) data = transformAfterLoad(data);
          form.reset(data as FieldValues);
          setCurrentDocId(snap.id);
        }
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
        onError?.(err as Error);
      },
    );
    return () => unsubscribe();
  }, [documentRef, collectionName, documentId, firestore, form, transformAfterLoad, onError]);

  const saveToFirestore = useCallback(
    async (data?: z.infer<T>) => {
      try {
        setSaving(true);
        setError(null);
        const formData = data ?? form.getValues();
        let toSave: Record<string, unknown> = { ...(formData as Record<string, unknown>) };

        if (includeMetadata) {
          toSave = {
            ...toSave,
            _metadata: {
              updatedAt: serverTimestamp(),
              updatedBy: user?.uid ?? null,
              ...(currentDocId
                ? {}
                : { createdAt: serverTimestamp(), createdBy: user?.uid ?? null }),
            },
          };
        }
        if (transformBeforeSave) toSave = transformBeforeSave(toSave) as Record<string, unknown>;

        let ref: DocumentReference;
        if (documentRef) {
          await setDoc(documentRef, toSave as Record<string, unknown>, { merge: true });
          ref = documentRef;
        } else if (collectionName && currentDocId) {
          ref = doc(firestore, collectionName, currentDocId);
          await updateDoc(ref, toSave as Record<string, unknown>);
        } else if (collectionName) {
          ref = await addDoc(
            collection(firestore, collectionName),
            toSave as Record<string, unknown>,
          );
          setCurrentDocId(ref.id);
        } else {
          throw new Error(
            'useFirestoreForm: provide either a `collection` name or a `documentRef`.',
          );
        }

        await onSuccess?.(formData as z.infer<T>);
        setSaving(false);
        return ref;
      } catch (err) {
        setError(err as Error);
        setSaving(false);
        onError?.(err as Error);
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
    ],
  );

  useEffect(() => {
    if (!autoSave) return undefined;
    const sub = form.watch((data) => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = setTimeout(() => {
        if (form.formState.isValid) void saveToFirestore(data as unknown as z.infer<T>);
      }, autoSaveDelay);
    });
    return () => {
      sub.unsubscribe();
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [autoSave, autoSaveDelay, form, saveToFirestore]);

  const deleteFromFirestore = useCallback(async () => {
    throw new Error('useFirestoreForm: delete not implemented yet');
  }, []);

  // Touch getDoc so the unused-import lint stays clean; useful for ad-hoc reads.
  void getDoc;

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

function transformTimestamps(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (data instanceof Timestamp) return data.toDate();
  if (Array.isArray(data)) return data.map(transformTimestamps);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    out[k] = transformTimestamps(v);
  }
  return out;
}

export interface UseFirebaseStorageUploadOptions {
  storage: FirebaseStorage;
  path: string;
  metadata?: Record<string, unknown>;
  onProgress?: (progress: number) => void;
  onComplete?: (url: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Upload a single File to Firebase Storage. Returns a resumable progress
 * stream wrapped in React state so the caller can render a progress bar.
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
      const task = uploadBytesResumable(storageRef, file, metadata);

      return new Promise<string>((resolve, reject) => {
        task.on(
          'state_changed',
          (snap) => {
            const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
            setProgress(pct);
            onProgress?.(pct);
          },
          (err) => {
            const e = err as Error;
            setError(e);
            setUploading(false);
            onError?.(e);
            reject(e);
          },
          () => {
            getDownloadURL(task.snapshot.ref).then(
              (url) => {
                setDownloadURL(url);
                setUploading(false);
                onComplete?.(url);
                resolve(url);
              },
              (err) => {
                const e = err as Error;
                setError(e);
                setUploading(false);
                onError?.(e);
                reject(e);
              },
            );
          },
        );
      });
    },
    [storage, path, metadata, onProgress, onComplete, onError],
  );

  return { upload, uploading, progress, downloadURL, error };
}
