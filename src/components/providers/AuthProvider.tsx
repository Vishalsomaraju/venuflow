// src/components/providers/AuthProvider.tsx
import { useEffect } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/store/authStore'
import { getDocument, setDocument } from '@/lib/db'
import type { Role, User as AppUser } from '@/types'

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { setUser, setAppUser, setLoading } = useAuthStore()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)

        // Fetch or create Firestore user doc
        const userDoc = await getDocument<AppUser>('users', firebaseUser.uid)
        const tokenResult = await firebaseUser.getIdTokenResult()
        const claimedRole = normalizeRoleClaim(tokenResult.claims.role)

        if (userDoc) {
          setAppUser({
            ...userDoc,
            role: claimedRole ?? userDoc.role,
          })
        } else {
          const newUser: AppUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            displayName:
              firebaseUser.displayName ??
              (firebaseUser.isAnonymous ? 'Guest' : null),
            role: claimedRole ?? 'user',
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
          const message =
            err instanceof Error ? err.message : 'Anonymous sign-in failed'
          console.error('[AuthProvider] Anonymous sign-in failed:', message)
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

function normalizeRoleClaim(role: unknown): Role | null {
  return role === 'admin' || role === 'staff' || role === 'user'
    ? role
    : null
}
