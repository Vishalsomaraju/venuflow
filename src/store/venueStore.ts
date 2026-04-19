// src/store/venueStore.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type {
  Zone,
  Facility,
  Alert,
  CongestionLevel,
  FacilityType,
} from '@/types'

export interface VenueStats {
  totalAttendees: number
  totalCapacity: number
  occupancyPercent: number
  averageWaitTime: number
  openGatesCount: number
  totalGatesCount: number
  mostCongestedZone: Zone | null
  leastCongestedZone: Zone | null
  criticalZoneCount: number
  activeAlertCount: number
  criticalAlertCount: number
  congestionBreakdown: Record<CongestionLevel, number>
  facilityBreakdown: Record<string, number>
}

interface VenueState {
  zones: Zone[]
  facilities: Facility[]
  alerts: Alert[]
  isSubscribed: boolean
  isConnected: boolean
  lastSyncAt: Date | null
  subscriptionError: string | null
  _unsubscribers: Unsubscribe[]

  setZones: (zones: Zone[]) => void
  setFacilities: (facilities: Facility[]) => void
  setAlerts: (alerts: Alert[]) => void
  subscribe: () => void
  unsubscribe: () => void
  getStats: () => VenueStats
  getZoneById: (id: string) => Zone | undefined
  getFacilitiesByZone: (zoneId: string) => Facility[]
  getFacilitiesByType: (type: FacilityType) => Facility[]
  getAlertsByZone: (zoneId: string) => Alert[]
  getMostCongestedZone: () => Zone | null
  getLeastCongestedZone: () => Zone | null
  getTotalAttendees: () => number
  getAverageWaitTime: () => number
  getOpenGatesCount: () => number
}

const PRIORITY: Record<CongestionLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
}

function toDoc<T>(id: string, data: DocumentData): T {
  const out: Record<string, unknown> = { id }
  for (const [k, v] of Object.entries(data)) {
    out[k] = v instanceof Timestamp ? v.toDate() : v
  }
  return out as T
}

