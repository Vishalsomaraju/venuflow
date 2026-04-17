export type Role = 'user' | 'admin' | 'staff';

export interface User {
  id: string;
  email?: string | null;
  displayName?: string | null;
  role: Role;
  createdAt: number;
}

export interface Zone {
  id: string;
  name: string;
  currentCapacity: number;
  maxCapacity: number;
  status: 'safe' | 'warning' | 'critical';
  coordinates: { lat: number; lng: number }[];
}

export interface Facility {
  id: string;
  name: string;
  type: 'restroom' | 'food' | 'merch' | 'exit';
  waitTime: number; // in minutes
  location: { lat: number; lng: number };
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: number;
  timestamp: number; // For created time
  active: boolean;
}
