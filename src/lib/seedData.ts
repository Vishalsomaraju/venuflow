import { db } from './firebase'
import { collection, writeBatch, doc } from 'firebase/firestore'
import { Zone, Facility } from '@/types'

const ZONES = [
  { name: 'North Stand', capacity: 15000 },
  { name: 'South Stand', capacity: 15000 },
  { name: 'East Wing', capacity: 10000 },
  { name: 'West Wing', capacity: 10000 },
  { name: 'VIP Box', capacity: 500 },
  { name: 'Main Concourse', capacity: 5000 },
  { name: 'Upper Deck East', capacity: 8000 },
  { name: 'Upper Deck West', capacity: 8000 },
  { name: 'Fan Zone A', capacity: 2000 },
  { name: 'Fan Zone B', capacity: 2000 },
  { name: 'Media Centre', capacity: 300 },
  { name: ' Away Section', capacity: 3000 },
]

const FACILITIES = [
  { name: 'Gate 1 (North)', type: 'gate', zoneName: 'North Stand' },
  { name: 'Gate 2 (South)', type: 'gate', zoneName: 'South Stand' },
  { name: 'Gate 3 (East)', type: 'gate', zoneName: 'East Wing' },
  { name: 'Gate 4 (West)', type: 'gate', zoneName: 'West Wing' },
  { name: 'Burger Stand A', type: 'concession', zoneName: 'North Stand' },
  { name: 'Drinks & Snacks A', type: 'concession', zoneName: 'North Stand' },
  { name: 'Hot Dog Stand B', type: 'concession', zoneName: 'South Stand' },
  { name: 'Drinks & Snacks B', type: 'concession', zoneName: 'South Stand' },
  { name: 'Pizza Corner C', type: 'concession', zoneName: 'East Wing' },
  { name: 'Beer Garden', type: 'concession', zoneName: 'West Wing' },
  { name: 'VIP Lounge Dining', type: 'concession', zoneName: 'VIP Box' },
  { name: 'Main Food Hub', type: 'concession', zoneName: 'Main Concourse' },
  { name: 'Restroom North A', type: 'restroom', zoneName: 'North Stand' },
  { name: 'Restroom North B', type: 'restroom', zoneName: 'North Stand' },
  { name: 'Restroom South A', type: 'restroom', zoneName: 'South Stand' },
  { name: 'Restroom East', type: 'restroom', zoneName: 'East Wing' },
  { name: 'Restroom West', type: 'restroom', zoneName: 'West Wing' },
  { name: 'Restroom Main', type: 'restroom', zoneName: 'Main Concourse' },
  { name: 'VIP Restroom', type: 'restroom', zoneName: 'VIP Box' },
  { name: 'Medical Tent', type: 'medical', zoneName: 'Main Concourse' },
]

export async function seedDatabase() {
  const batch = writeBatch(db)
  
  // Create zones
  const zoneCollection = collection(db, 'zones')
  const zoneIdMap = new Map<string, string>()

  ZONES.forEach((z) => {
    const docRef = doc(zoneCollection)
    const zone: Zone = {
      id: docRef.id,
      name: z.name,
      capacity: z.capacity,
      currentCount: Math.floor(z.capacity * (Math.random() * 0.1 + 0.1)), // 10-20% default capacity
      congestionLevel: 'low',
      coordinates: [],
      updatedAt: new Date()
    }
    batch.set(docRef, zone)
    zoneIdMap.set(z.name, docRef.id)
  })

  // Create facilities
  const facilityCollection = collection(db, 'facilities')
  FACILITIES.forEach((f) => {
    const docRef = doc(facilityCollection)
    const facility: Facility = {
      id: docRef.id,
      name: f.name,
      type: f.type as any,
      zoneId: zoneIdMap.get(f.zoneName) || 'unknown',
      isOpen: true,
      waitMinutes: 0,
      location: { lat: 0, lng: 0 },
      updatedAt: new Date()
    }
    batch.set(docRef, facility)
  })

  // Optionally delete old alerts or just write
  await batch.commit()
}
