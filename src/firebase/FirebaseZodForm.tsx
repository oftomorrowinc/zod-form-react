import React from 'react';
import { z } from 'zod';
import { ZodForm } from '../components/ZodForm';
import { useFirestoreForm, FirestoreFormConfig } from './hooks';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { User } from 'firebase/auth';

export interface FirebaseZodFormProps<T extends z.ZodType>
  extends Omit<FirestoreFormConfig<T>, 'firestore'> {
  // Firebase instances
  firestore: Firestore;
  storage?: FirebaseStorage;

  // Form configuration
  submitButtonText?: string;
  resetButtonText?: string;
  showSubmitButton?: boolean;
  showResetButton?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
  layout?: 'vertical' | 'horizontal' | 'grid';

  // Field configuration for Firebase-specific fields
  firebaseFieldConfig?: {
    storage?: FirebaseStorage;
    storagePath?: string;
    documentPickerCollections?: Record<string, string>;
  };

  // Loading and error states
  showLoadingState?: boolean;
  showErrorState?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: Error) => React.ReactNode;
}

export function FirebaseZodForm<T extends z.ZodType>({
  schema,
  firestore,
  storage,
  collection,
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
  submitButtonText = 'Save',
  resetButtonText = 'Reset',
  showSubmitButton = true,
  showResetButton = false,
  className,
  theme = 'dark',
  layout = 'vertical',
  firebaseFieldConfig,
  showLoadingState = true,
  showErrorState = true,
  loadingComponent,
  errorComponent,
}: FirebaseZodFormProps<T>) {
  const {
    loading,
    saving,
    error,
    documentId: currentDocId,
    saveToFirestore,
    handleSubmit,
    ...formMethods
  } = useFirestoreForm({
    schema,
    firestore,
    collection,
    documentId,
    documentRef,
    user,
    autoSave,
    autoSaveDelay,
    onSuccess,
    onError,
    includeMetadata,
    transformBeforeSave,
    transformAfterLoad,
  });

  const onSubmit = handleSubmit(async data => {
    await saveToFirestore(data);
  });

  // Show loading state
  if (loading && showLoadingState) {
    return (
      <div className={className}>
        {loadingComponent || (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-400">Loading...</div>
          </div>
        )}
      </div>
    );
  }

  // Show error state
  if (error && showErrorState && !saving) {
    return (
      <div className={className}>
        {errorComponent ? (
          errorComponent(error)
        ) : (
          <div className="p-4 bg-red-900/20 border border-red-500 rounded-md">
            <p className="text-red-400">Error: {error.message}</p>
          </div>
        )}
      </div>
    );
  }

  // TODO: Pass Firebase context to fields that need it
  // storage and firebaseFieldConfig will be used when implementing custom field rendering

  return (
    <ZodForm
      schema={schema}
      onSubmit={onSubmit}
      defaultValues={formMethods.getValues()}
      submitButtonText={saving ? 'Saving...' : submitButtonText}
      resetButtonText={resetButtonText}
      showSubmitButton={showSubmitButton}
      showResetButton={showResetButton}
      loading={saving}
      disabled={saving}
      className={className}
      theme={theme}
      layout={layout}
      fieldOptions={{}}
    >
      {/* Status indicators */}
      {autoSave && (
        <div className="text-sm text-gray-500 mt-2">
          {saving && 'Saving...'}
          {!saving && currentDocId && 'All changes saved'}
        </div>
      )}
    </ZodForm>
  );
}
