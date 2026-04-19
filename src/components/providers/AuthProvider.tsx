// src/components/providers/AuthProvider.tsx
import { useEffect } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { getDocument, setDocument } from '@/lib/db'
import type { User as AppUser } from '@/types'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setUser, setAppUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)

        // Fetch or create Firestore user doc
        let userDoc = await getDocument<AppUser>('users', firebaseUser.uid)

        // Auto-elevate demo admin if role isn't set yet
        const isAdminEmail = firebaseUser.email?.toLowerCase().includes('admin');

        if (userDoc) {
          if (isAdminEmail && userDoc.role !== 'admin') {
            userDoc.role = 'admin';
            try {
              await setDocument('users', firebaseUser.uid, userDoc);
            } catch {}
          }
          setAppUser(userDoc)
        } else {
          const newUser: AppUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName:
              firebaseUser.displayName ??
              (firebaseUser.isAnonymous ? 'Guest' : null),
            role: isAdminEmail ? 'admin' : 'user',
            createdAt: Date.now(),
          }
          try {
            await setDocument('users', firebaseUser.uid, newUser)
          } catch {
            // If rules block writing (anonymous user), still set local state
          }
          setAppUser(newUser)
        }

        setLoading(false)
      } else {
        // No session — sign in anonymously so Firestore auth rules pass
        try {
          await signInAnonymously(auth)
          // onAuthStateChanged will fire again with the anonymous user
        } catch (err) {
          console.error('Anonymous sign-in failed:', err)
          // Still clear loading so app renders
          setUser(null)
          setAppUser(null)
          setLoading(false)
        }
      }
    })

    return () => unsubscribe()
  }, [setUser, setAppUser, setLoading])

  return <>{children}</>
}
