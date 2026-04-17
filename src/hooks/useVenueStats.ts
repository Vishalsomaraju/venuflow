// src/hooks/useVenueStats.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { useVenueStore, type VenueStats } from '@/store/venueStore'

interface UseVenueStatsOptions {
  /** How often to recompute stats in ms. Default: 2000 */
  refreshInterval?: number
  /** Whether to auto-refresh. Default: true */
  autoRefresh?: boolean
}

const EMPTY_STATS: VenueStats = {
  totalAttendees: 0,
  totalCapacity: 0,
  occupancyPercent: 0,
  averageWaitTime: 0,
  openGatesCount: 0,
  totalGatesCount: 0,
  mostCongestedZone: null,
  leastCongestedZone: null,
  criticalZoneCount: 0,
  activeAlertCount: 0,
  criticalAlertCount: 0,
  congestionBreakdown: { low: 0, medium: 0, high: 0, critical: 0 },
  facilityBreakdown: {},
}

/**
 * Returns derived venue statistics with configurable auto-refresh.
 *
 * Stats are recomputed from the live Zustand store at the specified interval,
 * ensuring components get fresh derived values even between Firestore snapshots.
 *
 * @example
 * ```tsx
 * const { stats, isStale, refresh } = useVenueStats({ refreshInterval: 3000 })
 * console.log(stats.totalAttendees, stats.mostCongestedZone?.name)
 * ```
 */
export function useVenueStats(options: UseVenueStatsOptions = {}) {
  const { refreshInterval = 2000, autoRefresh = true } = options

  const getStats = useVenueStore((s) => s.getStats)
  const isConnected = useVenueStore((s) => s.isConnected)
  const lastSyncAt = useVenueStore((s) => s.lastSyncAt)

  const [stats, setStats] = useState<VenueStats>(EMPTY_STATS)
  const [lastComputedAt, setLastComputedAt] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const computeStats = useCallback(() => {
    const freshStats = getStats()
    setStats(freshStats)
    setLastComputedAt(new Date())
  }, [getStats])

  // Compute immediately when store data changes
  useEffect(() => {
    computeStats()
  }, [computeStats, lastSyncAt])

  // Auto-refresh on interval
  useEffect(() => {
    if (!autoRefresh) return

    intervalRef.current = setInterval(computeStats, refreshInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [autoRefresh, refreshInterval, computeStats])

  // Is the data potentially stale?
  const isStale =
    !isConnected ||
    (lastSyncAt !== null &&
      Date.now() - lastSyncAt.getTime() > refreshInterval * 5)

  return {
    stats,
    isStale,
    isConnected,
    lastComputedAt,
    lastSyncAt,
    refresh: computeStats,
  }
}
