import { create } from 'zustand'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Zone, Facility, Alert, CongestionLevel } from '@/types'

interface CrowdState {
  // Data
  zones: Zone[]
  facilities: Facility[]
  alerts: Alert[]

  // Connection state
  isConnected: boolean
  lastUpdated: Date | null

  // Subscriptions tracking
  _unsubscribers: Unsubscribe[]

  // Actions
  setZones: (zones: Zone[]) => void
  setFacilities: (facilities: Facility[]) => void
  setAlerts: (alerts: Alert[]) => void
  subscribe: () => void
  unsubscribe: () => void

  // Computed helpers
  getZoneById: (id: string) => Zone | undefined
  getFacilitiesByZone: (zoneId: string) => Facility[]
  getActiveAlerts: () => Alert[]
}

export const useCrowdStore = create<CrowdState>((set, get) => ({
  zones: [],
  facilities: [],
  alerts: [],
  isConnected: false,
  lastUpdated: null,
  _unsubscribers: [],

  setZones: (zones) =>
    set({ zones, lastUpdated: new Date() }),

  setFacilities: (facilities) =>
    set({ facilities, lastUpdated: new Date() }),

  setAlerts: (alerts) =>
    set({ alerts, lastUpdated: new Date() }),

  subscribe: () => {
    const unsubs: Unsubscribe[] = []

    // Subscribe to zones — real-time
    const zonesUnsub = onSnapshot(
      collection(db, 'zones'),
      (snapshot) => {
        const zones = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
          createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        })) as Zone[]
        set({ zones, isConnected: true, lastUpdated: new Date() })
      },
      (error) => {
        console.error('Zones subscription error:', error)
        set({ isConnected: false })
      }
    )
    unsubs.push(zonesUnsub)

    // Subscribe to facilities — real-time
    const facilitiesUnsub = onSnapshot(
      collection(db, 'facilities'),
      (snapshot) => {
        const facilities = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(),
          createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
        })) as Facility[]
        set({ facilities, lastUpdated: new Date() })
      },
      (error) => {
        console.error('Facilities subscription error:', error)
      }
    )
    unsubs.push(facilitiesUnsub)

    // Subscribe to active alerts — ordered by creation time
    const alertsQuery = query(
      collection(db, 'alerts'),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    const alertsUnsub = onSnapshot(
      alertsQuery,
      (snapshot) => {
        const alerts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() ?? new Date(),
          resolvedAt: doc.data().resolvedAt?.toDate?.() ?? null,
        })) as Alert[]
        set({ alerts, lastUpdated: new Date() })
      },
      (error) => {
        console.error('Alerts subscription error:', error)
      }
    )
    unsubs.push(alertsUnsub)

    set({ _unsubscribers: unsubs, isConnected: true })
    console.log('📡 Real-time subscriptions active')
  },

  unsubscribe: () => {
    const { _unsubscribers } = get()
    _unsubscribers.forEach((unsub) => unsub())
    set({ _unsubscribers: [], isConnected: false })
    console.log('📡 Real-time subscriptions stopped')
  },

  getZoneById: (id) => get().zones.find((z) => z.id === id),

  getFacilitiesByZone: (zoneId) =>
    get().facilities.filter((f) => f.zoneId === zoneId),

  getActiveAlerts: () => get().alerts.filter((a) => a.active),
}))

// ─── Selector hooks for components ────────────────────────────────
export function useZoneStats() {
  const zones = useCrowdStore((s) => s.zones)

  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0)
  const totalAttendance = zones.reduce((sum, z) => sum + z.currentCount, 0)
  const occupancyRate = totalCapacity > 0
    ? Math.round((totalAttendance / totalCapacity) * 100)
    : 0

  const congestionBreakdown = zones.reduce(
    (acc, z) => {
      acc[z.congestionLevel] = (acc[z.congestionLevel] || 0) + 1
      return acc
    },
    {} as Record<CongestionLevel, number>
  )

  const criticalZones = zones.filter(
    (z) => z.congestionLevel === 'critical'
  )

  return {
    totalCapacity,
    totalAttendance,
    occupancyRate,
    congestionBreakdown,
    criticalZones,
    zoneCount: zones.length,
  }
}

export function useAverageWait() {
  const facilities = useCrowdStore((s) => s.facilities)
  const openFacilities = facilities.filter((f) => f.isOpen)

  if (openFacilities.length === 0) return 0

  const totalWait = openFacilities.reduce(
    (sum, f) => sum + f.waitMinutes,
    0
  )
  return Math.round(totalWait / openFacilities.length)
}
