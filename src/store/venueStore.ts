// src/store/venueStore.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
  collection,
  query,
  where,
  orderBy,
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
  // Core real-time data
  zones: Zone[]
  facilities: Facility[]
  alerts: Alert[]

  // Connection and lifecycle
  isSubscribed: boolean
  isConnected: boolean
  lastSyncAt: Date | null
  subscriptionError: string | null

  // Internal subscription handles
  _unsubscribers: Unsubscribe[]

  // ── Mutations ──
  setZones: (zones: Zone[]) => void
  setFacilities: (facilities: Facility[]) => void
  setAlerts: (alerts: Alert[]) => void

  // ── Subscription Lifecycle ──
  subscribe: () => void
  unsubscribe: () => void

  // ── Derived Computations ──
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

// ─── Congestion priority for sorting ──────────────────────────────
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

// ─── Store Creation ───────────────────────────────────────────────
export const useVenueStore = create<VenueState>()(
  subscribeWithSelector((set, get) => ({
    // ── Initial State ──
    zones: [],
    facilities: [],
    alerts: [],
    isSubscribed: false,
    isConnected: false,
    lastSyncAt: null,
    subscriptionError: null,
    _unsubscribers: [],

    // ── Mutations ──
    setZones: (zones) =>
      set({
        zones,
        lastSyncAt: new Date(),
        isConnected: true,
        subscriptionError: null,
      }),

    setFacilities: (facilities) =>
      set({
        facilities,
        lastSyncAt: new Date(),
      }),

    setAlerts: (alerts) =>
      set({
        alerts,
        lastSyncAt: new Date(),
      }),

    // ── Subscribe to all Firestore collections ──
    subscribe: () => {
      const { isSubscribed, _unsubscribers: existing } = get()

      // Prevent duplicate subscriptions
      if (isSubscribed) {
        console.warn('⚠️ VenueStore: Already subscribed')
        return
      }

      // Clean up any stale subscriptions
      existing.forEach((unsub) => unsub())

      const unsubs: Unsubscribe[] = []

      // 1. Zones — real-time
      const zonesUnsub = onSnapshot(
        collection(db, 'zones'),
        (snapshot) => {
          const zones = snapshot.docs.map((doc) =>
            convertDoc<Zone>(doc.id, doc.data())
          )
          get().setZones(zones)
        },
        (error) => {
          console.error('❌ Zones snapshot error:', error)
          set({
            subscriptionError: `Zones: ${error.message}`,
            isConnected: false,
          })
        }
      )
      unsubs.push(zonesUnsub)

      // 2. Facilities — real-time
      const facilitiesUnsub = onSnapshot(
        collection(db, 'facilities'),
        (snapshot) => {
          const facilities = snapshot.docs.map((doc) =>
            convertDoc<Facility>(doc.id, doc.data())
          )
          get().setFacilities(facilities)
        },
        (error) => {
          console.error('❌ Facilities snapshot error:', error)
          set({
            subscriptionError: `Facilities: ${error.message}`,
          })
        }
      )
      unsubs.push(facilitiesUnsub)

      // 3. Active alerts — ordered, limited
      const alertsQuery = query(
        collection(db, 'alerts'),
        where('active', '==', true),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const alertsUnsub = onSnapshot(
        alertsQuery,
        (snapshot) => {
          const alerts = snapshot.docs.map((doc) =>
            convertDoc<Alert>(doc.id, doc.data())
          )
          get().setAlerts(alerts)
        },
        (error) => {
          console.error('❌ Alerts snapshot error:', error)
          set({
            subscriptionError: `Alerts: ${error.message}`,
          })
        }
      )
      unsubs.push(alertsUnsub)

      set({
        _unsubscribers: unsubs,
        isSubscribed: true,
        isConnected: true,
        subscriptionError: null,
      })

      console.log('📡 VenueStore: Subscribed to 3 Firestore collections')
    },

    // ── Unsubscribe from all listeners ──
    unsubscribe: () => {
      const { _unsubscribers } = get()

      _unsubscribers.forEach((unsub) => {
        try {
          unsub()
        } catch (err) {
          console.warn('Unsubscribe error:', err)
        }
      })

      set({
        _unsubscribers: [],
        isSubscribed: false,
        isConnected: false,
      })

      console.log('📡 VenueStore: Unsubscribed from all collections')
    },

    // ── Derived: Full stats object ──
    getStats: (): VenueStats => {
      const { zones, facilities, alerts } = get()

      const totalAttendees = zones.reduce(
        (sum, z) => sum + (z.currentCount || 0),
        0
      )
      const totalCapacity = zones.reduce(
        (sum, z) => sum + (z.capacity || 0),
        0
      )
      const occupancyPercent =
        totalCapacity > 0
          ? Math.round((totalAttendees / totalCapacity) * 100)
          : 0

      // Average wait across open facilities
      const openFacilities = facilities.filter((f) => f.isOpen)
      const averageWaitTime =
        openFacilities.length > 0
          ? Math.round(
              openFacilities.reduce((sum, f) => sum + f.waitMinutes, 0) /
                openFacilities.length
            )
          : 0

      // Gate counts
      const gates = facilities.filter((f) => f.type === 'gate')
      const openGatesCount = gates.filter((f) => f.isOpen).length
      const totalGatesCount = gates.length

      // Congestion analysis
      const sortedByCongestion = [...zones].sort(
        (a, b) =>
          CONGESTION_PRIORITY[b.congestionLevel] -
          CONGESTION_PRIORITY[a.congestionLevel]
      )
      const mostCongestedZone = sortedByCongestion[0] ?? null
      const leastCongestedZone =
        sortedByCongestion[sortedByCongestion.length - 1] ?? null

      const criticalZoneCount = zones.filter(
        (z) => z.congestionLevel === 'critical'
      ).length

      // Alert breakdown
      const activeAlertCount = alerts.length
      const criticalAlertCount = alerts.filter(
        (a) => a.severity === 'critical'
      ).length

      // Congestion distribution
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

      // Facility type distribution
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

    // ── Derived: Lookups ──
    getZoneById: (id) => get().zones.find((z) => z.id === id),

    getFacilitiesByZone: (zoneId) =>
      get().facilities.filter((f) => f.zoneId === zoneId),

    getFacilitiesByType: (type) =>
      get().facilities.filter((f) => f.type === type),

    getAlertsByZone: (zoneId) =>
      get().alerts.filter((a) => a.zoneId === zoneId),

    getMostCongestedZone: () => {
      const { zones } = get()
      if (zones.length === 0) return null

      return [...zones].sort(
        (a, b) =>
          CONGESTION_PRIORITY[b.congestionLevel] -
          CONGESTION_PRIORITY[a.congestionLevel]
      )[0] ?? null
    },

    getLeastCongestedZone: () => {
      const { zones } = get()
      if (zones.length === 0) return null

      return [...zones].sort(
        (a, b) =>
          CONGESTION_PRIORITY[a.congestionLevel] -
          CONGESTION_PRIORITY[b.congestionLevel]
      )[0] ?? null
    },

    getTotalAttendees: () =>
      get().zones.reduce((sum, z) => sum + (z.currentCount || 0), 0),

    getAverageWaitTime: () => {
      const open = get().facilities.filter((f) => f.isOpen)
      if (open.length === 0) return 0
      return Math.round(
        open.reduce((sum, f) => sum + f.waitMinutes, 0) / open.length
      )
    },

    getOpenGatesCount: () =>
      get().facilities.filter((f) => f.type === 'gate' && f.isOpen).length,
  }))
)
