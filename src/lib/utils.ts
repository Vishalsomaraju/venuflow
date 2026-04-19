/**
 * src/lib/utils.ts
 * General-purpose utility functions used across the VenueFlow application.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS class names together, resolving conflicts intelligently.
 * Wraps `clsx` (conditional classes) and `tailwind-merge` (deduplication).
 *
 * @param inputs - Any number of class values, objects, or arrays.
 * @returns A single merged class string.
 *
 * @example
 * ```ts
 * cn('px-4 py-2', isActive && 'bg-accent', 'px-6') // → 'py-2 bg-accent px-6'
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats a wait time (in minutes) into a human-readable string.
 * - 0 minutes → "No wait"
 * - < 60 minutes → "N min"
 * - ≥ 60 minutes → "Xh Ym"
 *
 * @param minutes - Non-negative integer representing wait time.
 * @returns A formatted wait time string.
 *
 * @example
 * ```ts
 * formatWaitTime(0)   // → 'No wait'
 * formatWaitTime(15)  // → '15 min'
 * formatWaitTime(90)  // → '1h 30m'
 * ```
 */
export function formatWaitTime(minutes: number): string {
  if (minutes === 0) return 'No wait'
  if (minutes < 60) return `${minutes} min`
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hrs}h ${mins}m`
}

export function sanitizeInput(raw: string): string {
  return raw
    .replace(/[<>]/g, '')        // strip HTML
    .replace(/\{.*?\}/g, '')     // strip template injections
    .trim()
    .slice(0, 500)               // hard length cap
}
