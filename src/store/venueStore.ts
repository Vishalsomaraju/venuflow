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

// ─── Derived Stats Interface ──────────────────────────────────────
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

// ─── Store State Interface ────────────────────────────────────────
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

// ─── Congestion priority ──────────────────────────────────────────
const CONGESTION_PRIORITY: Record<CongestionLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
}

// ─── Timestamp conversion helper ──────────────────────────────────
function convertDoc<T>(id: string, data: DocumentData): T {
  const converted: Record<string, unknown> = { id }
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      converted[key] = value.toDate()
    } else if (value !== undefined) {
      converted[key] = value
    }
  }
  return converted as T
}

// ─── Store ────────────────────────────────────────────────────────
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
      set({
        zones,
        lastSyncAt: new Date(),
        isConnected: true,
        subscriptionError: null,
      }),

    setFacilities: (facilities) => set({ facilities, lastSyncAt: new Date() }),

    setAlerts: (alerts) => set({ alerts, lastSyncAt: new Date() }),

    subscribe: () => {
      const { isSubscribed, _unsubscribers: existing } = get()
      if (isSubscribed) return

      existing.forEach((u) => u())
      const unsubs: Unsubscribe[] = []

      // ── 1. Zones ──────────────────────────────────────────────────
      unsubs.push(
        onSnapshot(
          collection(db, 'zones'),
          (snap) => {
            const zones = snap.docs.map((d) => convertDoc<Zone>(d.id, d.data()))
            get().setZones(zones)
          },
          (err) => {
            console.error('Zones error:', err.message)
            set({
              subscriptionError: `Zones: ${err.message}`,
              isConnected: false,
            })
          }
        )
      )

      // ── 2. Facilities ─────────────────────────────────────────────
      unsubs.push(
        onSnapshot(
          collection(db, 'facilities'),
          (snap) => {
            const facilities = snap.docs.map((d) =>
              convertDoc<Facility>(d.id, d.data())
            )
            get().setFacilities(facilities)
          },
          (err) => {
            console.error('Facilities error:', err.message)
            set({ subscriptionError: `Facilities: ${err.message}` })
          }
        )
      )

      // ── 3. Alerts ─────────────────────────────────────────────────
      // NOTE: NO orderBy here — avoids requiring a composite Firestore index.
      // We sort client-side by createdAt instead.
      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'alerts'),
            where('active', '==', true),
            limit(50)
          ),
          (snap) => {
            const alerts = snap.docs
              .map((d) => convertDoc<Alert>(d.id, d.data()))
              // Sort newest first, client-side
              .sort((a, b) => {
                const aTime =
                  a.createdAt instanceof Date ? a.createdAt.getTime() : 0
                const bTime =
                  b.createdAt instanceof Date ? b.createdAt.getTime() : 0
                return bTime - aTime
              })
            get().setAlerts(alerts)
          },
          (err) => {
            console.error('Alerts error:', err.message)
            set({ subscriptionError: `Alerts: ${err.message}` })
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
          /* ignore */
        }
      })
      set({ _unsubscribers: [], isSubscribed: false, isConnected: false })
    },

    // ── Derived stats ──────────────────────────────────────────────
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

      const openFacilities = facilities.filter((f) => f.isOpen)
      const averageWaitTime =
        openFacilities.length > 0
          ? Math.round(
              openFacilities.reduce((s, f) => s + f.waitMinutes, 0) /
                openFacilities.length
            )
          : 0

      const gates = facilities.filter((f) => f.type === 'gate')
      const openGatesCount = gates.filter((f) => f.isOpen).length
      const totalGatesCount = gates.length

      const sorted = [...zones].sort(
        (a, b) =>
          CONGESTION_PRIORITY[b.congestionLevel] -
          CONGESTION_PRIORITY[a.congestionLevel]
      )
      const mostCongestedZone = sorted[0] ?? null
      const leastCongestedZone = sorted[sorted.length - 1] ?? null
      const criticalZoneCount = zones.filter(
        (z) => z.congestionLevel === 'critical'
      ).length

      const activeAlertCount = alerts.length
      const criticalAlertCount = alerts.filter(
        (a) => a.severity === 'critical'
      ).length

      const congestionBreakdown = zones.reduce(
        (acc, z) => {
          acc[z.congestionLevel] = (acc[z.congestionLevel] || 0) + 1
          return acc
        },
        { low: 0, medium: 0, high: 0, critical: 0 } as Record<
          CongestionLevel,
          number
        >
      )

      const facilityBreakdown = facilities.reduce(
        (acc, f) => {
          acc[f.type] = (acc[f.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

      return {
        totalAttendees,
        totalCapacity,
        occupancyPercent,
        averageWaitTime,
        openGatesCount,
        totalGatesCount,
        mostCongestedZone,
        leastCongestedZone,
        criticalZoneCount,
        activeAlertCount,
        criticalAlertCount,
        congestionBreakdown,
        facilityBreakdown,
      }
    },

    getZoneById: (id) => get().zones.find((z) => z.id === id),
    getFacilitiesByZone: (zoneId) =>
      get().facilities.filter((f) => f.zoneId === zoneId),
    getFacilitiesByType: (type) =>
      get().facilities.filter((f) => f.type === type),
    getAlertsByZone: (zoneId) =>
      get().alerts.filter((a) => a.zoneId === zoneId),

    getMostCongestedZone: () => {
      const { zones } = get()
      if (!zones.length) return null
      return (
        [...zones].sort(
          (a, b) =>
            CONGESTION_PRIORITY[b.congestionLevel] -
            CONGESTION_PRIORITY[a.congestionLevel]
        )[0] ?? null
      )
    },
    getLeastCongestedZone: () => {
      const { zones } = get()
      if (!zones.length) return null
      return (
        [...zones].sort(
          (a, b) =>
            CONGESTION_PRIORITY[a.congestionLevel] -
            CONGESTION_PRIORITY[b.congestionLevel]
        )[0] ?? null
      )
    },
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
