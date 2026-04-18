// src/lib/geminiContext.ts
// Builds the live-venue context string injected before every Gemini call.

import type { Zone, Facility, Alert } from '@/types'

export interface VenueSnapshot {
  zones: Zone[]
  facilities: Facility[]
  alerts: Alert[]
  totalAttendees: number
  totalCapacity: number
}

export function buildGeminiContext(
  zones: Zone[],
  facilities: Facility[],
  alerts: Alert[]
): string {
  const totalAttendees = zones.reduce((sum, z) => sum + z.currentCount, 0)
  const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0)
  return buildVenueSystemPrompt({
    zones,
    facilities,
    alerts,
    totalAttendees,
    totalCapacity
  })
}

export function buildVenueSystemPrompt(snapshot: VenueSnapshot): string {
  const { zones, facilities, alerts, totalAttendees, totalCapacity } = snapshot
  const occupancyPct =
    totalCapacity > 0 ? Math.round((totalAttendees / totalCapacity) * 100) : 0

  // Zone congestion summary
  const zoneLines = zones
    .map((z) => {
      const pct =
        z.capacity > 0 ? Math.round((z.currentCount / z.capacity) * 100) : 0
      return `  • ${z.name}: ${z.currentCount.toLocaleString()} / ${z.capacity.toLocaleString()} (${pct}%) — ${z.congestionLevel.toUpperCase()}`
    })
    .join('\n')

  // Gate wait times
  const gates = facilities.filter((f) => f.type === 'gate')
  const gateLines = gates
    .map(
      (f) =>
        `  • ${f.name}: ${f.isOpen ? `${f.waitMinutes} min wait` : 'CLOSED'}`
    )
    .join('\n')

  // Restrooms
  const restrooms = facilities.filter((f) => f.type === 'restroom')
  const restroomLines = restrooms
    .map(
      (f) =>
        `  • ${f.name}: ${f.isOpen ? `${f.waitMinutes} min wait` : 'CLOSED'}`
    )
    .join('\n')

  // Concessions
  const concessions = facilities.filter((f) => f.type === 'concession')
  const concessionLines = concessions
    .map(
      (f) =>
        `  • ${f.name}: ${f.isOpen ? `${f.waitMinutes} min wait` : 'CLOSED'}`
    )
    .join('\n')

  // Active alerts
  const activeAlerts = alerts.filter((a) => a.active)
  const alertLines =
    activeAlerts.length > 0
      ? activeAlerts
          .map((a) => `  • [${a.severity.toUpperCase()}] ${a.message}`)
          .join('\n')
      : '  None currently active'

  return `You are VenueFlow AI, an intelligent stadium operations assistant for Rajiv Gandhi International Stadium, Hyderabad. You have access to REAL-TIME venue data shown below. Use it to give specific, helpful, and concise answers. Always be direct and reference actual numbers from the data.

=== LIVE VENUE STATUS (updated moments ago) ===

Overall Attendance: ${totalAttendees.toLocaleString()} / ${totalCapacity.toLocaleString()} (${occupancyPct}% capacity)

ZONE CONGESTION:
${zoneLines || '  No zone data available'}

GATE STATUS & WAIT TIMES:
${gateLines || '  No gate data available'}

RESTROOM WAIT TIMES:
${restroomLines || '  No restroom data available'}

CONCESSION STAND WAIT TIMES:
${concessionLines || '  No concession data available'}

ACTIVE ALERTS:
${alertLines}

=== INSTRUCTIONS ===
- Answer venue questions using the real data above
- Be concise (2-4 sentences max unless asked for more)
- Suggest actionable alternatives when a zone/facility is congested
- If data is missing, say so honestly
- For routing questions, suggest the least congested gate/restroom
- Use a friendly, helpful tone appropriate for a live event`
}

export function buildQuickContextLine(snapshot: VenueSnapshot): string {
  const { totalAttendees, totalCapacity, alerts } = snapshot
  const pct =
    totalCapacity > 0 ? Math.round((totalAttendees / totalCapacity) * 100) : 0
  const criticalCount = alerts.filter(
    (a) => a.active && a.severity === 'critical'
  ).length
  return `[${pct}% full · ${criticalCount} critical alert${criticalCount !== 1 ? 's' : ''}]`
}
