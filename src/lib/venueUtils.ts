// src/lib/venueUtils.ts
// Pure utility functions — no Firebase, no Zustand.
// Designed to be easily unit-tested.

import type { CongestionLevel, Facility } from '@/types'

// ─── 1. Congestion level calculator ──────────────────────────────
/**
 * Returns the congestion level for a zone given its current
 * occupancy. Thresholds:
 *  < 50%  → low
 *  < 75%  → medium
 *  < 90%  → high
 *  >= 90% → critical
 */
export function calcCongestionLevel(
  currentCount: number,
  capacity: number
): CongestionLevel {
  if (capacity <= 0) return 'low'
  const ratio = currentCount / capacity
  if (ratio >= 0.9) return 'critical'
  if (ratio >= 0.75) return 'high'
  if (ratio >= 0.5) return 'medium'
  return 'low'
}

// ─── 2. Sort facilities by wait time ─────────────────────────────
/**
 * Returns a new array of facilities sorted by waitMinutes ascending.
 * Closed facilities are pushed to the end, then sorted within.
 */
export function sortFacilitiesByWait(
  facilities: Pick<Facility, 'id' | 'name' | 'waitMinutes' | 'isOpen' | 'type' | 'zoneId' | 'location'>[]
): typeof facilities {
  return [...facilities].sort((a, b) => {
    // Open first
    if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1
    return a.waitMinutes - b.waitMinutes
  })
}

// ─── 3. Nearest facility finder ───────────────────────────────────
/**
 * Given a user's lat/lng and an array of facilities (with location),
 * returns the nearest *open* facility of the specified type.
 * Uses Euclidean distance (fine for short distances within a stadium).
 */
export function findNearestOpenFacility(
  userLat: number,
  userLng: number,
  facilities: Facility[],
  type?: Facility['type']
): Facility | null {
  const candidates = facilities.filter(
    (f) => f.isOpen && (type === undefined || f.type === type)
  )
  if (candidates.length === 0) return null

  let nearest: Facility = candidates[0]!
  let minDist = Infinity

  for (const f of candidates) {
    const dlat = f.location.lat - userLat
    const dlng = f.location.lng - userLng
    const dist = Math.sqrt(dlat * dlat + dlng * dlng)
    if (dist < minDist) {
      minDist = dist
      nearest = f
    }
  }

  return nearest
}

// ─── 4. Badge variant helper ──────────────────────────────────────
export type BadgeVariant = 'success' | 'warning' | 'danger' | 'critical' | 'default'

export function congestionToBadgeVariant(level: CongestionLevel): BadgeVariant {
  switch (level) {
    case 'low':      return 'success'
    case 'medium':   return 'warning'
    case 'high':     return 'danger'
    case 'critical': return 'critical'
  }
}
