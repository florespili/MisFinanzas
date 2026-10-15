import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase/config';
import { hashPin } from '../utils/security';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLocked: boolean;
  hasPinSet: boolean;
  pinLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  setNewPin: (pin: string) => Promise<void>;
  lockApp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [hasPinSet, setHasPinSet] = useState<boolean>(false);
  const [pinLoading, setPinLoading] = useState<boolean>(false);
  const [storedPinHash, setStoredPinHash] = useState<string | null>(null);

  useEffect(() => {
    let isInitialCheck = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Only lock on initial launch/reopening, not on subsequent background token refreshes
        if (isInitialCheck) {
          setIsLocked(true);
        }
        await loadPinConfig(currentUser.uid);
      } else {
        setHasPinSet(false);
        setStoredPinHash(null);
        setIsLocked(false);
      }
      isInitialCheck = false;
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadPinConfig = async (uid: string) => {
    setPinLoading(true);
    // 1. Fast local cache check
    const localHash = localStorage.getItem(`pin_hash_${uid}`);
    if (localHash) {
      setStoredPinHash(localHash);
      setHasPinSet(true);
    }

    try {
      const pinDocRef = doc(db, 'users', uid, 'config', 'pin');
      const snap = await getDoc(pinDocRef);
      if (snap.exists() && snap.data().pin_hash) {
        const hash = snap.data().pin_hash;
        setStoredPinHash(hash);
        setHasPinSet(true);
        localStorage.setItem(`pin_hash_${uid}`, hash);
      } else if (!localHash) {
        setHasPinSet(false);
        setStoredPinHash(null);
      }
    } catch (err) {
      console.warn('Could not load remote PIN config, using local cache:', err);
      if (!localHash) {
        setHasPinSet(false);
      }
    } finally {
      setPinLoading(false);
    }
  };

  const signInWithGoogleAction = async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Google Sign In Error:', err);
      throw err;
    }
  };

  const signInWithEmailAction = async (email: string, pass: string) => {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUpWithEmailAction = async (email: string, pass: string) => {
    await setPersistence(auth, browserLocalPersistence);
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const signOutUserAction = async () => {
    if (user) {
      localStorage.removeItem(`pin_hash_${user.uid}`);
    }
    await signOut(auth);
    setUser(null);
    setIsLocked(false);
    setHasPinSet(false);
    setStoredPinHash(null);
  };

  const unlockWithPinAction = async (pin: string): Promise<boolean> => {
    if (!user) return true;
    const computedHash = await hashPin(pin, user.uid);
    if (storedPinHash && computedHash === storedPinHash) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const setNewPinAction = async (pin: string): Promise<void> => {
    if (!user) return;
    const computedHash = await hashPin(pin, user.uid);
    setStoredPinHash(computedHash);
    localStorage.setItem(`pin_hash_${user.uid}`, computedHash);
    setHasPinSet(true);
    setIsLocked(false);

    try {
      const pinDocRef = doc(db, 'users', user.uid, 'config', 'pin');
      await setDoc(pinDocRef, {
        pin_hash: computedHash,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/config/pin`);
    }
  };

  const lockApp = () => {
    if (user) {
      setIsLocked(true);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLocked,
        hasPinSet,
        pinLoading,
        signInWithGoogle: signInWithGoogleAction,
        signInWithEmail: signInWithEmailAction,
        signUpWithEmail: signUpWithEmailAction,
        signOutUser: signOutUserAction,
        unlockWithPin: unlockWithPinAction,
        setNewPin: setNewPinAction,
        lockApp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
