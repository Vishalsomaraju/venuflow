// src/hooks/useVenueStats.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useVenueStore, type VenueStats } from '@/store/venueStore'
import type { CongestionLevel } from '@/types'

interface UseVenueStatsOptions {
  /** How often to recompute stats in ms. Default: 2000 */
  refreshInterval?: number
  /** Whether to auto-refresh. Default: true */
  autoRefresh?: boolean
}

/** Return shape of useVenueStats */
export interface UseVenueStatsResult {
  stats: VenueStats
  isStale: boolean
  isConnected: boolean
  lastComputedAt: Date | null
  lastSyncAt: Date | null
  refresh: () => void
}

/**
 * Returns derived venue statistics with configurable auto-refresh.
 *
 * Stats are recomputed from the live Zustand store at the specified interval,
 * ensuring components get fresh derived values even between Firestore snapshots.
 *
 * @param options - Optional configuration for refresh interval and auto-refresh toggle.
 * @returns An object containing stats, staleness flag, and a manual refresh function.
 *
 * @example
 * ```tsx
 * const { stats, isStale, refresh } = useVenueStats({ refreshInterval: 3000 })
 * console.log(stats.totalAttendees, stats.mostCongestedZone?.name)
 * ```
 */
export function useVenueStats(options: UseVenueStatsOptions = {}): UseVenueStatsResult {
  const { refreshInterval = 2000, autoRefresh = true } = options

  const zones = useVenueStore((s) => s.zones)
  const facilities = useVenueStore((s) => s.facilities)
  const alerts = useVenueStore((s) => s.alerts)
  const isConnected = useVenueStore((s) => s.isConnected)
  const lastSyncAt = useVenueStore((s) => s.lastSyncAt)

  const [refreshTick, setRefreshTick] = useState(0)
  const [lastComputedAt, setLastComputedAt] = useState<Date | null>(() => new Date())
  // Track the current time in state so we can compare against lastSyncAt without
  // calling Date.now() directly during render (which violates React purity rules).
  const [nowMs, setNowMs] = useState<number>(() => Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback((): void => {
    const now = new Date()
    setRefreshTick((prev) => prev + 1)
    setLastComputedAt(now)
    setNowMs(now.getTime())
  }, [])

  const stats = useMemo<VenueStats>(() => {
    void refreshTick
    const totalAttendees = zones.reduce((sum, zone) => sum + (zone.currentCount || 0), 0)
    const totalCapacity = zones.reduce((sum, zone) => sum + (zone.capacity || 0), 0)
    const occupancyPercent =
      totalCapacity > 0
        ? Math.round((totalAttendees / totalCapacity) * 100)
        : 0

    const openFacilities = facilities.filter((facility) => facility.isOpen)
    const averageWaitTime = openFacilities.length
      ? Math.round(
          openFacilities.reduce(
            (sum, facility) => sum + facility.waitMinutes,
            0
          ) / openFacilities.length
        )
      : 0

    const gates = facilities.filter((facility) => facility.type === 'gate')
    const sortedZones = [...zones].sort(
      (a, b) =>
        congestionPriority[b.congestionLevel] - congestionPriority[a.congestionLevel]
    )

    return {
      totalAttendees,
      totalCapacity,
      occupancyPercent,
      averageWaitTime,
      openGatesCount: gates.filter((facility) => facility.isOpen).length,
      totalGatesCount: gates.length,
      mostCongestedZone: sortedZones[0] ?? null,
      leastCongestedZone: sortedZones[sortedZones.length - 1] ?? null,
      criticalZoneCount: zones.filter((zone) => zone.congestionLevel === 'critical')
        .length,
      activeAlertCount: alerts.length,
      criticalAlertCount: alerts.filter((alert) => alert.severity === 'critical')
        .length,
      congestionBreakdown: zones.reduce(
        (accumulator, zone) => {
          accumulator[zone.congestionLevel] += 1
          return accumulator
        },
        { low: 0, medium: 0, high: 0, critical: 0 } as Record<
          CongestionLevel,
          number
        >
      ),
      facilityBreakdown: facilities.reduce(
        (accumulator, facility) => {
          accumulator[facility.type] = (accumulator[facility.type] || 0) + 1
          return accumulator
        },
        {} as Record<string, number>
      ),
    }
  }, [alerts, facilities, refreshTick, zones])

  // Auto-refresh on interval
  useEffect(() => {
    if (!autoRefresh) return

    intervalRef.current = setInterval(refresh, refreshInterval)

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
      } else {
        intervalRef.current = setInterval(refresh, refreshInterval)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, refreshInterval, refresh])

  // Is the data potentially stale? Derived from stable state values — no impure calls.
  const isStale = useMemo(
    () =>
      !isConnected ||
      (lastSyncAt !== null && nowMs - lastSyncAt.getTime() > refreshInterval * 5),
    [isConnected, lastSyncAt, nowMs, refreshInterval]
  )

  return {
    stats,
    isStale,
    isConnected,
    lastComputedAt,
    lastSyncAt,
    refresh,
  }
}

const congestionPriority: Record<CongestionLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
}
