import { useAuthStore } from '@/store/authStore'
import { useCrowdData } from '@/hooks/useCrowdData'
import { useCrowdStore, useZoneStats, useAverageWait } from '@/store/crowdStore'
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
} from 'lucide-react'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.appUser?.role)
  const { isConnected, lastUpdated } = useCrowdData()
  const alerts = useCrowdStore((s) => s.alerts)
  const { totalAttendance, occupancyRate, zoneCount, criticalZones } =
    useZoneStats()
  const avgWait = useAverageWait()

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
        <div className="flex items-center gap-3">
          <SimulationControl />

          {/* Connection status */}
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
              'border',
              isConnected
                ? 'border-emerald-500/30 text-emerald-400'
                : 'border-red-500/30 text-red-400'
            )}
          >
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {isConnected ? 'Live' : 'Disconnected'}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Attendance"
          value={totalAttendance > 0 ? totalAttendance.toLocaleString() : '—'}
          subtitle={`${occupancyRate}% venue capacity`}
          color="bg-blue-500/20"
        />
        <StatCard
          icon={Activity}
          label="Active Zones"
          value={zoneCount > 0 ? zoneCount : '—'}
          subtitle={
            criticalZones.length > 0
              ? `${criticalZones.length} critical`
              : 'All normal'
          }
          color="bg-emerald-500/20"
        />
        <StatCard
          icon={Clock}
          label="Avg Wait Time"
          value={avgWait > 0 ? `${avgWait} min` : '—'}
          subtitle="Across open facilities"
          color="bg-amber-500/20"
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={alerts.length > 0 ? alerts.length : '—'}
          subtitle={
            alerts.filter((a) => a.severity === 'critical').length > 0
              ? `${alerts.filter((a) => a.severity === 'critical').length} critical`
              : 'No critical'
          }
          color="bg-red-500/20"
        />
      </div>

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

      {/* Last updated footer */}
      {lastUpdated && (
        <p className="text-xs text-text-muted text-center">
          Last data update:{' '}
          {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
