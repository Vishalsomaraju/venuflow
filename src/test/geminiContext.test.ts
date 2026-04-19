// src/test/geminiContext.test.ts
// Test 3: buildVenueSystemPrompt — checks that context string
// contains actual venue data from the snapshot.

import { describe, it, expect } from 'vitest'
import { buildVenueSystemPrompt, buildQuickContextLine } from '@/lib/geminiContext'
import { mockZones, mockFacilities, mockAlerts } from './mocks/venueStore'

const snapshot = {
  zones: mockZones,
  facilities: mockFacilities,
  alerts: mockAlerts,
  totalAttendees: mockZones.reduce((s, z) => s + z.currentCount, 0),
  totalCapacity: mockZones.reduce((s, z) => s + z.capacity, 0),
}

describe('buildVenueSystemPrompt', () => {
  it('returns a non-empty string', () => {
    const prompt = buildVenueSystemPrompt(snapshot)
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(100)
  })

  it('includes zone names from the snapshot', () => {
    const prompt = buildVenueSystemPrompt(snapshot)
    expect(prompt).toContain('North Stand')
    expect(prompt).toContain('VIP Box')
    expect(prompt).toContain('Fan Zone A')
  })

  it('includes congestion levels in uppercase', () => {
    const prompt = buildVenueSystemPrompt(snapshot)
    expect(prompt).toContain('HIGH')
    expect(prompt).toContain('CRITICAL')
    expect(prompt).toContain('LOW')
  })

  it('includes facility names and wait times', () => {
    const prompt = buildVenueSystemPrompt(snapshot)
    expect(prompt).toContain('Gate 1 (North)')
    expect(prompt).toContain('15 min wait')
    expect(prompt).toContain('Gate 2 (South)')
    expect(prompt).toContain('3 min wait')
  })

  it('marks closed facilities as CLOSED', () => {
    const prompt = buildVenueSystemPrompt(snapshot)
    // Restroom South A is closed (isOpen: false)
    expect(prompt).toContain('Restroom South A: CLOSED')
  })

  it('includes active alert messages', () => {
    const prompt = buildVenueSystemPrompt(snapshot)
    expect(prompt).toContain('VIP Box at critical capacity')
    expect(prompt).toContain('[CRITICAL]')
  })

  it('calculates correct occupancy percentage', () => {
    const totalAttendees = snapshot.totalAttendees
    const totalCapacity = snapshot.totalCapacity
    const expectedPct = Math.round((totalAttendees / totalCapacity) * 100)
    const prompt = buildVenueSystemPrompt(snapshot)
    expect(prompt).toContain(`${expectedPct}%`)
  })

  it('shows "None currently active" when no active alerts', () => {
    const noAlertSnapshot = {
      ...snapshot,
      alerts: [],
    }
    const prompt = buildVenueSystemPrompt(noAlertSnapshot)
    expect(prompt).toContain('None currently active')
  })

  it('handles empty zones array gracefully', () => {
    const prompt = buildVenueSystemPrompt({
      zones: [], facilities: [], alerts: [],
      totalAttendees: 0, totalCapacity: 0,
    })
    expect(prompt).toContain('No zone data available')
  })
})

describe('buildQuickContextLine', () => {
  it('returns a string with occupancy percentage and alert count', () => {
    const line = buildQuickContextLine(snapshot)
    expect(typeof line).toBe('string')
    expect(line).toMatch(/\d+%/)
    expect(line).toMatch(/\d+ critical alert/)
  })

  it('shows 0% when capacity is 0', () => {
    const line = buildQuickContextLine({ ...snapshot, totalCapacity: 0, totalAttendees: 0 })
    expect(line).toContain('0%')
  })
})
