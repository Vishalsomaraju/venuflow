import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  subtitle?: string
  color: string
  trend?: 'up' | 'down' | 'stable'
  animate?: boolean
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  animate = true,
}: StatCardProps) {
  const Wrapper = animate ? motion.div : 'div'
  const wrapperProps = animate
    ? {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3 },
      }
    : {}

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'rounded-xl border border-surface-border bg-surface p-5',
        'flex items-center gap-4'
      )}
    >
      <div className={cn('rounded-lg p-3', color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text-secondary truncate">{label}</p>
        <p className="text-2xl font-bold text-text-primary">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
    </Wrapper>
  )
}
