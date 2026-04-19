// src/hooks/useVenueStats.ts
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useVenueStore, type VenueStats } from '@/store/venueStore'

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

  const getStats = useVenueStore((s) => s.getStats)
  const isConnected = useVenueStore((s) => s.isConnected)
  const lastSyncAt = useVenueStore((s) => s.lastSyncAt)

  const [stats, setStats] = useState<VenueStats>(EMPTY_STATS)
  const [lastComputedAt, setLastComputedAt] = useState<Date | null>(null)
  // Track the current time in state so we can compare against lastSyncAt without
  // calling Date.now() directly during render (which violates React purity rules).
  const [nowMs, setNowMs] = useState<number>(() => Date.now())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const computeStats = useCallback((): void => {
    const freshStats = getStats()
    setStats(freshStats)
    setLastComputedAt(new Date())
    setNowMs(Date.now())
  }, [getStats])

  // Compute immediately when store data changes
  useEffect(() => {
    computeStats()
  }, [computeStats, lastSyncAt])

  // Auto-refresh on interval
  useEffect(() => {
    if (!autoRefresh) return

    intervalRef.current = setInterval(computeStats, refreshInterval)

    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current!)
        intervalRef.current = null
      } else {
        intervalRef.current = setInterval(computeStats, refreshInterval)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, refreshInterval, computeStats])

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
    refresh: computeStats,
  }
}

