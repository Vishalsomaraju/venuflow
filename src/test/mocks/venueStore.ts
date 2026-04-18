// src/test/mocks/venueStore.ts
// Factory for creating mock venueStore state for component tests.
import { vi } from 'vitest'
import type { Zone, Facility, Alert } from '@/types'

export const mockZones: Zone[] = [
  {
    id: 'z1',
    name: 'North Stand',
    currentCount: 12000,
    capacity: 15000,
    congestionLevel: 'high',
    coordinates: [],
    updatedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: 'z2',
    name: 'VIP Box',
    currentCount: 480,
    capacity: 500,
    congestionLevel: 'critical',
    coordinates: [],
    updatedAt: new Date(),
    createdAt: new Date(),
  },
  {
    id: 'z3',
    name: 'Fan Zone A',
    currentCount: 400,
    capacity: 2000,
    congestionLevel: 'low',
    coordinates: [],
    updatedAt: new Date(),
    createdAt: new Date(),
  },
]

export const mockFacilities: Facility[] = [
  {
    id: 'f1',
    name: 'Gate 1 (North)',
    type: 'gate',
    waitMinutes: 15,
    isOpen: true,
    zoneId: 'z1',
    location: { lat: 17.4083, lng: 78.548 },
  },
  {
    id: 'f2',
    name: 'Gate 2 (South)',
    type: 'gate',
    waitMinutes: 3,
    isOpen: true,
    zoneId: 'z2',
    location: { lat: 17.4047, lng: 78.548 },
  },
  {
    id: 'f3',
    name: 'Restroom North A',
    type: 'restroom',
    waitMinutes: 8,
    isOpen: true,
    zoneId: 'z1',
    location: { lat: 17.407, lng: 78.549 },
  },
  {
    id: 'f4',
    name: 'Restroom South A',
    type: 'restroom',
    waitMinutes: 2,
    isOpen: false, // closed
    zoneId: 'z2',
    location: { lat: 17.405, lng: 78.547 },
  },
  {
    id: 'f5',
    name: 'Burger Stand A',
    type: 'concession',
    waitMinutes: 20,
    isOpen: true,
    zoneId: 'z3',
    location: { lat: 17.408, lng: 78.546 },
  },
]

export const mockAlerts: Alert[] = [
  {
    id: 'a1',
    message: 'VIP Box at critical capacity',
    severity: 'critical',
    zoneId: 'z2',
    active: true,
    createdAt: new Date(),
    resolvedAt: null,
  },
]

/**
 * Returns a partial venueStore state object suitable for vi.mock.
 */
export function makeMockVenueStore(overrides: Partial<{
  zones: Zone[]
  facilities: Facility[]
  alerts: Alert[]
  isConnected: boolean
}> = {}) {
  const zones = overrides.zones ?? mockZones
  const facilities = overrides.facilities ?? mockFacilities
  const alerts = overrides.alerts ?? mockAlerts
  const isConnected = overrides.isConnected ?? true

  return {
    zones,
    facilities,
    alerts,
    isConnected,
    loadingZones: false,
    loadingFacilities: false,
    loadingAlerts: false,
    subscribeToAll: vi.fn(),
    unsubscribeAll: vi.fn(),
  }
}
