// src/context/RoutingContext.tsx
// Shared state between GoogleMapView and RoutingPanel.
// The map registers a `routeTo` handler; the panel calls it.

import { createContext, useContext, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Facility } from '@/types'

export interface RouteResult {
  distance: string    // e.g. "350 m"
  duration: string    // e.g. "4 mins"
  destinationName: string
}

export interface RoutingHandle {
  /** Called by the panel to route to a specific facility */
  routeTo: (facility: Facility, allFacilities: Facility[]) => Promise<RouteResult>
  /** Called by the panel to clear the current route */
  clearRoute: () => void
}

interface RoutingContextValue {
  /** The panel calls this to register that it wants a route */
  setHandle: (handle: RoutingHandle | null) => void
  /** The map registers itself here so the panel can call it */
  handle: React.MutableRefObject<RoutingHandle | null>
}

const RoutingContext = createContext<RoutingContextValue | null>(null)

export function RoutingProvider({ children }: { children: ReactNode }) {
  const handleRef = useRef<RoutingHandle | null>(null)

  const setHandle = useCallback((h: RoutingHandle | null) => {
    handleRef.current = h
  }, [])

  return (
    <RoutingContext.Provider value={{ setHandle, handle: handleRef }}>
      {children}
    </RoutingContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- intentional context + hook co-location
export function useRoutingContext() {
  const ctx = useContext(RoutingContext)
  if (!ctx) throw new Error('useRoutingContext must be used inside RoutingProvider')
  return ctx
}
