// src/pages/Dashboard.tsx
import { useAuthStore } from '@/store/authStore'
import { useVenueStats } from '@/hooks/useVenueStats'
import {
  useIsConnected,
  useMostCongestedZone,
} from '@/hooks/useVenueSelectors'
import { StatCard } from '@/components/dashboard/StatCard'
import { ZoneGrid } from '@/components/dashboard/ZoneGrid'
import { AlertsFeed } from '@/components/dashboard/AlertsFeed'
import { CrowdChart } from '@/components/dashboard/CrowdChart'
import { FacilityTable } from '@/components/dashboard/FacilityTable'
import { SimulationControl } from '@/components/dashboard/SimulationControl'
import { cn } from '@/lib/utils'
import {
  Users,
  Clock,
  AlertTriangle,
  Activity,
  Wifi,
  WifiOff,
  DoorOpen,
  MapPin,
} from 'lucide-react'

export function Dashboard() {
  const { user, appUser } = useAuthStore()
  const role = appUser?.role || 'user'
  const isConnected = useIsConnected()
  const mostCongested = useMostCongestedZone()

  // Auto-refreshing derived stats
  const { stats, isStale, lastSyncAt } = useVenueStats({
    refreshInterval: 2000,
    autoRefresh: true,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Stadium Dashboard
          </h1>
          <p className="text-text-secondary mt-1">
            Real-time crowd monitoring and venue intelligence
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SimulationControl />

          {/* Connection status */}
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
              'border transition-colors',
              isConnected && !isStale
                ? 'border-emerald-500/30 text-emerald-400'
                : isStale
                  ? 'border-amber-500/30 text-amber-400'
                  : 'border-red-500/30 text-red-400'
            )}
          >
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {isConnected && !isStale
              ? 'Live'
              : isStale
                ? 'Stale'
                : 'Disconnected'}
          </div>

          {/* Role badge */}
          <div
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              role === 'admin'
                ? 'bg-purple-500/20 text-purple-400'
                : role === 'staff'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-surface-light text-text-secondary'
            )}
          >
            {role}
            {user?.isAnonymous ? ' (guest)' : ''}
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Attendance"
          value={
            stats.totalAttendees > 0
              ? stats.totalAttendees.toLocaleString()
              : '—'
          }
          subtitle={`${stats.occupancyPercent}% venue capacity`}
          color="bg-blue-500/20"
        />
        <StatCard
          icon={Activity}
          label="Zone Status"
          value={
            stats.totalCapacity > 0
              ? `${stats.congestionBreakdown.low + stats.congestionBreakdown.medium}/${
                  Object.values(stats.congestionBreakdown).reduce(
                    (a, b) => a + b,
                    0
                  )
                }`
              : '—'
          }
          subtitle={
            stats.criticalZoneCount > 0
              ? `${stats.criticalZoneCount} critical zone${stats.criticalZoneCount > 1 ? 's' : ''}`
              : 'All zones normal'
          }
          color="bg-emerald-500/20"
        />
        <StatCard
          icon={Clock}
          label="Avg Wait Time"
          value={
            stats.averageWaitTime > 0 ? `${stats.averageWaitTime} min` : '—'
          }
          subtitle="Across open facilities"
          color="bg-amber-500/20"
        />
        <StatCard
          icon={DoorOpen}
          label="Open Gates"
          value={
            stats.totalGatesCount > 0
              ? `${stats.openGatesCount}/${stats.totalGatesCount}`
              : '—'
          }
          subtitle={
            stats.openGatesCount < stats.totalGatesCount
              ? `${stats.totalGatesCount - stats.openGatesCount} closed`
              : 'All gates operational'
          }
          color="bg-purple-500/20"
        />
      </div>

      {/* Most Congested Zone Callout */}
      {mostCongested && mostCongested.congestionLevel !== 'low' && (
        <div
          className={cn(
            'rounded-xl border p-4 flex items-center gap-3',
            mostCongested.congestionLevel === 'critical'
              ? 'border-red-500/30 bg-red-500/5'
              : mostCongested.congestionLevel === 'high'
                ? 'border-amber-500/30 bg-amber-500/5'
                : 'border-surface-border bg-surface'
          )}
        >
          <MapPin
            className={cn(
              'h-5 w-5 shrink-0',
              mostCongested.congestionLevel === 'critical'
                ? 'text-red-400'
                : 'text-amber-400'
            )}
          />
          <div>
            <p className="text-sm font-medium text-text-primary">
              Highest congestion:{' '}
              <span className="font-bold">{mostCongested.name}</span>
            </p>
            <p className="text-xs text-text-secondary">
              {mostCongested.currentCount.toLocaleString()} /{' '}
              {mostCongested.capacity.toLocaleString()} capacity (
              {Math.round(
                (mostCongested.currentCount / mostCongested.capacity) * 100
              )}
              %)
            </p>
          </div>
        </div>
      )}

      {/* Active Alerts Count Row */}
      {stats.activeAlertCount > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle
            className={cn(
              'h-4 w-4',
              stats.criticalAlertCount > 0
                ? 'text-red-400'
                : 'text-amber-400'
            )}
          />
          <span className="text-text-secondary">
            {stats.activeAlertCount} active alert
            {stats.activeAlertCount !== 1 ? 's' : ''}
            {stats.criticalAlertCount > 0 && (
              <span className="text-red-400 font-medium">
                {' '}
                ({stats.criticalAlertCount} critical)
              </span>
            )}
          </span>
        </div>
      )}

      {/* Zone Grid */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-3">
          Zone Status
        </h2>
        <ZoneGrid />
      </div>

      {/* Chart + Alerts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CrowdChart />
        </div>
        <div>
          <AlertsFeed />
        </div>
      </div>

      {/* Facility Table */}
      <FacilityTable />

      {/* Last sync footer */}
      {lastSyncAt && (
        <p className="text-xs text-text-muted text-center pt-2">
          Last sync: {lastSyncAt.toLocaleTimeString()} •{' '}
          Stats auto-refresh every 2s
        </p>
      )}
    </div>
  )
}
