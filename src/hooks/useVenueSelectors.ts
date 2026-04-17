// src/hooks/useVenueSelectors.ts
import { useVenueStore } from '@/store/venueStore'
import type { Zone, Facility, Alert, FacilityType } from '@/types'

// ─── Direct State Selectors ──────────────────────────────────────

/** All zones, live from Firestore */
export function useZones(): Zone[] {
  return useVenueStore((s) => s.zones)
}

/** All facilities, live from Firestore */
export function useFacilities(): Facility[] {
  return useVenueStore((s) => s.facilities)
}

/** All active alerts, live from Firestore */
export function useAlerts(): Alert[] {
  return useVenueStore((s) => s.alerts)
}

/** Subscription connection status */
export function useIsConnected(): boolean {
  return useVenueStore((s) => s.isConnected)
}

/** Last time data synced from Firestore */
export function useLastSyncAt(): Date | null {
  return useVenueStore((s) => s.lastSyncAt)
}

/** Any subscription error message */
export function useSubscriptionError(): string | null {
  return useVenueStore((s) => s.subscriptionError)
}

// ─── Derived State Selectors ─────────────────────────────────────

/** Single zone by ID */
export function useZoneById(id: string): Zone | undefined {
  return useVenueStore((s) => s.zones.find((z) => z.id === id))
}

/** Facilities filtered by zone */
export function useFacilitiesByZone(zoneId: string): Facility[] {
  return useVenueStore((s) =>
    s.facilities.filter((f) => f.zoneId === zoneId)
  )
}

/** Facilities filtered by type */
export function useFacilitiesByType(type: FacilityType): Facility[] {
  return useVenueStore((s) =>
    s.facilities.filter((f) => f.type === type)
  )
}

/** Alerts filtered by zone */
export function useAlertsByZone(zoneId: string): Alert[] {
  return useVenueStore((s) =>
    s.alerts.filter((a) => a.zoneId === zoneId)
  )
}

/** Total attendees across all zones */
export function useTotalAttendees(): number {
  return useVenueStore((s) =>
    s.zones.reduce((sum, z) => sum + (z.currentCount || 0), 0)
  )
}

/** Average wait time across open facilities */
export function useAverageWaitTime(): number {
  return useVenueStore((s) => {
    const open = s.facilities.filter((f) => f.isOpen)
    if (open.length === 0) return 0
    return Math.round(
      open.reduce((sum, f) => sum + f.waitMinutes, 0) / open.length
    )
  })
}

/** Count of open gates */
export function useOpenGatesCount(): number {
  return useVenueStore((s) =>
    s.facilities.filter((f) => f.type === 'gate' && f.isOpen).length
  )
}

/** Most congested zone */
export function useMostCongestedZone(): Zone | null {
  return useVenueStore((s) => {
    if (s.zones.length === 0) return null
    const priority = { low: 0, medium: 1, high: 2, critical: 3 }
    return [...s.zones].sort(
      (a, b) =>
        priority[b.congestionLevel] - priority[a.congestionLevel]
    )[0] ?? null
  })
}

/** Least congested zone */
export function useLeastCongestedZone(): Zone | null {
  return useVenueStore((s) => {
    if (s.zones.length === 0) return null
    const priority = { low: 0, medium: 1, high: 2, critical: 3 }
    return [...s.zones].sort(
      (a, b) =>
        priority[a.congestionLevel] - priority[b.congestionLevel]
    )[0] ?? null
  })
}

/** Count of zones at critical congestion */
export function useCriticalZoneCount(): number {
  return useVenueStore((s) =>
    s.zones.filter((z) => z.congestionLevel === 'critical').length
  )
}

/** Count of critical severity alerts */
export function useCriticalAlertCount(): number {
  return useVenueStore((s) =>
    s.alerts.filter((a) => a.severity === 'critical').length
  )
}
