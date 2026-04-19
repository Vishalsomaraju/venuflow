// src/test/venueUtils.test.ts
// Tests 1, 2, 6 — pure utility functions (no mocks needed)

import { describe, it, expect } from 'vitest'
import {
  calcCongestionLevel,
  sortFacilitiesByWait,
  findNearestOpenFacility,
  formatWaitTime,
} from '@/lib/venueUtils'
import { mockFacilities } from './mocks/venueStore'
import type { Facility } from '@/types'

// ─── Test 1: congestionLevel calculator ──────────────────────────
describe('calcCongestionLevel', () => {
  it('returns "low" when under 50% capacity', () => {
    expect(calcCongestionLevel(4999, 10000)).toBe('low')
    expect(calcCongestionLevel(0, 10000)).toBe('low')
    expect(calcCongestionLevel(400, 2000)).toBe('low') // 20%
  })

  it('returns "medium" when between 50% and 75%', () => {
    expect(calcCongestionLevel(5000, 10000)).toBe('medium') // 50%
    expect(calcCongestionLevel(7499, 10000)).toBe('medium') // 74.99%
    expect(calcCongestionLevel(6000, 10000)).toBe('medium') // 60%
  })

  it('returns "high" when between 75% and 90%', () => {
    expect(calcCongestionLevel(7500, 10000)).toBe('high') // 75%
    expect(calcCongestionLevel(8999, 10000)).toBe('high') // 89.99%
    expect(calcCongestionLevel(12000, 15000)).toBe('high') // 80%
  })

  it('returns "critical" at or above 90% capacity', () => {
    expect(calcCongestionLevel(9000, 10000)).toBe('critical') // 90%
    expect(calcCongestionLevel(10000, 10000)).toBe('critical') // 100%
    expect(calcCongestionLevel(480, 500)).toBe('critical') // 96%
  })

  it('returns "low" for zero or negative capacity', () => {
    expect(calcCongestionLevel(100, 0)).toBe('low')
    expect(calcCongestionLevel(0, 0)).toBe('low')
  })

  it('calcCongestionLevel returns low for negative capacity', () => {
    expect(calcCongestionLevel(100, -1)).toBe('low')
  })
})

// ─── Test 2: sortFacilitiesByWait ────────────────────────────────
describe('sortFacilitiesByWait', () => {
  it('sorts open facilities by waitMinutes ascending', () => {
    const sorted = sortFacilitiesByWait(mockFacilities)
    const openSorted = sorted.filter((f) => f.isOpen)

    for (let i = 0; i < openSorted.length - 1; i++) {
      expect(openSorted[i]!.waitMinutes).toBeLessThanOrEqual(
        openSorted[i + 1]!.waitMinutes
      )
    }
  })

  it('pushes closed facilities to the end', () => {
    type FacilityLike = Pick<Facility, 'id' | 'name' | 'type' | 'location' | 'waitMinutes' | 'zoneId' | 'isOpen'>
    const sorted = sortFacilitiesByWait(mockFacilities) as FacilityLike[]
    const lastOpen = sorted.findLastIndex((f: FacilityLike) => f.isOpen)
    const firstClosed = sorted.findIndex((f: FacilityLike) => !f.isOpen)

    // All closed facilities should come after all open ones
    if (firstClosed !== -1 && lastOpen !== -1) {
      expect(lastOpen).toBeLessThan(firstClosed)
    }
  })

  it('does not mutate the original array', () => {
    const original = [...mockFacilities]
    sortFacilitiesByWait(mockFacilities)
    expect(mockFacilities).toEqual(original)
  })

  it('handles empty arrays', () => {
    expect(sortFacilitiesByWait([])).toEqual([])
  })

  it('handles single-element arrays', () => {
    expect(sortFacilitiesByWait([mockFacilities[0]!])).toHaveLength(1)
  })
})

// ─── Test 6: nearest facility finder ────────────────────────────
describe('findNearestOpenFacility', () => {
  // User is very close to Gate 1 (North): lat 17.4083, lng 78.548
  const userLat = 17.409
  const userLng = 78.548

  it('returns the geographically nearest open facility', () => {
    const result = findNearestOpenFacility(userLat, userLng, mockFacilities)
    // Gate 1 (North) is closest to the user location
    expect(result).not.toBeNull()
    expect(result!.id).toBe('f1')
  })

  it('filters by facility type', () => {
    const result = findNearestOpenFacility(
      userLat,
      userLng,
      mockFacilities,
      'restroom'
    )
    // Only open restrooms: f3 (Restroom North A at 17.407)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('restroom')
    expect(result!.isOpen).toBe(true)
    expect(result!.id).toBe('f3')
  })

  it('excludes closed facilities', () => {
    const result = findNearestOpenFacility(
      userLat,
      userLng,
      mockFacilities,
      'restroom'
    )
    // f4 (Restroom South A) is closed — should not be returned
    expect(result?.id).not.toBe('f4')
  })

  it('returns null when no open facilities of that type exist', () => {
    const allClosed = mockFacilities.map((f) => ({ ...f, isOpen: false }))
    expect(findNearestOpenFacility(userLat, userLng, allClosed)).toBeNull()
  })

  it('returns null for empty facilities array', () => {
    expect(findNearestOpenFacility(userLat, userLng, [])).toBeNull()
  })
})

// ─── Test: formatWaitTime util ────────────────────────────────────
describe('formatWaitTime', () => {
  it('returns "No wait" for 0', () =>
    expect(formatWaitTime(0)).toBe('No wait'))
  it('formats minutes under 60', () =>
    expect(formatWaitTime(15)).toBe('15 min'))
  it('formats hours and minutes', () =>
    expect(formatWaitTime(90)).toBe('1h 30m'))
})
