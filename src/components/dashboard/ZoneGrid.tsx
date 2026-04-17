import { useCrowdStore } from '@/store/crowdStore'
import { Badge, congestionToBadgeVariant } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { Users, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

export function ZoneGrid() {
  const zones = useCrowdStore((s) => s.zones)

  if (zones.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-text-muted">
          No zone data yet. Seed the database or start the simulator.
        </p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {zones.map((zone, index) => {
        const ratio = zone.capacity > 0
          ? zone.currentCount / zone.capacity
          : 0
        const percentage = Math.round(ratio * 100)

        return (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-text-primary text-sm">
                    {zone.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {zone.currentCount.toLocaleString()} / {zone.capacity.toLocaleString()}
                  </p>
                </div>
                <Badge
                  variant={congestionToBadgeVariant(zone.congestionLevel)}
                  pulse={zone.congestionLevel === 'critical'}
                >
                  {zone.congestionLevel}
                </Badge>
              </div>

              {/* Capacity bar */}
              <div className="h-2 rounded-full bg-surface-light overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full transition-colors duration-500',
                    zone.congestionLevel === 'low' && 'bg-emerald-500',
                    zone.congestionLevel === 'medium' && 'bg-amber-500',
                    zone.congestionLevel === 'high' && 'bg-red-500',
                    zone.congestionLevel === 'critical' && 'bg-red-600'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {percentage}% full
                </span>
                {zone.congestionLevel === 'critical' && (
                  <span className="text-xs text-red-400 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Over capacity risk
                  </span>
                )}
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
