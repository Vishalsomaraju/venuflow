import { 
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from './firebase';

const googleProvider = new GoogleAuthProvider();

export const loginAnonymously = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('Anonymous sign in error:', error);
    return { user: null, error };
  }
};

export const loginWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    return { user: null, error };
  }
};

export const logout = async () => {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { error };
  }
};
