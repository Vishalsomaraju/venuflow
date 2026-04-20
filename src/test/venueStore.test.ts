import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/firebase', () => ({ db: {} }))

vi.mock('firebase/firestore', () => ({
  Timestamp: class {
    toDate(): Date {
      return new Date()
    }
  },
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn((_, next) => {
    next({ docs: [] })
    return vi.fn()
  }),
}))

import { useVenueStore } from '@/store/venueStore'

describe('useVenueStore', () => {
  beforeEach(() => {
    useVenueStore.setState({
      zones: [],
      facilities: [],
      alerts: [],
      isSubscribed: false,
      isConnected: false,
      lastSyncAt: null,
      subscriptionError: null,
      _unsubscribers: [],
    })
  })

  it('starts with empty zones', () => {
    expect(useVenueStore.getState().zones).toEqual([])
  })

  it('setZones updates state correctly', () => {
    useVenueStore.getState().setZones([
      {
        id: 'z1',
        name: 'Test Zone',
        currentCount: 100,
        capacity: 500,
        congestionLevel: 'low',
        coordinates: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    expect(useVenueStore.getState().zones).toHaveLength(1)
    expect(useVenueStore.getState().zones[0]?.name).toBe('Test Zone')
  })

  it('isConnected becomes true after setZones', () => {
    useVenueStore.getState().setZones([
      {
        id: 'z2',
        name: 'North Stand',
        currentCount: 250,
        capacity: 1000,
        congestionLevel: 'medium',
        coordinates: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    expect(useVenueStore.getState().isConnected).toBe(true)
  })
})
