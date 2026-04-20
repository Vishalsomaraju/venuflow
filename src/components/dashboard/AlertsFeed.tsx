// src/components/dashboard/AlertsFeed.tsx
import { useVenueStore } from '@/store/venueStore'
import { Badge, severityToBadgeVariant } from '@/components/ui/Badge'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { Bell, AlertTriangle, Info, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  critical: XCircle,
}

export function AlertsFeed() {
  const alerts = useVenueStore((s) => s.alerts)
  const zones = useVenueStore((s) => s.zones)
  const liveMode = alerts.some((alert) => alert.severity === 'critical')
    ? 'assertive'
    : 'polite'
  const zoneNameById = useMemo(
    () => new Map(zones.map((zone) => [zone.id, zone.name] as const)),
    [zones]
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-text-secondary" />
            <h3 className="font-semibold text-text-primary">Live Alerts</h3>
          </div>
          {alerts.length > 0 && (
            <Badge variant="danger" pulse>
              {alerts.length} active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-text-muted text-sm py-4 text-center">
            No active alerts — all systems normal
          </p>
        ) : (
          <div
            className="space-y-2 max-h-64 overflow-y-auto"
            aria-live={liveMode}
            aria-atomic="false"
            aria-relevant="additions"
          >
            <AnimatePresence mode="popLayout">
              {alerts.slice(0, 10).map((alert) => {
                const Icon =
                  severityIcons[
                    alert.severity as keyof typeof severityIcons
                  ] || Info

                return (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={cn(
                      'flex items-start gap-3 rounded-lg p-3',
                      'border border-surface-border bg-surface-light/50'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 mt-0.5 shrink-0',
                        alert.severity === 'critical' && 'text-red-400',
                        alert.severity === 'warning' && 'text-amber-400',
                        alert.severity === 'info' && 'text-blue-400'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary leading-snug">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={severityToBadgeVariant(alert.severity)}
                        >
                          {alert.severity}
                        </Badge>
                        {alert.zoneId && (
                          <span className="text-xs text-text-muted">
                            {zoneNameById.get(alert.zoneId) ?? alert.zoneId}
                          </span>
                        )}
                        {alert.createdAt && (
                          <span className="text-xs text-text-muted">
                            {formatDistanceToNow(
                              alert.createdAt instanceof Date
                                ? alert.createdAt
                                : new Date(),
                              { addSuffix: true }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
