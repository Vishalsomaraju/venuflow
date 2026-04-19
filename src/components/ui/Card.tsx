import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl bg-surface/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] ring-1 ring-surface-border',
        onClick && 'cursor-pointer hover:shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('px-6 pt-6 pb-3', className)}>
      {children}
    </div>
  )
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn('px-6 pb-6', className)}>{children}</div>
}
