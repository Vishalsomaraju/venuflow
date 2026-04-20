// src/hooks/useAnimatedCounter.ts
import { useEffect, useRef } from 'react'
import {
  useMotionValue,
  useSpring,
  useMotionValueEvent,
} from 'framer-motion'
import { useState } from 'react'

interface UseAnimatedCounterOptions {
  /** Desired target value */
  value: number
  /** Spring stiffness — higher = snappier */
  stiffness?: number
  /** Spring damping */
  damping?: number
  /** Format the output number to a string */
  format?: (n: number) => string
}

/**
 * Smoothly animates from the previous value to the next value
 * using a spring. Returns a live string you can render directly.
 *
 * @example
 * const display = useAnimatedCounter({ value: stats.totalAttendees })
 * return <span>{display}</span>
 */
export function useAnimatedCounter({
  value,
  stiffness = 60,
  damping = 20,
  format = (n) => Math.round(n).toLocaleString(),
}: UseAnimatedCounterOptions): string {
  const motionValue = useMotionValue(value)
  const spring = useSpring(motionValue, { stiffness, damping })
  const [display, setDisplay] = useState(format(value))
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (prevValueRef.current === value) return
    prevValueRef.current = value
    motionValue.set(value)
  }, [motionValue, value])

  useMotionValueEvent(spring, 'change', (latest) => {
    setDisplay(format(latest))
  })

  return display
}
