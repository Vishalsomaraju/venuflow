// src/hooks/useVenueSubscription.ts
import { useEffect, useRef } from 'react'
import { useVenueStore } from '@/store/venueStore'

/**
 * Manages the Firestore subscription lifecycle.
 * Call this once at the app root level — it subscribes on mount
 * and unsubscribes on unmount.
 *
 * @example
 * ```tsx
 * function App() {
 *   useVenueSubscription()
 *   return <Dashboard />
 * }
 * ```
 */
export function useVenueSubscription() {
  const subscribe = useVenueStore((s) => s.subscribe)
  const unsubscribe = useVenueStore((s) => s.unsubscribe)
  const isSubscribed = useVenueStore((s) => s.isSubscribed)
  const mountedRef = useRef(false)

  useEffect(() => {
    // Prevent double-subscribe in React StrictMode
    if (mountedRef.current) return
    mountedRef.current = true

    if (!isSubscribed) {
      subscribe()
    }

    return () => {
      // Only unsubscribe on true unmount, not StrictMode re-render
      // We use a small delay to distinguish
      setTimeout(() => {
        if (!mountedRef.current) return
        unsubscribe()
        mountedRef.current = false
      }, 100)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isSubscribed,
    isConnected: useVenueStore((s) => s.isConnected),
    error: useVenueStore((s) => s.subscriptionError),
  }
}
