export type Role = 'user' | 'admin' | 'staff';
export type CongestionLevel = 'low' | 'medium' | 'high' | 'critical';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type FacilityType = 'gate' | 'concession' | 'restroom' | 'merchandise' | 'medical' | 'info';

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
  currentCount: number;
  capacity: number;
  congestionLevel: CongestionLevel;
  coordinates: { lat: number; lng: number }[];
  updatedAt?: Date;
  createdAt?: Date;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  waitMinutes: number;
  isOpen: boolean;
  zoneId: string;
  location: { lat: number; lng: number };
  updatedAt?: Date;
  createdAt?: Date;
}

export interface Alert {
  id: string;
  title?: string;
  message: string;
  severity: AlertSeverity;
  zoneId?: string;
  active: boolean;
  createdAt?: Date;
  resolvedAt?: Date | null;
}
