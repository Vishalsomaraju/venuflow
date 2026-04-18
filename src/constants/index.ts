/**
 * src/constants/index.ts
 * Central repository for all hardcoded strings, labels, colors, and
 * configuration values used across the VenueFlow application.
 * Importing from here ensures consistency and makes future rebranding trivial.
 */

import type { CongestionLevel, AlertSeverity, FacilityType } from '@/types'

// ─── App Identity ──────────────────────────────────────────────────
export const APP_NAME = 'VenueFlow' as const
export const APP_TAGLINE = 'Real-time Smart Stadium Management' as const
export const APP_VERSION = '1.0.0' as const

// ─── AI Assistant ─────────────────────────────────────────────────
export const ASSISTANT_NAME = 'VenueFlow AI' as const
export const ASSISTANT_MODEL = 'Gemini 1.5 Flash' as const
export const ASSISTANT_PLACEHOLDER_ACTIVE = 'Ask about crowd levels, wait times, routing…' as const
export const ASSISTANT_PLACEHOLDER_INACTIVE = 'Set VITE_GEMINI_API_KEY to enable' as const
export const ASSISTANT_EMPTY_HEADING = 'VenueFlow AI' as const
export const ASSISTANT_EMPTY_BODY = 'Ask me anything about the current crowd, wait times, or how to navigate the venue.' as const

/** Suggested quick-reply questions shown below the chat input */
export const SUGGESTED_QUESTIONS: readonly string[] = [
  'Which gate has the shortest queue?',
  "Where's the nearest open restroom?",
  'How crowded is the North Stand?',
  'When should I leave to beat the crowd?',
  'Which concession stand has the shortest wait?',
  'Are there any critical alerts right now?',
] as const

// ─── Congestion Levels ────────────────────────────────────────────
export const CONGESTION_COLORS: Record<CongestionLevel, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
} as const

export const CONGESTION_LABELS: Record<CongestionLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
} as const

/** Ordered array used by the congestion range slider in StaffPanel */
export const CONGESTION_LEVELS_ORDERED: CongestionLevel[] = [
  'low',
  'medium',
  'high',
  'critical',
]

export const CONGESTION_OPTIONS: {
  value: CongestionLevel
  label: string
  color: string
}[] = CONGESTION_LEVELS_ORDERED.map((lvl) => ({
  value: lvl,
  label: CONGESTION_LABELS[lvl],
  color: CONGESTION_COLORS[lvl],
}))

/** Maps CongestionLevel → numeric slider value (0–3) */
export const CONGESTION_VALUE: Record<CongestionLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
} as const

// ─── Alert Severities ──────────────────────────────────────────────
export const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: 'Info',
  warning: 'Warning',
  critical: 'Critical',
} as const

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: 'text-blue-400',
  warning: 'text-amber-400',
  critical: 'text-red-400',
} as const

// ─── Facility Types ────────────────────────────────────────────────
export const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  gate: 'Gate',
  concession: 'Concession',
  restroom: 'Restroom',
  merchandise: 'Merchandise',
  medical: 'Medical',
  info: 'Info Point',
} as const

// ─── Venue / Stadium ───────────────────────────────────────────────
export const VENUE_NAME = 'Rajiv Gandhi International Stadium' as const
export const VENUE_LAT = 17.4065 as const
export const VENUE_LNG = 78.548 as const
export const VENUE_MAP_ZOOM = 17 as const

// ─── Dashboard Labels ─────────────────────────────────────────────
export const STAT_CARD_LABELS = {
  totalAttendees: 'Total Attendees',
  avgWaitTime: 'Avg. Wait Time',
  openGates: 'Open Gates',
  activeAlerts: 'Active Alerts',
} as const

// ─── Staff Panel Labels ────────────────────────────────────────────
export const STAFF_SECTION_TITLES = {
  zoneOverride: 'Zone Override Controls',
  zoneOverrideSub: 'Manually set congestion level or close a zone',
  broadcastAlert: 'Broadcast Alert',
  broadcastAlertSub: 'Send an alert to all venue staff and displays',
  facilityControls: 'Facility Controls',
  facilityControlsSub: 'Toggle facilities open/closed and edit wait times',
  activityFeed: 'Live Activity Feed',
  activityFeedSub: 'Last 20 Firestore writes',
} as const

// ─── Routing Panel Labels ─────────────────────────────────────────
export const ROUTING_DESTINATION_TYPES: {
  value: FacilityType
  label: string
}[] = [
  { value: 'gate', label: 'Gate' },
  { value: 'restroom', label: 'Restroom' },
  { value: 'concession', label: 'Concession Stand' },
  { value: 'medical', label: 'Medical Bay' },
]

// ─── Toast / Error Messages ────────────────────────────────────────
export const TOAST_MESSAGES = {
  zoneUpdateSuccess: (name: string, level: string) => `${name} set to ${level}`,
  zoneUpdateError: 'Failed to update zone',
  zoneClosedSuccess: (name: string, closed: boolean) =>
    `${name} ${closed ? 'closed' : 'reopened'}`,
  facilityOpenSuccess: (name: string, open: boolean) =>
    `${name} ${open ? 'opened' : 'closed'}`,
  facilityOpenError: 'Failed to update facility status',
  facilityWaitSuccess: (name: string) => `${name} wait time updated`,
  facilityWaitError: 'Failed to update wait time',
  alertBroadcastSuccess: 'Alert broadcast successfully',
  alertBroadcastError: 'Failed to broadcast alert',
  copySuccess: 'Copied to clipboard',
} as const

// ─── Heatmap Legend ────────────────────────────────────────────────
export const HEATMAP_LEGEND_ITEMS: { level: CongestionLevel; label: string }[] = [
  { level: 'low', label: 'Low (< 50%)' },
  { level: 'medium', label: 'Medium (50–75%)' },
  { level: 'high', label: 'High (75–90%)' },
  { level: 'critical', label: 'Critical (≥ 90%)' },
]

// ─── Map Marker Wait Time Thresholds ─────────────────────────────
export const WAIT_TIME_GREEN_MAX = 5   // minutes
export const WAIT_TIME_YELLOW_MAX = 15 // minutes
