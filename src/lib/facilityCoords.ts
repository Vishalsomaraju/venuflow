// src/lib/facilityCoords.ts
// Canonical coord map for all 20 seeded facilities.
// In production these come from Firestore location field;
// here we place them accurately around the stadium perimeter.

export const STADIUM_CENTER = { lat: 17.4065, lng: 78.548 }
export const STADIUM_ZOOM = 17

// Pre-defined gate coords at the cardinal points of RGIS, Hyderabad
const GATE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Gate 1 (North)': { lat: 17.4083, lng: 78.548 },
  'Gate 2 (South)': { lat: 17.4047, lng: 78.548 },
  'Gate 3 (East)':  { lat: 17.4065, lng: 78.5503 },
  'Gate 4 (West)':  { lat: 17.4065, lng: 78.5457 },
}

/**
 * Returns the latitude/longitude for a given facility.
 * Gates use fixed real-world positions; everything else is
 * scattered in a deterministic ring around the stadium.
 */
export function getFacilityCoords(
  facilityName: string,
  facilityIndex: number
): { lat: number; lng: number } {
  const gate = GATE_COORDS[facilityName]
  if (gate) return gate

  const angleStep = (2 * Math.PI) / 16
  const angle = angleStep * (facilityIndex % 16)
  const radius = 0.0015 + (facilityIndex % 3) * 0.0005
  return {
    lat: STADIUM_CENTER.lat + Math.sin(angle) * radius,
    lng: STADIUM_CENTER.lng + Math.cos(angle) * radius,
  }
}
