// src/components/dashboard/ZoneCongestionGrid.tsx
import React, { useMemo } from 'react'
import { useVenueStore } from '@/store/venueStore'
import { Badge, congestionToBadgeVariant } from '@/components/ui/Badge'
import { ZoneCardSkeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { Users, Zap } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import type { CongestionLevel, Zone } from '@/types'

// ─── Colour maps ──────────────────────────────────────────────────
const barColor: Record<CongestionLevel, string> = {
  low: 'bg-accent-green',
  medium: 'bg-accent-amber',
  high: 'bg-orange-500',
  critical: 'bg-accent-red',
}

const cardGlow: Record<CongestionLevel, string> = {
  low: 'hover:shadow-[0_8px_32px_rgba(16,185,129,0.05)] ring-1 ring-surface-border',
  medium: 'hover:shadow-[0_8px_32px_rgba(245,158,11,0.05)] ring-1 ring-surface-border',
  high: 'shadow-[0_0_24px_rgba(245,158,11,0.1)] ring-1 ring-accent-amber/30',
  critical: 'shadow-[0_0_32px_rgba(244,63,94,0.15)] ring-1 ring-accent-red/40 bg-accent-red/5',
}

const congestionLabel: Record<CongestionLevel, string> = {
  low: 'Low',
  medium: 'Moderate',
  high: 'High',
  critical: 'Critical',
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

const PRIORITY: Record<CongestionLevel, number> = {
  critical: 3, high: 2, medium: 1, low: 0,
}

// ─── Memoized ZoneCard ────────────────────────────────────────────
const ZoneCard = React.memo(function ZoneCard({
  zone,
  isConnected,
}: {
  zone: Zone
  isConnected: boolean
}) {
  const ratio = zone.capacity > 0 ? zone.currentCount / zone.capacity : 0
  const pct = Math.min(Math.round(ratio * 100), 100)
  const isCritical = zone.congestionLevel === 'critical'

  return (
    <motion.div
      variants={cardVariants}
      layout
      className={cn(
        'group relative rounded-2xl bg-surface/80 backdrop-blur-xl p-5',
        'transition-all duration-300',
        cardGlow[zone.congestionLevel]
      )}
    >
      {isCritical && (
        <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-red opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-red" />
        </span>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold text-text-primary text-base tracking-tight leading-snug">
            {zone.name}
          </p>
          <p className="text-xs font-medium text-text-muted mt-1 tracking-wide uppercase">
            <span className="text-text-primary tabular-nums font-semibold">{zone.currentCount.toLocaleString()}</span> /{' '}
            <span className="tabular-nums">{zone.capacity.toLocaleString()}</span> cap
          </p>
        </div>
        <Badge variant={congestionToBadgeVariant(zone.congestionLevel)} pulse={isCritical}>
          {congestionLabel[zone.congestionLevel]}
        </Badge>
      </div>

      <div className="h-1.5 rounded-full bg-surface-light overflow-hidden mb-3">
        <motion.div
          className={cn('h-full rounded-full', barColor[zone.congestionLevel])}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between text-xs font-medium">
        <span className={cn('flex items-center gap-1.5', pct >= 90 ? 'text-accent-red' : 'text-text-muted')}>
          <Users className="h-3.5 w-3.5" />
          <span className="tabular-nums">{pct}%</span> full
        </span>
        {isConnected && (
          <span className="flex items-center gap-1.5 text-accent-green opacity-80">
            <Zap className="h-3.5 w-3.5" />
            Live
          </span>
        )}
      </div>
    </motion.div>
  )
}, (prev, next) => prev.zone.currentCount === next.zone.currentCount && prev.zone.capacity === next.zone.capacity && prev.zone.congestionLevel === next.zone.congestionLevel && prev.isConnected === next.isConnected)

// ─── Container ────────────────────────────────────────────────────
export function ZoneCongestionGrid() {
  const zones = useVenueStore((s) => s.zones)
  const isConnected = useVenueStore((s) => s.isConnected)

  const sorted = useMemo(
    () =>
      [...zones].sort(
        (a, b) =>
          PRIORITY[b.congestionLevel] - PRIORITY[a.congestionLevel] ||
          b.currentCount - a.currentCount
      ),
    [zones]
  )

  if (zones.length === 0) {
    if (isConnected) {
      return (
        <div className="rounded-2xl border border-dashed border-surface-border p-8 text-center bg-surface-light/30">
          <p className="text-text-muted mb-2">No venue data found.</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ZoneCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {sorted.map((zone) => (
        <ZoneCard key={zone.id} zone={zone} isConnected={isConnected} />
      ))}
    </motion.div>
  )
}
