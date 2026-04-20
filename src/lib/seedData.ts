/**
 * src/lib/seedData.ts
 *
 * Seeds Firestore with STABLE document IDs that match the hardcoded IDs
 * in src/lib/simulator.ts so the simulator's Firestore writes actually
 * reach the seeded documents.
 *
 * Called from the Admin panel "Seed Database" button.
 */
import { auth, db } from './firebase'
import { collection, writeBatch, doc } from 'firebase/firestore'
import type { Zone, Facility, FacilityType } from '@/types'
import { getFacilityCoords } from '@/lib/facilityCoords'

// ─── Zone definitions (IDs match simulator.ts ZONE_CONFIGS) ───────
const ZONES: {
  id: string
  name: string
  capacity: number
  baseLoad: number
}[] = [
  { id: 'north-stand', name: 'North Stand', capacity: 15000, baseLoad: 0.55 },
  { id: 'south-stand', name: 'South Stand', capacity: 15000, baseLoad: 0.8 },
  { id: 'east-wing', name: 'East Wing', capacity: 10000, baseLoad: 0.3 },
  { id: 'west-wing', name: 'West Wing', capacity: 10000, baseLoad: 0.85 },
  {
    id: 'main-concourse',
    name: 'Main Concourse',
    capacity: 5000,
    baseLoad: 0.45,
  },
  { id: 'vip-lounge', name: 'VIP Box', capacity: 500, baseLoad: 0.25 },
  {
    id: 'upper-deck-east',
    name: 'Upper Deck East',
    capacity: 8000,
    baseLoad: 0.4,
  },
  {
    id: 'upper-deck-west',
    name: 'Upper Deck West',
    capacity: 8000,
    baseLoad: 0.35,
  },
  { id: 'fan-zone-a', name: 'Fan Zone A', capacity: 2000, baseLoad: 0.2 },
  { id: 'fan-zone-b', name: 'Fan Zone B', capacity: 2000, baseLoad: 0.2 },
  { id: 'media-centre', name: 'Media Centre', capacity: 300, baseLoad: 0.6 },
  { id: 'away-section', name: 'Away Section', capacity: 3000, baseLoad: 0.5 },
]

