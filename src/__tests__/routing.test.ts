import { describe, it, expect } from 'vitest'
import { findNearestOpenFacility, getLeastCongestedGate } from '../lib/venueUtils'
import type { Facility, Zone } from '../types'

describe('routing pure functions', () => {
  it('getNearestFacility(userLat, userLng, facilities) returns the facility with shortest distance', () => {
    const facilities: Facility[] = [
      { id: '1', name: 'Far Gate', waitMinutes: 0, isOpen: true, type: 'gate', zoneId: 'z1', location: { lat: 10, lng: 10 } },
      { id: '2', name: 'Near Gate', waitMinutes: 0, isOpen: true, type: 'gate', zoneId: 'z1', location: { lat: 1, lng: 1 } },
    ]
    const nearest = findNearestOpenFacility(0, 0, facilities)
    expect(nearest?.name).toBe('Near Gate')
  })

  it('getLeastCongestedGate(zones, facilities) returns gate in zone with lowest congestionLevel', () => {
    const zones: Zone[] = [
      { id: 'z1', name: 'Zone 1', currentCount: 95, capacity: 100, congestionLevel: 'critical', coordinates: [] },
      { id: 'z2', name: 'Zone 2', currentCount: 10, capacity: 100, congestionLevel: 'low', coordinates: [] },
    ]
    const facilities: Facility[] = [
      { id: '1', name: 'Critical Gate', waitMinutes: 0, isOpen: true, type: 'gate', zoneId: 'z1', location: { lat: 0, lng: 0 } },
      { id: '2', name: 'Low Gate', waitMinutes: 0, isOpen: true, type: 'gate', zoneId: 'z2', location: { lat: 0, lng: 0 } },
    ]
    const bestGate = getLeastCongestedGate(zones, facilities)
    expect(bestGate?.name).toBe('Low Gate')
  })
})
