// src/components/dashboard/ZoneCongestionGrid.tsx
import { useVenueStore } from '@/store/venueStore'
import { Badge, congestionToBadgeVariant } from '@/components/ui/Badge'
import { ZoneCardSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { Users, Zap } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import type { CongestionLevel } from '@/types'

// ─── Colour maps ──────────────────────────────────────────────────
const barColor: Record<CongestionLevel, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-600',
}

const cardGlow: Record<CongestionLevel, string> = {
  low: '',
  medium: '',
  high: 'shadow-[0_0_18px_rgba(249,115,22,0.12)]',
  critical: 'shadow-[0_0_24px_rgba(239,68,68,0.18)] border-red-500/30',
}

const congestionLabel: Record<CongestionLevel, string> = {
  low: 'Low',
  medium: 'Moderate',
  high: 'High',
  critical: 'Critical',
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

// ─── Component ────────────────────────────────────────────────────
export function ZoneCongestionGrid() {
  const zones = useVenueStore((s) => s.zones)
  const isConnected = useVenueStore((s) => s.isConnected)

  // Loading state — show 6 skeletons
  if (zones.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ZoneCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Sort: critical first, then by count descending
  const priority: Record<CongestionLevel, number> = {
    critical: 3,
    high: 2,
    medium: 1,
    low: 0,
  }
  const sorted = [...zones].sort(
    (a, b) =>
      priority[b.congestionLevel] - priority[a.congestionLevel] ||
      b.currentCount - a.currentCount
  )

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {sorted.map((zone) => {
        const ratio = zone.capacity > 0 ? zone.currentCount / zone.capacity : 0
        const pct = Math.min(Math.round(ratio * 100), 100)
        const isCritical = zone.congestionLevel === 'critical'

        return (
          <motion.div
            key={zone.id}
            variants={cardVariants}
            layout
            className={cn(
              'group relative rounded-2xl border border-surface-border bg-surface p-4',
              'transition-all duration-300 hover:border-accent/25',
              cardGlow[zone.congestionLevel]
            )}
          >
            {/* Critical pulse ring */}
            {isCritical && (
              <span className="absolute -top-px -right-px h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </span>
            )}

            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-text-primary text-sm leading-snug">
                  {zone.name}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {zone.currentCount.toLocaleString()} /{' '}
                  {zone.capacity.toLocaleString()} capacity
                </p>
              </div>
              <Badge
                variant={congestionToBadgeVariant(zone.congestionLevel)}
                pulse={isCritical}
              >
                {congestionLabel[zone.congestionLevel]}
              </Badge>
            </div>

            {/* Capacity bar */}
            <div className="h-2 rounded-full bg-surface-light overflow-hidden mb-2">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  barColor[zone.congestionLevel]
                )}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            </div>

            {/* Footer row */}
            <div className="flex items-center justify-between text-xs">
              <span
                className={cn(
                  'flex items-center gap-1',
                  pct >= 90 ? 'text-red-400' : 'text-text-muted'
                )}
              >
                <Users className="h-3 w-3" />
                {pct}% full
              </span>

              {isConnected && (
                <span className="flex items-center gap-1 text-emerald-500 opacity-70">
                  <Zap className="h-3 w-3" />
                  Live
                </span>
              )}
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