// ─── Facility definitions (IDs match simulator.ts FACILITY_CONFIGS) ─
const FACILITIES: {
  id: string
  name: string
  type: FacilityType
  zoneId: string
  baseWait: number
  isOpen: boolean
}[] = [
  {
    id: 'gate-a',
    name: 'Gate 1 (North)',
    type: 'gate',
    zoneId: 'north-stand',
    baseWait: 10,
    isOpen: true,
  },
  {
    id: 'gate-b',
    name: 'Gate 2 (South)',
    type: 'gate',
    zoneId: 'south-stand',
    baseWait: 20,
    isOpen: true,
  },
  {
    id: 'gate-c',
    name: 'Gate 3 (East)',
    type: 'gate',
    zoneId: 'east-wing',
    baseWait: 4,
    isOpen: true,
  },
  {
    id: 'gate-d',
    name: 'Gate 4 (West)',
    type: 'gate',
    zoneId: 'west-wing',
    baseWait: 0,
    isOpen: false,
  },
  {
    id: 'food-court-main',
    name: 'Main Food Hub',
    type: 'concession',
    zoneId: 'main-concourse',
    baseWait: 15,
    isOpen: true,
  },
  {
    id: 'food-north',
    name: 'Burger Stand A',
    type: 'concession',
    zoneId: 'north-stand',
    baseWait: 5,
    isOpen: true,
  },
  {
    id: 'food-south',
    name: 'Hot Dog Stand B',
    type: 'concession',
    zoneId: 'south-stand',
    baseWait: 12,
    isOpen: true,
  },
  {
    id: 'food-east',
    name: 'Pizza Corner C',
    type: 'concession',
    zoneId: 'east-wing',
    baseWait: 8,
    isOpen: true,
  },
  {
    id: 'food-west',
    name: 'Beer Garden',
    type: 'concession',
    zoneId: 'west-wing',
    baseWait: 10,
    isOpen: true,
  },
  {
    id: 'food-vip',
    name: 'VIP Lounge Dining',
    type: 'concession',
    zoneId: 'vip-lounge',
    baseWait: 3,
    isOpen: true,
  },
  {
    id: 'drinks-north',
    name: 'Drinks & Snacks A',
    type: 'concession',
    zoneId: 'north-stand',
    baseWait: 6,
    isOpen: true,
  },
  {
    id: 'drinks-south',
    name: 'Drinks & Snacks B',
    type: 'concession',
    zoneId: 'south-stand',
    baseWait: 9,
    isOpen: true,
  },
  {
    id: 'restroom-n1',
    name: 'Restroom North A',
    type: 'restroom',
    zoneId: 'north-stand',
    baseWait: 6,
    isOpen: true,
  },
  {
    id: 'restroom-n2',
    name: 'Restroom North B',
    type: 'restroom',
    zoneId: 'north-stand',
    baseWait: 4,
    isOpen: true,
  },
  {
    id: 'restroom-s1',
    name: 'Restroom South A',
    type: 'restroom',
    zoneId: 'south-stand',
    baseWait: 12,
    isOpen: true,
  },
  {
    id: 'restroom-east',
    name: 'Restroom East',
    type: 'restroom',
    zoneId: 'east-wing',
    baseWait: 5,
    isOpen: true,
  },
  {
    id: 'restroom-west',
    name: 'Restroom West',
    type: 'restroom',
    zoneId: 'west-wing',
    baseWait: 8,
    isOpen: true,
  },
  {
    id: 'restroom-main',
    name: 'Restroom Main',
    type: 'restroom',
    zoneId: 'main-concourse',
    baseWait: 7,
    isOpen: true,
  },
  {
    id: 'restroom-vip',
    name: 'VIP Restroom',
    type: 'restroom',
    zoneId: 'vip-lounge',
    baseWait: 1,
    isOpen: true,
  },
  {
    id: 'medical-east',
    name: 'Medical Tent',
    type: 'medical',
    zoneId: 'main-concourse',
    baseWait: 0,
    isOpen: true,
  },
  {
    id: 'merch-store',
    name: 'Merchandise Store',
    type: 'merchandise',
    zoneId: 'main-concourse',
    baseWait: 8,
    isOpen: true,
  },
  {
    id: 'info-point',
    name: 'Info Point',
    type: 'info',
    zoneId: 'main-concourse',
    baseWait: 1,
    isOpen: true,
  },
]

function calcCongestionLevel(
  current: number,
  capacity: number
): 'low' | 'medium' | 'high' | 'critical' {
  if (capacity <= 0) return 'low'
  const r = current / capacity
  if (r >= 0.9) return 'critical'
  if (r >= 0.75) return 'high'
  if (r >= 0.5) return 'medium'
  return 'low'
}



export async function seedDatabase(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Must be authenticated to seed the database')
  }

  const now = new Date()

  // ── Build all ops across multiple batches (max 500 per batch) ──
  const ops: Array<[ReturnType<typeof doc>, object]> = []

  for (const z of ZONES) {
    const currentCount = Math.round(z.capacity * z.baseLoad)
    const zone: Zone = {
      id: z.id,
      name: z.name,
      capacity: z.capacity,
      currentCount,
      congestionLevel: calcCongestionLevel(currentCount, z.capacity),
      coordinates: [],
      createdAt: now,
      updatedAt: now,
    }
    ops.push([doc(collection(db, 'zones'), z.id), zone])
  }

  FACILITIES.forEach((f, index) => {
    const location = getFacilityCoords(f.name, index)
    const facility: Facility = {
      id: f.id,
      name: f.name,
      type: f.type,
      zoneId: f.zoneId,
      isOpen: f.isOpen,
      waitMinutes: f.isOpen ? f.baseWait : 0,
      location,
      createdAt: now,
      updatedAt: now,
    }
    ops.push([doc(collection(db, 'facilities'), f.id), facility])
  })

  // Firestore batches are limited to 500 writes — split into chunks
  const CHUNK = 400
  for (let i = 0; i < ops.length; i += CHUNK) {
    const batch = writeBatch(db)
    for (const [ref, data] of ops.slice(i, i + CHUNK)) {
      batch.set(ref, data)
    }
    await batch.commit()
  }
}
