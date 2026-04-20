import { 
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const loginAnonymously = async (): Promise<{ user: import('firebase/auth').User | null; error: unknown | null }> => {
  try {
    const userCredential = await signInAnonymously(auth);
    return { user: userCredential.user, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Anonymous sign in error';
    console.error('[auth] Anonymous sign in error:', message);
    return { user: null, error };
  }
};

export const loginWithGoogle = async (): Promise<{ user: import('firebase/auth').User | null; error: unknown | null }> => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return { user: userCredential.user, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Google sign in error';
    console.error('[auth] Google sign in error:', message);
    return { user: null, error };
  }
};

export const logout = async (): Promise<{ error: unknown | null }> => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sign out error';
    console.error('[auth] Sign out error:', message);
    return { error };
  }
};
