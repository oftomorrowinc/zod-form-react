import * as React from 'react';
import { type Firestore } from 'firebase/firestore';
import { type FirebaseStorage } from 'firebase/storage';
import { type User } from 'firebase/auth';
import { z } from 'zod';
import { ZodForm } from '../components/ZodForm';
import { useFirestoreForm, type FirestoreFormConfig } from './hooks';

export interface FirebaseZodFormProps<T extends z.ZodType> extends Omit<
  FirestoreFormConfig<T>,
  'firestore'
> {
  firestore: Firestore;
  storage?: FirebaseStorage;
  user?: User | null;
  submitButtonText?: string;
  resetButtonText?: string;
  showSubmitButton?: boolean;
  showResetButton?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
  layout?: 'vertical' | 'horizontal' | 'grid';
  showLoadingState?: boolean;
  showErrorState?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: Error) => React.ReactNode;
}

/**
 * Renders a {@link ZodForm} bound to a Firestore document. Loading state is
 * shown while the document hydrates; errors are surfaced via `errorComponent`.
 * Most consumers want this for "edit one row of a known collection."
 */
export function FirebaseZodForm<T extends z.ZodType>({
  schema,
  firestore,
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
  theme = 'light',
  layout = 'vertical',
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
    getValues,
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

  if (loading && showLoadingState) {
    return (
      <div className={className}>
        {loadingComponent ?? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">Loading…</div>
        )}
      </div>
    );
  }

  if (error && showErrorState && !saving) {
    return (
      <div className={className}>
        {errorComponent ? (
          errorComponent(error)
        ) : (
          <div className="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            Error: {error.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <ZodForm
      schema={schema}
      onSubmit={async (data) => {
        await saveToFirestore(data as z.infer<T>);
      }}
      defaultValues={getValues() as Record<string, unknown>}
      submitButtonText={saving ? 'Saving…' : submitButtonText}
      resetButtonText={resetButtonText}
      showSubmitButton={showSubmitButton}
      showResetButton={showResetButton}
      loading={saving}
      disabled={saving}
      className={className}
      theme={theme}
      layout={layout}
    >
      {autoSave && (
        <div className="text-sm text-muted-foreground">
          {saving ? 'Saving…' : currentDocId ? 'All changes saved' : null}
        </div>
      )}
    </ZodForm>
  );
}
