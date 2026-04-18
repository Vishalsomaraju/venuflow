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

        // Fetch or create Firestore user document
        const userDoc = await getDocument<AppUser>('users', firebaseUser.uid)

        if (userDoc) {
          setAppUser(userDoc)
        } else {
          const newUser: AppUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName:
              firebaseUser.displayName ??
              (firebaseUser.isAnonymous ? 'Guest' : null),
            role: 'user',
            createdAt: Date.now(),
          }
          await setDocument('users', firebaseUser.uid, newUser)
          setAppUser(newUser)
        }

        setLoading(false)
      } else {
        // No user signed in — sign in anonymously so Firestore rules pass.
        // This is a no-op if the user is already signing in (race-free).
        try {
          await signInAnonymously(auth)
          // onAuthStateChanged will fire again with the new anonymous user.
        } catch (err) {
          console.error('Anonymous sign-in failed:', err)
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
