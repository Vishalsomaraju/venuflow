import { useAuthStore } from '@/store/authStore'
import { useVenueStats } from '@/hooks/useVenueStats'
import { useIsConnected, useMostCongestedZone } from '@/hooks/useVenueSelectors'
import { AnimatedStatCard } from '@/components/dashboard/AnimatedStatCard'
import { ZoneCongestionGrid } from '@/components/dashboard/ZoneCongestionGrid'
import { RecentAlerts } from '@/components/dashboard/RecentAlerts'
import { CrowdChart } from '@/components/dashboard/CrowdChart'
import { FacilityTable } from '@/components/dashboard/FacilityTable'
import { SimulationControl } from '@/components/dashboard/SimulationControl'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import {
  Users,
  Clock,
  DoorOpen,
  AlertTriangle,
  Wifi,
  WifiOff,
  MapPin,
  KeyRound,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// ─── Section header ───────────────────────────────────────────────
function SectionHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {subtitle && (
        <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}

// ─── Dashboard ───────────────────────────────────────────────────
export function Dashboard() {
  const { appUser, user } = useAuthStore()
  const { elevateToStaff } = useAuthStore()
  const isStaff = useAuthStore((s) => s.isStaff())
  const navigate = useNavigate()
  const role = appUser?.role ?? 'guest'
  const isConnected = useIsConnected()
  const mostCongested = useMostCongestedZone()

  const { stats, isStale, lastSyncAt, isConnected: statsConnected } =
    useVenueStats({ refreshInterval: 2000, autoRefresh: true })

  const isLoading = !statsConnected && stats.totalCapacity === 0

  return (
    <div className="space-y-8">
      {/* ── Page Header ────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-bold text-text-primary tracking-tight"
          >
            Stadium Dashboard
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-sm text-text-secondary mt-1"
          >
            Real-time crowd intelligence
            {appUser?.displayName ? ` · ${appUser.displayName}` : ''}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex items-center gap-3 flex-wrap"
        >
          {/* Sim control — only for staff/admin */}
          {(role === 'staff' || role === 'admin') && <SimulationControl />}

          {/* Live / Stale / Offline indicator */}
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs border font-medium',
              isConnected && !isStale
                ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-400'
                : isStale
                  ? 'border-amber-500/30 bg-amber-500/8 text-amber-400'
                  : 'border-red-500/30 bg-red-500/8 text-red-400'
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
                : 'Offline'}
          </div>

          {/* Role badge */}
          <div
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium capitalize',
              role === 'admin'
                ? 'bg-purple-500/15 text-purple-400'
                : role === 'staff'
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-surface-light text-text-secondary'
            )}
          >
            {role}
            {user?.isAnonymous ? ' · guest' : ''}
          </div>
        </motion.div>
      </div>

      {/* ── Most-Congested Callout (conditional) ───────── */}
      {mostCongested &&
        (mostCongested.congestionLevel === 'high' ||
          mostCongested.congestionLevel === 'critical') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              'rounded-xl border p-4 flex items-center gap-3',
              mostCongested.congestionLevel === 'critical'
                ? 'border-red-500/40 bg-red-500/5'
                : 'border-orange-500/30 bg-orange-500/5'
            )}
          >
            <MapPin
              className={cn(
                'h-5 w-5 shrink-0',
                mostCongested.congestionLevel === 'critical'
                  ? 'text-red-400'
                  : 'text-orange-400'
              )}
            />
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Highest congestion:{' '}
                <span>{mostCongested.name}</span>
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {mostCongested.currentCount.toLocaleString()} of{' '}
                {mostCongested.capacity.toLocaleString()} capacity (
                {Math.round(
                  (mostCongested.currentCount / mostCongested.capacity) *
                    100
                )}
                %)
              </p>
            </div>
          </motion.div>
        )}

      {/* ── Section 1: Stat Cards ───────────────────────── */}
      <section>
        <SectionHeader
          title="Key Metrics"
          subtitle="Auto-refreshed every 2 seconds"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
          {isLoading ? (
            Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              {/* Total Attendees */}
              <AnimatedStatCard
                icon={Users}
                label="Total Attendees"
                numericValue={stats.totalAttendees}
                subtitle={`${stats.occupancyPercent}% venue capacity`}
                iconBg="bg-blue-500/20"
                iconColor="text-blue-400"
                delay={0}
                trend={
                  stats.occupancyPercent > 85
                    ? 'up'
                    : stats.occupancyPercent < 40
                      ? 'down'
                      : 'stable'
                }
              />

              {/* Average Wait Time */}
              <AnimatedStatCard
                icon={Clock}
                label="Avg Wait Time"
                numericValue={stats.averageWaitTime}
                unit="min"
                subtitle="Across open facilities"
                iconBg="bg-amber-500/20"
                iconColor="text-amber-400"
                delay={0.07}
                highlight={stats.averageWaitTime > 20}
                trend={
                  stats.averageWaitTime > 20
                    ? 'up'
                    : stats.averageWaitTime < 5
                      ? 'down'
                      : 'stable'
                }
              />

              {/* Open Gates */}
              <AnimatedStatCard
                icon={DoorOpen}
                label="Open Gates"
                numericValue={stats.openGatesCount}
                subtitle={
                  stats.totalGatesCount > 0
                    ? `of ${stats.totalGatesCount} total`
                    : 'Awaiting data'
                }
                iconBg="bg-emerald-500/20"
                iconColor="text-emerald-400"
                delay={0.14}
                highlight={
                  stats.totalGatesCount > 0 &&
                  stats.openGatesCount < stats.totalGatesCount / 2
                }
              />

              {/* Active Alerts */}
              <AnimatedStatCard
                icon={AlertTriangle}
                label="Active Alerts"
                numericValue={stats.activeAlertCount}
                subtitle={
                  stats.criticalAlertCount > 0
                    ? `${stats.criticalAlertCount} critical`
                    : 'No critical alerts'
                }
                iconBg={
                  stats.criticalAlertCount > 0
                    ? 'bg-red-500/20'
                    : 'bg-surface-light'
                }
                iconColor={
                  stats.criticalAlertCount > 0
                    ? 'text-red-400'
                    : 'text-text-secondary'
                }
                delay={0.21}
                highlight={stats.criticalAlertCount > 0}
                trend={
                  stats.activeAlertCount > 3
                    ? 'up'
                    : stats.activeAlertCount === 0
                      ? 'down'
                      : 'stable'
                }
              />
            </>
          )}
        </div>
      </section>

      {/* ── Section 2: Zone Congestion Grid ────────────── */}
      <section>
        <SectionHeader
          title="Zone Status"
          subtitle={`${stats.criticalZoneCount > 0 ? `⚠ ${stats.criticalZoneCount} critical zone(s) — ` : ''}Live occupancy across all stadium zones`}
        />
        <div className="mt-4">
          <ZoneCongestionGrid />
        </div>
      </section>

      {/* ── Section 3: Chart + Recent Alerts ───────────── */}
      <section>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionHeader
              title="Crowd Density"
              subtitle="Attendance per zone over time"
            />
            <div className="mt-4">
              <CrowdChart />
            </div>
          </div>
          <div>
            <SectionHeader
              title="Recent Alerts"
              subtitle="Latest 5 of all active"
            />
            <div className="mt-4">
              <RecentAlerts />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Facility Wait Times ─────────────── */}
      <section>
        <SectionHeader
          title="Facility Wait Times"
          subtitle="Sorted by longest wait first"
        />
        <div className="mt-4">
          <FacilityTable />
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      {lastSyncAt && (
        <p className="text-xs text-text-muted text-center pb-4">
          Last sync:{' '}
          <span className="tabular-nums">{lastSyncAt.toLocaleTimeString()}</span>{' '}
          · Stats refresh every 2s
        </p>
      )}

      {/* ── Secret staff mode button ────────────────────── */}
      {!isStaff && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => { elevateToStaff(); navigate('/staff') }}
            className={cn(
              'flex items-center gap-2 rounded-full border border-surface-border bg-surface/80',
              'backdrop-blur-sm px-3 py-2 text-xs text-text-muted',
              'hover:border-accent/40 hover:text-accent transition-all duration-200 shadow-lg',
              'opacity-30 hover:opacity-100'
            )}
            title="Enter Staff Mode"
            aria-label="Enter Staff Mode"
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            Staff Mode
          </button>
        </div>
      )}
    </div>
  )
}
