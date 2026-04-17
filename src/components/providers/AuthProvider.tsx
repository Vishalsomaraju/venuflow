import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { getDocument, setDocument } from '@/lib/db';
import type { User as AppUser } from '@/types';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setUser, setAppUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch or create user document
        const userDoc = await getDocument<AppUser>('users', firebaseUser.uid);
        
        if (userDoc) {
          setAppUser(userDoc);
        } else {
          // Create new user record
          const newUser: AppUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest User' : null),
            role: 'user', // default role
            createdAt: Date.now(),
          };
          
          await setDocument('users', firebaseUser.uid, newUser);
          setAppUser(newUser);
        }
      } else {
        setAppUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setAppUser, setLoading]);

  return <>{children}</>;
};
