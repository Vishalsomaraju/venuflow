// src/lib/staffService.ts
// All Firestore writes for staff override operations.

import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { CongestionLevel, AlertSeverity } from '@/types'

// ─── Zone overrides ───────────────────────────────────────────────

export async function overrideZoneCongestion(
  zoneId: string,
  congestionLevel: CongestionLevel
): Promise<void> {
  await updateDoc(doc(db, 'zones', zoneId), {
    congestionLevel,
    updatedAt: serverTimestamp(),
  })
}

export async function setZoneClosed(
  zoneId: string,
  closed: boolean
): Promise<void> {
  // We use congestionLevel as a proxy; closed zones get a special flag
  await updateDoc(doc(db, 'zones', zoneId), {
    closed,
    updatedAt: serverTimestamp(),
  })
}

// ─── Facility overrides ───────────────────────────────────────────

export async function setFacilityOpen(
  facilityId: string,
  isOpen: boolean
): Promise<void> {
  await updateDoc(doc(db, 'facilities', facilityId), {
    isOpen,
    updatedAt: serverTimestamp(),
  })
}

export async function setFacilityWaitTime(
  facilityId: string,
  waitMinutes: number
): Promise<void> {
  await updateDoc(doc(db, 'facilities', facilityId), {
    waitMinutes: Math.max(0, Math.round(waitMinutes)),
    updatedAt: serverTimestamp(),
  })
}

// ─── Alert broadcasts ─────────────────────────────────────────────

export interface BroadcastAlertPayload {
  severity: AlertSeverity
  message: string
  zoneId?: string
  title?: string
}

export async function broadcastAlert(
  payload: BroadcastAlertPayload
): Promise<void> {
  await addDoc(collection(db, 'alerts'), {
    ...payload,
    active: true,
    createdAt: serverTimestamp(),
    resolvedAt: null,
  })
}

// ─── Activity log ──────────────────────────────────────────────────
// Lightweight client-side log type (no Firestore writes for this).

export interface ActivityEntry {
  id: string
  action: string
  detail: string
  timestamp: Date
  severity: 'info' | 'warning' | 'critical'
}

export function makeActivityEntry(
  action: string,
  detail: string,
  severity: ActivityEntry['severity'] = 'info'
): ActivityEntry {
  return {
    id: crypto.randomUUID(),
    action,
    detail,
    timestamp: new Date(),
    severity,
  }
}
