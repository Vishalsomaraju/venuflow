import { setDocument } from './db';
import type { Zone, Facility, Alert } from '../types';

export const seedDatabase = async () => {
  console.log('Seeding database...');
  
  // Zones
  const zones: Zone[] = [
    {
      id: 'food-court-a',
      name: 'North Food Court',
      currentCapacity: 120,
      maxCapacity: 150,
      status: 'warning',
      coordinates: [], // We'll populate this later on map
    },
    {
      id: 'gate-a',
      name: 'Main Gate A',
      currentCapacity: 45,
      maxCapacity: 300,
      status: 'safe',
      coordinates: [],
    },
    {
      id: 'merch-store-1',
      name: 'Official Team Store',
      currentCapacity: 85,
      maxCapacity: 80,
      status: 'critical',
      coordinates: [],
    }
  ];

  // Facilities
  const facilities: Facility[] = [
    {
      id: 'restroom-1',
      name: 'Section 112 Restrooms',
      type: 'restroom',
      waitTime: 5,
      location: { lat: 0, lng: 0 },
    },
    {
      id: 'food-1',
      name: 'Burger Stand',
      type: 'food',
      waitTime: 15,
      location: { lat: 0, lng: 0 },
    },
  ];

  // Alerts
  const alerts: Alert[] = [
    {
      id: 'alert-1',
      title: 'Congestion at Gate B',
      message: 'Please direct incoming fans to Gate C.',
      severity: 'high',
      createdAt: Date.now(),
      timestamp: Date.now(),
      active: true,
    }
  ];

  try {
    for (const zone of zones) {
      await setDocument('zones', zone.id, zone);
    }
    for (const facility of facilities) {
      await setDocument('facilities', facility.id, facility);
    }
    for (const alert of alerts) {
      await setDocument('alerts', alert.id, alert);
    }
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
