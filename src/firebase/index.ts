// Firebase entry — `import from '@oftomorrow/zod-form/firebase'`.
//
// Everything in this file path-leaks `firebase/firestore`, `firebase/storage`,
// and `firebase/auth`. Those are declared as **optional** peer dependencies
// on the package; consumers using this entry must install `firebase` directly.

export {
  initializeFirebase,
  getFirebaseServices,
  useFirebase,
  createFirestoreConverter,
} from './config';
export type { FirebaseConfig, FirebaseServices } from './config';

export {
  useFirestoreForm,
  useFirebaseStorageUpload,
  type FirestoreFormConfig,
  type FirestoreFormReturn,
  type UseFirebaseStorageUploadOptions,
} from './hooks';

export {
  DocumentReferenceField,
  ServerTimestampField,
  GeoPointField,
  FirebaseStorageField,
} from './fields';

export { FirebaseZodForm } from './FirebaseZodForm';
