import { describe, it, expect } from 'vitest'
import {
  calcCongestionLevel,
  sortFacilitiesByWait,
  getOpenFacilities
} from '../lib/venueUtils'
import { buildGeminiContext } from '../lib/geminiContext'
import type { Facility, Zone } from '../types'

describe('congestion pure functions', () => {
  it('returns low below 50%, medium 50-75%, high 75-90%, critical above 90%', () => {
    expect(calcCongestionLevel(40, 100)).toBe('low')
    expect(calcCongestionLevel(50, 100)).toBe('medium')
    expect(calcCongestionLevel(75, 100)).toBe('high')
    expect(calcCongestionLevel(90, 100)).toBe('critical')
  })

  it('sortFacilitiesByWait(facilities) returns array sorted ascending by waitMinutes', () => {
    const facilities: Facility[] = [
      { id: '1', name: 'A', waitMinutes: 10, isOpen: true, type: 'gate', zoneId: 'z1', location: { lat: 0, lng: 0 } },
      { id: '2', name: 'B', waitMinutes: 5, isOpen: true, type: 'gate', zoneId: 'z1', location: { lat: 0, lng: 0 } },
      { id: '3', name: 'C', waitMinutes: 15, isOpen: true, type: 'gate', zoneId: 'z1', location: { lat: 0, lng: 0 } },
    ]
    const sorted = sortFacilitiesByWait(facilities)
    expect(sorted[0]?.name).toBe('B')
    expect(sorted[1]?.name).toBe('A')
    expect(sorted[2]?.name).toBe('C')
  })

  it('getOpenFacilities(facilities) returns only facilities where isOpen is true', () => {
    const facilities: Facility[] = [
      { id: '1', name: 'A', waitMinutes: 10, isOpen: true, type: 'gate', zoneId: 'z1', location: { lat: 0, lng: 0 } },
      { id: '2', name: 'B', waitMinutes: 5, isOpen: false, type: 'gate', zoneId: 'z1', location: { lat: 0, lng: 0 } },
    ]
    const open = getOpenFacilities(facilities)
    expect(open).toHaveLength(1)
    expect(open[0]?.name).toBe('A')
  })

  it('buildGeminiContext(zones, facilities, alerts) returns non-empty string containing zone names', () => {
    const zones: Zone[] = [
      {
        id: 'z1',
        name: 'North Gate',
        currentCount: 10,
        capacity: 100,
        congestionLevel: 'low',
        coordinates: [],
      }
    ]
    const ctx = buildGeminiContext(zones, [], [])
    expect(ctx.length).toBeGreaterThan(0)
    expect(ctx).toContain('North Gate')
  })
})
