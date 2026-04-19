// src/hooks/useVenueSubscription.ts
import { useEffect } from 'react'
import { useVenueStore } from '@/store/venueStore'

/**
 * Subscribes to all Firestore collections on mount, unsubscribes on unmount.
 * Keep it dead simple — the store's isSubscribed flag prevents double-subscribing.
 */
export function useVenueSubscription() {
  const subscribe = useVenueStore((s) => s.subscribe)
  const unsubscribe = useVenueStore((s) => s.unsubscribe)

  useEffect(() => {
    subscribe()
    return () => {
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    isSubscribed: useVenueStore((s) => s.isSubscribed),
    isConnected: useVenueStore((s) => s.isConnected),
    error: useVenueStore((s) => s.subscriptionError),
  }
}
