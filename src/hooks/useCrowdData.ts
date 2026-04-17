import { useEffect } from 'react'
import { useCrowdStore } from '@/store/crowdStore'

export function useCrowdData() {
  const subscribe = useCrowdStore((s) => s.subscribe)
  const unsubscribe = useCrowdStore((s) => s.unsubscribe)
  const isConnected = useCrowdStore((s) => s.isConnected)
  const lastUpdated = useCrowdStore((s) => s.lastUpdated)

  useEffect(() => {
    subscribe()

    return () => {
      unsubscribe()
    }
  }, [subscribe, unsubscribe])

  return { isConnected, lastUpdated }
}
