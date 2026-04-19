// src/hooks/useCrowdData.ts
// Subscribes to live Firestore venue data and exposes connection state.
// Previously used the deprecated crowdStore — now delegates to venueStore
// which owns the canonical onSnapshot subscriptions.
import { useEffect } from 'react'
import { useVenueStore } from '@/store/venueStore'

export function useCrowdData() {
  const subscribe = useVenueStore((s) => s.subscribe)
  const unsubscribe = useVenueStore((s) => s.unsubscribe)
  const isConnected = useVenueStore((s) => s.isConnected)
  const lastSyncAt = useVenueStore((s) => s.lastSyncAt)

  useEffect(() => {
    subscribe()
    return () => {
      unsubscribe()
    }
  }, [subscribe, unsubscribe])

  return { isConnected, lastUpdated: lastSyncAt }
}
