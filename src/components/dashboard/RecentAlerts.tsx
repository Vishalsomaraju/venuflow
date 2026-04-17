// src/components/dashboard/RecentAlerts.tsx
import { useVenueStore } from '@/store/venueStore'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AlertSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { Bell, Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import type { AlertSeverity } from '@/types'

// ─── Config ───────────────────────────────────────────────────────
const severityConfig: Record<
  AlertSeverity,
  {
    Icon: typeof Info
    iconColor: string
    bgColor: string
    borderColor: string
    badgeVariant: 'info' | 'warning' | 'danger'
  }
> = {
  info: {
    Icon: Info,
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-500/8',
    borderColor: 'border-blue-500/20',
    badgeVariant: 'info',
  },
  warning: {
    Icon: AlertTriangle,
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/8',
    borderColor: 'border-amber-500/20',
    badgeVariant: 'warning',
  },
  critical: {
    Icon: XCircle,
    iconColor: 'text-red-400',
    bgColor: 'bg-red-500/8',
    borderColor: 'border-red-500/20',
    badgeVariant: 'danger',
  },
}

// ─── Component ────────────────────────────────────────────────────
export function RecentAlerts() {
  const alerts = useVenueStore((s) => s.alerts)
  const isConnected = useVenueStore((s) => s.isConnected)

  // Show skeletons while connecting and no data yet
  const isLoading = !isConnected && alerts.length === 0

  // Most recent 5, sorted by createdAt desc
  const recent = [...alerts]
    .sort((a, b) => {
      const aTime =
        a.createdAt instanceof Date ? a.createdAt.getTime() : 0
      const bTime =
        b.createdAt instanceof Date ? b.createdAt.getTime() : 0
      return bTime - aTime
    })
    .slice(0, 5)

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'rounded-lg p-1.5',
                criticalCount > 0 ? 'bg-red-500/15' : 'bg-surface-light'
              )}
            >
              <Bell
                className={cn(
                  'h-4 w-4',
                  criticalCount > 0 ? 'text-red-400' : 'text-text-secondary'
                )}
              />
            </div>
            <h3 className="font-semibold text-text-primary">Recent Alerts</h3>
          </div>

          <div className="flex items-center gap-2">
            {alerts.length > 0 && (
              <span className="text-xs text-text-muted">
                {alerts.length} active
              </span>
            )}
            {criticalCount > 0 && (
              <Badge variant="danger" pulse>
                {criticalCount} critical
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <AlertSkeleton key={i} />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center gap-2"
          >
            <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
            <p className="text-sm font-medium text-text-secondary">
              All Clear
            </p>
            <p className="text-xs text-text-muted">
              No active alerts — venue is running smoothly
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            <div className="space-y-2">
              {recent.map((alert) => {
                const config =
                  severityConfig[alert.severity as AlertSeverity] ??
                  severityConfig.info
                const { Icon, iconColor, bgColor, borderColor, badgeVariant } =
                  config

                const timeAgo =
                  alert.createdAt instanceof Date
                    ? formatDistanceToNow(alert.createdAt, { addSuffix: true })
                    : 'recently'

                return (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-3',
                      bgColor,
                      borderColor
                    )}
                  >
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      <Icon className={cn('h-4.5 w-4.5', iconColor)} />
                    </div>

                    {/* Body */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary leading-snug">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant={badgeVariant}>
                          {alert.severity}
                        </Badge>
                        {alert.zoneId && (
                          <span className="text-xs text-text-muted">
                            Zone: {alert.zoneId}
                          </span>
                        )}
                        <span className="text-xs text-text-muted ml-auto">
                          {timeAgo}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </AnimatePresence>
        )}

        {alerts.length > 5 && (
          <p className="text-xs text-text-muted text-center mt-3">
            +{alerts.length - 5} more alerts
          </p>
        )}
      </CardContent>
    </Card>
  )
}
