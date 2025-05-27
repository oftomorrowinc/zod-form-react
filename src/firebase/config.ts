import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface FirebaseServices {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

let firebaseServices: FirebaseServices | null = null;

/**
 * Initialize Firebase with automatic emulator detection
 *
 * @description
 * Initializes Firebase services with support for environment variables and automatic
 * emulator connection in development. Returns a singleton instance of Firebase services.
 *
 * @example
 * ```tsx
 * // Using environment variables (recommended)
 * const { firestore, auth, storage } = initializeFirebase();
 *
 * // Using explicit config
 * const { firestore, auth, storage } = initializeFirebase({
 *   apiKey: "your-api-key",
 *   authDomain: "your-auth-domain",
 *   projectId: "your-project-id",
 *   storageBucket: "your-storage-bucket",
 *   messagingSenderId: "your-sender-id",
 *   appId: "your-app-id"
 * });
 *
 * // With custom emulator ports
 * const { firestore, auth, storage } = initializeFirebase(null, {
 *   useEmulators: true,
 *   emulatorHost: 'localhost',
 *   firestorePort: 8080,
 *   authPort: 9099,
 *   storagePort: 9199
 * });
 * ```
 *
 * @param config - Firebase configuration object or null to use environment variables
 * @param options - Additional options for initialization
 * @returns Object containing initialized Firebase services
 */
export function initializeFirebase(
  config?: FirebaseConfig | null,
  options?: {
    useEmulators?: boolean;
    emulatorHost?: string;
    firestorePort?: number;
    authPort?: number;
    storagePort?: number;
  }
): FirebaseServices {
  // Return existing instance if already initialized
  if (firebaseServices && getApps().length > 0) {
    return firebaseServices;
  }

  // Use provided config or construct from environment variables
  const firebaseConfig = config || {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  // Validate config
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];
  for (const field of requiredFields) {
    if (!firebaseConfig[field as keyof FirebaseConfig]) {
      throw new Error(
        `Missing required Firebase config field: ${field}. ` +
          `Please ensure your environment variables or config object includes all required fields. ` +
          `See https://firebase.google.com/docs/web/setup for more information.`
      );
    }
  }

  // Initialize app
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  // Initialize services
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);

  // Connect to emulators if specified
  const shouldUseEmulators =
    options?.useEmulators ??
    (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' ||
      process.env.NODE_ENV === 'development');

  if (shouldUseEmulators && typeof window !== 'undefined') {
    const host = options?.emulatorHost || 'localhost';

    // Connect Firestore emulator
    const firestorePort = options?.firestorePort || 8080;
    try {
      connectFirestoreEmulator(firestore, host, firestorePort);
      console.log(`Connected to Firestore emulator at ${host}:${firestorePort}`);
    } catch (error) {
      // Already connected
    }

    // Connect Auth emulator
    const authPort = options?.authPort || 9099;
    try {
      connectAuthEmulator(auth, `http://${host}:${authPort}`);
      console.log(`Connected to Auth emulator at ${host}:${authPort}`);
    } catch (error) {
      // Already connected
    }

    // Connect Storage emulator
    const storagePort = options?.storagePort || 9199;
    try {
      connectStorageEmulator(storage, host, storagePort);
      console.log(`Connected to Storage emulator at ${host}:${storagePort}`);
    } catch (error) {
      // Already connected
    }
  }

  firebaseServices = {
    app,
    firestore,
    auth,
    storage,
  };

  return firebaseServices;
}

/**
 * Get Firebase services (must call initializeFirebase first)
 */
export function getFirebaseServices(): FirebaseServices {
  if (!firebaseServices) {
    throw new Error('Firebase not initialized. Call initializeFirebase first.');
  }
  return firebaseServices;
}

/**
 * React Hook to get Firebase services
 */
export function useFirebase(): FirebaseServices {
  return getFirebaseServices();
}

/**
 * Helper to create a typed Firestore converter
 */
export function createFirestoreConverter<T>() {
  return {
    toFirestore: (data: T) => data,
    fromFirestore: (snapshot: any, options: any) => {
      const data = snapshot.data(options);
      return {
        id: snapshot.id,
        ...data,
      } as T;
    },
  };
}
