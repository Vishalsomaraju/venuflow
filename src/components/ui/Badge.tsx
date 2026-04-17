/* eslint-disable react-refresh/only-export-components */
import { cn } from '@/lib/utils'
import type { CongestionLevel, AlertSeverity } from '@/types'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
  pulse?: boolean
}

const variantStyles = {
  default: 'bg-surface-light text-text-secondary',
  success: 'bg-emerald-500/15 text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-400',
  danger: 'bg-red-500/15 text-red-400',
  info: 'bg-blue-500/15 text-blue-400',
}

export function Badge({ children, variant = 'default', className, pulse }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {pulse && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full animate-pulse',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'danger' && 'bg-red-400',
            variant === 'info' && 'bg-blue-400',
            variant === 'default' && 'bg-text-secondary'
          )}
        />
      )}
      {children}
    </span>
  )
}

export function congestionToBadgeVariant(
  level: CongestionLevel
): BadgeProps['variant'] {
  switch (level) {
    case 'low': return 'success'
    case 'medium': return 'warning'
    case 'high': return 'danger'
    case 'critical': return 'danger'
    default: return 'default'
  }
}

export function severityToBadgeVariant(
  severity: AlertSeverity
): BadgeProps['variant'] {
  switch (severity) {
    case 'info': return 'info'
    case 'warning': return 'warning'
    case 'critical': return 'danger'
    default: return 'default'
  }
}