export const useVenueStore = create<VenueState>()(
  subscribeWithSelector((set, get) => ({
    zones: [],
    facilities: [],
    alerts: [],
    isSubscribed: false,
    isConnected: false,
    lastSyncAt: null,
    subscriptionError: null,
    _unsubscribers: [],

    setZones: (zones) =>
      set({ zones, lastSyncAt: new Date(), isConnected: true }),
    setFacilities: (facilities) => set({ facilities, lastSyncAt: new Date() }),
    setAlerts: (alerts) => set({ alerts, lastSyncAt: new Date() }),

    subscribe: () => {
      // Always clean up previous listeners before creating new ones
      get()._unsubscribers.forEach((u) => {
        try {
          u()
        } catch (_) {
          /* */
        }
      })

      const unsubs: Unsubscribe[] = []

      // 1. Zones — allow read: if true (no auth needed)
      unsubs.push(
        onSnapshot(
          collection(db, 'zones'),
          (snap) => {
            get().setZones(snap.docs.map((d) => toDoc<Zone>(d.id, d.data())))
          },
          (err) => {
            console.error('[zones]', err.code, err.message)
            set({ isConnected: false, subscriptionError: err.message })
          }
        )
      )

      // 2. Facilities — allow read: if true (no auth needed)
      unsubs.push(
        onSnapshot(
          collection(db, 'facilities'),
          (snap) => {
            get().setFacilities(
              snap.docs.map((d) => toDoc<Facility>(d.id, d.data()))
            )
          },
          (err) => {
            console.error('[facilities]', err.code, err.message)
            set({ subscriptionError: err.message })
          }
        )
      )

      // 3. Alerts — allow read: if isSignedIn() (anonymous auth satisfies this)
      // NO orderBy() — avoids needing a composite index. Sort client-side.
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'alerts'),
            where('active', '==', true),
            limit(50)
          ),
          (snap) => {
            const alerts = snap.docs
              .map((d) => toDoc<Alert>(d.id, d.data()))
              .sort((a, b) => {
                const at =
                  a.createdAt instanceof Date ? a.createdAt.getTime() : 0
                const bt =
                  b.createdAt instanceof Date ? b.createdAt.getTime() : 0
                return bt - at
              })
            get().setAlerts(alerts)
          },
          (err) => {
            console.error('[alerts]', err.code, err.message)
            // Don't set subscriptionError for permission-denied on alerts
            // — it resolves automatically once anonymous auth completes
          }
        )
      )

      set({
        _unsubscribers: unsubs,
        isSubscribed: true,
        isConnected: true,
        subscriptionError: null,
      })
    },

    unsubscribe: () => {
      get()._unsubscribers.forEach((u) => {
        try {
          u()
        } catch (_) {
          /* */
        }
      })
      set({ _unsubscribers: [], isSubscribed: false, isConnected: false })
    },

    getStats: (): VenueStats => {
      const { zones, facilities, alerts } = get()
      const totalAttendees = zones.reduce(
        (s, z) => s + (z.currentCount || 0),
        0
      )
      const totalCapacity = zones.reduce((s, z) => s + (z.capacity || 0), 0)
      const occupancyPercent =
        totalCapacity > 0
          ? Math.round((totalAttendees / totalCapacity) * 100)
          : 0

      const open = facilities.filter((f) => f.isOpen)
      const averageWaitTime = open.length
        ? Math.round(open.reduce((s, f) => s + f.waitMinutes, 0) / open.length)
        : 0

      const gates = facilities.filter((f) => f.type === 'gate')
      const openGatesCount = gates.filter((f) => f.isOpen).length

      const sorted = [...zones].sort(
        (a, b) => PRIORITY[b.congestionLevel] - PRIORITY[a.congestionLevel]
      )

      return {
        totalAttendees,
        totalCapacity,
        occupancyPercent,
        averageWaitTime,
        openGatesCount,
        totalGatesCount: gates.length,
        mostCongestedZone: sorted[0] ?? null,
        leastCongestedZone: sorted[sorted.length - 1] ?? null,
        criticalZoneCount: zones.filter((z) => z.congestionLevel === 'critical')
          .length,
        activeAlertCount: alerts.length,
        criticalAlertCount: alerts.filter((a) => a.severity === 'critical')
          .length,
        congestionBreakdown: zones.reduce(
          (a, z) => {
            a[z.congestionLevel] = (a[z.congestionLevel] || 0) + 1
            return a
          },
          { low: 0, medium: 0, high: 0, critical: 0 } as Record<
            CongestionLevel,
            number
          >
        ),
        facilityBreakdown: facilities.reduce(
          (a, f) => {
            a[f.type] = (a[f.type] || 0) + 1
            return a
          },
          {} as Record<string, number>
        ),
      }
    },

    getZoneById: (id) => get().zones.find((z) => z.id === id),
    getFacilitiesByZone: (id) =>
      get().facilities.filter((f) => f.zoneId === id),
    getFacilitiesByType: (t) => get().facilities.filter((f) => f.type === t),
    getAlertsByZone: (id) => get().alerts.filter((a) => a.zoneId === id),
    getMostCongestedZone: () =>
      get().zones.length
        ? ([...get().zones].sort(
            (a, b) => PRIORITY[b.congestionLevel] - PRIORITY[a.congestionLevel]
          )[0] ?? null)
        : null,
    getLeastCongestedZone: () =>
      get().zones.length
        ? ([...get().zones].sort(
            (a, b) => PRIORITY[a.congestionLevel] - PRIORITY[b.congestionLevel]
          )[0] ?? null)
        : null,
    getTotalAttendees: () =>
      get().zones.reduce((s, z) => s + (z.currentCount || 0), 0),
    getAverageWaitTime: () => {
      const open = get().facilities.filter((f) => f.isOpen)
      return open.length
        ? Math.round(open.reduce((s, f) => s + f.waitMinutes, 0) / open.length)
        : 0
    },
    getOpenGatesCount: () =>
      get().facilities.filter((f) => f.type === 'gate' && f.isOpen).length,
  }))
)
