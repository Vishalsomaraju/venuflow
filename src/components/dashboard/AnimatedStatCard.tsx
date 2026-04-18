// src/components/dashboard/AnimatedStatCard.tsx
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AnimatedStatCardProps {
  icon: LucideIcon
  label: string
  /** The raw numeric value to animate toward */
  numericValue: number
  /** Optional unit shown after the number (e.g. 'min', '%') */
  unit?: string
  /** Shown below the main value */
  subtitle?: string
  /** Tailwind bg class for the icon badge */
  iconBg: string
  /** Tailwind text class for the icon */
  iconColor: string
  trend?: 'up' | 'down' | 'stable'
  /** Custom formatter for the animated number */
  format?: (n: number) => string
  /** Motion stagger delay in seconds */
  delay?: number
  /** Highlight border when value is concerning */
  highlight?: boolean
}

const trendConfig = {
  up: { Icon: TrendingUp, color: 'text-emerald-400' },
  down: { Icon: TrendingDown, color: 'text-red-400' },
  stable: { Icon: Minus, color: 'text-text-muted' },
}

export function AnimatedStatCard({
  icon: Icon,
  label,
  numericValue,
  unit,
  subtitle,
  iconBg,
  iconColor,
  trend,
  format,
  delay = 0,
  highlight = false,
}: AnimatedStatCardProps) {
  const display = useAnimatedCounter({
    value: numericValue,
    format,
  })

  const TrendIcon = trend ? trendConfig[trend].Icon : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={cn(
        'group relative rounded-2xl border bg-surface p-5',
        'flex items-center gap-4 overflow-hidden',
        'transition-colors duration-300',
        highlight
          ? 'border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.08)]'
          : 'border-surface-border hover:border-accent/30'
      )}
      role="status"
      aria-live="polite"
    >
      {/* Subtle glow on hover */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
          'bg-gradient-to-br from-accent/5 to-transparent pointer-events-none'
        )}
      />

      {/* Icon badge */}
      <div
        className={cn(
          'relative z-10 rounded-xl p-3 shrink-0',
          'transition-transform duration-200 group-hover:scale-110',
          iconBg
        )}
      >
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-w-0 flex-1">
        <p className="text-sm text-text-secondary truncate">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-text-primary tabular-nums">
            {display}
          </span>
          {unit && (
            <span className="text-sm font-medium text-text-muted">{unit}</span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-text-muted mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {/* Trend indicator */}
      {TrendIcon && trend && (
        <div className={cn('shrink-0', trendConfig[trend].color)}>
          <TrendIcon className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  )
}
