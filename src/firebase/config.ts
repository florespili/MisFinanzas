import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  getAuth,
  setPersistence,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '@/firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth with persistent local storage.
// Providing indexedDBLocalPersistence and browserLocalPersistence ensures fallback
// to localStorage on mobile browsers (iOS Safari, Android WebViews, PWAs) where
// IndexedDB can be partitioned or cleared when closing the app.
export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
  } catch {
    return getAuth(app);
  }
})();

// Explicitly enforce browserLocalPersistence for long-lived session storage
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase setPersistence notice:', err);
});

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Attempts to upload an optimized category image to Firebase Storage.
 * If Firebase Storage is not enabled on the user's project, or fails due to
 * permissions/CORS, it gracefully returns the compressed Base64 Data URL,
 * ensuring the user never experiences data loss or interface errors.
 */
export async function uploadCategoryImage(
  userId: string,
  categoryId: string,
  imageBlob: Blob,
  fallbackDataUrl: string
): Promise<string> {
  try {
    const ext = imageBlob.type === 'image/webp' ? 'webp' : 'jpg';
    const filename = `${categoryId || 'new'}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, `users/${userId}/categories/${filename}`);

    const uploadResult = await uploadBytes(storageRef, imageBlob, {
      contentType: imageBlob.type,
      cacheControl: 'public, max-age=31536000',
    });

    const downloadUrl = await getDownloadURL(uploadResult.ref);
    return downloadUrl;
  } catch (storageError) {
    console.warn(
      'Firebase Storage no está habilitado o falló la subida. Utilizando imagen comprimida optimizada persistente en Firestore:',
      storageError
    );
    return fallbackDataUrl;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or syncing locally.');
    }
    return false;
  }
}
