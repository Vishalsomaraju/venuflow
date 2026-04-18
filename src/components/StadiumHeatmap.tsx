// src/components/StadiumHeatmap.tsx
import { useState, useRef, useEffect } from 'react'
import { useVenueStore } from '@/store/venueStore'
import { cn } from '@/lib/utils'
import type { Zone, Facility, CongestionLevel } from '@/types'
import { Users, Clock, DoorOpen, X, Zap } from 'lucide-react'

// ─── Colour system ────────────────────────────────────────────────
const CONGESTION_FILL: Record<CongestionLevel, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

const CONGESTION_FILL_DIM: Record<CongestionLevel, string> = {
  low: '#16a34a',
  medium: '#ca8a04',
  high: '#ea6c00',
  critical: '#dc2626',
}

const CONGESTION_LABEL: Record<CongestionLevel, string> = {
  low: 'Low',
  medium: 'Moderate',
  high: 'High',
  critical: 'Critical',
}

// ─── SVG viewBox constants ────────────────────────────────────────
// ViewBox: 0 0 800 600  (landscape stadium, top-down)
// Centre of the pitch: 400, 290
// Pitch area: ellipse rx=155 ry=115 (protected, not clickable)

interface ZoneShape {
  /** Matches Zone.name from seed (trimmed) */
  name: string
  /** SVG path or shape descriptor */
  path: string
  /** Label position inside the shape */
  labelX: number
  labelY: number
}

// Hand-crafted SVG paths for each of the 12 zones around an oval stadium
// The viewBox is 800×600. The field is at (400,290), rx=155 ry=115.
// Outer boundary is rx=370 ry=270.
const ZONE_SHAPES: ZoneShape[] = [
  // ── NORTH STAND (top arc) ──────────────────────────────────────
  {
    name: 'North Stand',
    path: `M 180,60 Q 400,20 620,60 L 570,145 Q 400,110 230,145 Z`,
    labelX: 400,
    labelY: 80,
  },
  // ── SOUTH STAND (bottom arc) ──────────────────────────────────
  {
    name: 'South Stand',
    path: `M 180,520 Q 400,560 620,520 L 570,435 Q 400,470 230,435 Z`,
    labelX: 400,
    labelY: 510,
  },
  // ── EAST WING (right side, mid) ───────────────────────────────
  {
    name: 'East Wing',
    path: `M 620,60 Q 785,150 785,290 Q 785,430 620,520 L 570,435 Q 710,370 710,290 Q 710,210 570,145 Z`,
    labelX: 685,
    labelY: 290,
  },
  // ── WEST WING (left side, mid) ────────────────────────────────
  {
    name: 'West Wing',
    path: `M 180,60 Q 15,150 15,290 Q 15,430 180,520 L 230,435 Q 90,370 90,290 Q 90,210 230,145 Z`,
    labelX: 45,
    labelY: 290,
  },
  // ── UPPER DECK EAST (upper-right curve) ───────────────────────
  {
    name: 'Upper Deck East',
    path: `M 570,145 Q 710,210 710,290 L 640,290 Q 640,230 530,185 Z`,
    labelX: 640,
    labelY: 215,
  },
  // ── UPPER DECK WEST (upper-left curve) ────────────────────────
  {
    name: 'Upper Deck West',
    path: `M 230,145 Q 90,210 90,290 L 160,290 Q 160,230 270,185 Z`,
    labelX: 155,
    labelY: 215,
  },
  // ── VIP BOX (centre top, between stands) ──────────────────────
  {
    name: 'VIP Box',
    path: `M 340,110 Q 400,95 460,110 L 455,165 Q 400,150 345,165 Z`,
    labelX: 400,
    labelY: 133,
  },
  // ── MAIN CONCOURSE (wide inner ring top) ──────────────────────
  {
    name: 'Main Concourse',
    path: `M 230,145 Q 400,110 570,145 L 530,185 Q 400,155 270,185 Z`,
    labelX: 400,
    labelY: 162,
  },
  // ── FAN ZONE A (bottom-left corner pocket) ────────────────────
  {
    name: 'Fan Zone A',
    path: `M 90,290 Q 90,370 160,290 L 90,290 Z
            M 90,290 L 160,290 Q 160,350 230,390 L 230,435 Q 90,430 90,290 Z`,
    labelX: 118,
    labelY: 370,
  },
  // ── FAN ZONE B (bottom-right corner pocket) ───────────────────
  {
    name: 'Fan Zone B',
    path: `M 710,290 L 640,290 Q 640,350 570,390 L 570,435 Q 710,430 710,290 Z`,
    labelX: 672,
    labelY: 370,
  },
  // ── AWAY SECTION (right side lower) ──────────────────────────
  {
    name: 'Away Section',
    path: `M 570,390 Q 640,350 640,290 L 710,290 Q 710,390 620,445 L 570,435 Z`,
    labelX: 658,
    labelY: 370,
  },
  // ── MEDIA CENTRE (small box, top-right) ───────────────────────
  {
    name: 'Media Centre',
    path: `M 580,60 Q 620,60 620,100 L 575,115 Q 560,80 580,60 Z`,
    labelX: 598,
    labelY: 83,
  },
]

// ─── Tooltip ──────────────────────────────────────────────────────
interface TooltipState {
  zone: Zone
  facilities: Facility[]
  x: number
  y: number
}

function ZoneTooltip({
  tooltip,
  onClose,
}: {
  tooltip: TooltipState
  onClose: () => void
}) {
  const { zone, facilities } = tooltip
  const pct =
    zone.capacity > 0
      ? Math.round((zone.currentCount / zone.capacity) * 100)
      : 0
  const avgWait =
    facilities.length > 0
      ? Math.round(
          facilities.reduce((s, f) => s + f.waitMinutes, 0) / facilities.length
        )
      : null
  const openCount = facilities.filter((f) => f.isOpen).length

  return (
    <div
      className={cn(
        'absolute z-30 w-64 rounded-2xl border border-surface-border bg-surface/95 shadow-2xl',
        'backdrop-blur-md p-4 animate-in fade-in slide-in-from-bottom-2 duration-200'
      )}
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform: 'translate(-50%, -110%)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-text-primary text-sm">
            {zone.name}
          </p>
          <span
            className="inline-flex items-center gap-1 text-xs mt-0.5 font-medium"
            style={{ color: CONGESTION_FILL[zone.congestionLevel] }}
          >
            <Zap className="h-3 w-3" />
            {CONGESTION_LABEL[zone.congestionLevel]} congestion
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-surface-light transition-colors ml-2"
          aria-label="Close details"
        >
          <X className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
        </button>
      </div>

      {/* Occupancy bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {zone.currentCount.toLocaleString()} attendees
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-light overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(pct, 100)}%`,
              backgroundColor: CONGESTION_FILL[zone.congestionLevel],
            }}
          />
        </div>
        <p className="text-xs text-text-muted mt-1">
          Capacity: {zone.capacity.toLocaleString()}
        </p>
      </div>

      {/* Facility stats */}
      {facilities.length > 0 && (
        <div className="space-y-1.5 border-t border-surface-border pt-3">
          <p className="text-xs text-text-muted font-medium mb-2">
            Zone Facilities
          </p>
          {facilities.slice(0, 4).map((f) => (
            <div key={f.id} className="flex items-center justify-between text-xs">
              <span className="text-text-secondary truncate max-w-[140px]">
                {f.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    'flex items-center gap-1',
                    f.waitMinutes > 15 ? 'text-red-400' : 'text-text-muted'
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {f.waitMinutes}m
                </span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5',
                    f.isOpen
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-red-500/15 text-red-400'
                  )}
                >
                  {f.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          ))}
          {facilities.length > 4 && (
            <p className="text-xs text-text-muted">
              +{facilities.length - 4} more facilities
            </p>
          )}
          {avgWait !== null && (
            <div className="flex items-center gap-2 pt-1.5 border-t border-surface-border mt-1.5">
              <DoorOpen className="h-3.5 w-3.5 text-text-muted" />
              <span className="text-xs text-text-secondary">
                Avg wait: <strong className="text-text-primary">{avgWait} min</strong>
                &nbsp;·&nbsp;{openCount}/{facilities.length} open
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────
function HeatmapLegend() {
  const items: { level: CongestionLevel; label: string; range: string }[] = [
    { level: 'low', label: 'Low', range: '< 50%' },
    { level: 'medium', label: 'Moderate', range: '50–75%' },
    { level: 'high', label: 'High', range: '75–90%' },
    { level: 'critical', label: 'Critical', range: '> 90%' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-surface-border bg-surface/80 backdrop-blur-sm">
      <span className="text-xs font-medium text-text-secondary mr-1">
        Congestion:
      </span>
      {items.map(({ level, label, range }) => (
        <div key={level} className="flex items-center gap-1.5">
          <span
            className={cn(
              'h-3 w-3 rounded-sm flex-shrink-0',
              level === 'critical' && 'animate-pulse'
            )}
            style={{ backgroundColor: CONGESTION_FILL[level] }}
          />
          <span className="text-xs text-text-secondary">
            {label}{' '}
            <span className="text-text-muted">({range})</span>
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────
export function StadiumHeatmap() {
  const zones = useVenueStore((s) => s.zones)
  const facilities = useVenueStore((s) => s.facilities)
  const isConnected = useVenueStore((s) => s.isConnected)

  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close tooltip on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Element
      if (!target.closest('[data-heatmap-zone]') && !target.closest('[data-heatmap-tooltip]')) {
        setTooltip(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Build lookup: trimmed zone name → Zone
  const zoneByName = new Map<string, Zone>()
  for (const z of zones) {
    zoneByName.set(z.name.trim(), z)
  }

  // Build lookup: zoneId → facilities
  const facilitiesByZone = new Map<string, Facility[]>()
  for (const f of facilities) {
    const arr = facilitiesByZone.get(f.zoneId) ?? []
    arr.push(f)
    facilitiesByZone.set(f.zoneId, arr)
  }

  function handleZoneClick(shape: ZoneShape, svgX: number, svgY: number) {
    const zone = zoneByName.get(shape.name)
    if (!zone) return

    // Convert SVG coords to container-relative pixel coords
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container) return

    const ctm = svg.getScreenCTM()
    if (!ctm) return

    const containerRect = container.getBoundingClientRect()
    const svgRect = svg.getBoundingClientRect()

    // Map SVG viewBox coord → screen coord → container-relative coord
    const scaleX = svgRect.width / 800
    const scaleY = svgRect.height / 600
    const screenX = svgRect.left + svgX * scaleX
    const screenY = svgRect.top + svgY * scaleY
    const relX = screenX - containerRect.left
    const relY = screenY - containerRect.top

    const zoneFacilities = facilitiesByZone.get(zone.id) ?? []

    setTooltip({
      zone,
      facilities: zoneFacilities,
      x: relX,
      y: relY,
    })
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Live indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            )}
          />
          <span className="text-xs font-medium text-text-secondary">
            {isConnected ? 'Live Heatmap' : 'Disconnected'}
          </span>
          {zones.length > 0 && (
            <span className="text-xs text-text-muted">
              · {zones.length} zones
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted">Click a zone for details</span>
      </div>

      {/* SVG container */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 min-h-[340px] rounded-2xl overflow-hidden border border-surface-border bg-[#0d1117]"
      >
        <svg
          ref={svgRef}
          viewBox="0 0 800 600"
          className="w-full h-full"
          style={{ display: 'block' }}
          aria-label="Stadium heatmap"
        >
          {/* Background */}
          <rect width="800" height="600" fill="#0d1117" />

          {/* Outer stadium boundary */}
          <ellipse
            cx="400" cy="290"
            rx="390" ry="280"
            fill="none"
            stroke="#1e2433"
            strokeWidth="2"
          />

          {/* Zone shapes */}
          {ZONE_SHAPES.map((shape) => {
            const zone = zoneByName.get(shape.name)
            const level: CongestionLevel = zone?.congestionLevel ?? 'low'
            const fill = zone ? CONGESTION_FILL[level] : '#1e2433'
            const fillDim = zone ? CONGESTION_FILL_DIM[level] : '#161b27'
            const isCritical = level === 'critical'
            const noData = !zone

            return (
              <g
                key={shape.name}
                data-heatmap-zone={shape.name}
                onClick={() => handleZoneClick(shape, shape.labelX, shape.labelY)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleZoneClick(shape, shape.labelX, shape.labelY);
                  }
                }}
                style={{ cursor: zone ? 'pointer' : 'default' }}
                role="img"
                tabIndex={zone ? 0 : -1}
                aria-label={
                  zone
                    ? `${zone.name}: ${CONGESTION_LABEL[zone.congestionLevel]} congestion, ${zone.currentCount.toLocaleString()} attendees`
                    : `${shape.name}: no live congestion data available`
                }
                className="outline-none focus-visible:stroke-accent focus-visible:stroke-2"
              >
                {/* Zone fill */}
                <path
                  d={shape.path}
                  fill={fillDim}
                  fillOpacity={noData ? 0.3 : 0.5}
                  stroke={fill}
                  strokeWidth="1"
                  strokeOpacity={0.6}
                  className={isCritical ? 'animate-pulse' : undefined}
                />

                {/* Hover overlay — pure SVG filter trick */}
                <path
                  d={shape.path}
                  fill={fill}
                  fillOpacity={0}
                  stroke="none"
                  className="transition-opacity duration-200 hover:!fill-opacity-[0.18]"
                  style={{ fillOpacity: 0 }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as SVGPathElement).style.fillOpacity = '0.18')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as SVGPathElement).style.fillOpacity = '0')
                  }
                />

                {/* Zone label */}
                <text
                  x={shape.labelX}
                  y={shape.labelY - 6}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={noData ? '#4b5563' : '#f8fafc'}
                  fontSize="9"
                  fontWeight="600"
                  fontFamily="'Inter', system-ui, sans-serif"
                  pointerEvents="none"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {shape.name}
                </text>

                {/* Attendee count */}
                {zone && (
                  <text
                    x={shape.labelX}
                    y={shape.labelY + 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={fill}
                    fontSize="8"
                    fontFamily="'Inter', system-ui, sans-serif"
                    pointerEvents="none"
                  >
                    {zone.currentCount.toLocaleString()}
                  </text>
                )}
              </g>
            )
          })}

          {/* ── Field / Pitch ──────────────────────────────────── */}
          {/* Outer pitch boundary */}
          <ellipse cx="400" cy="290" rx="160" ry="120" fill="#064e3b" stroke="#065f46" strokeWidth="1.5" />
          {/* Pitch markings — centre circle */}
          <ellipse cx="400" cy="290" rx="38" ry="38" fill="none" stroke="#065f46" strokeWidth="1" />
          {/* Centre spot */}
          <circle cx="400" cy="290" r="2.5" fill="#065f46" />
          {/* Halfway line */}
          <line x1="242" y1="290" x2="558" y2="290" stroke="#065f46" strokeWidth="1" />
          {/* Penalty areas */}
          <rect x="340" y="207" width="120" height="60" rx="2" fill="none" stroke="#065f46" strokeWidth="1" />
          <rect x="340" y="323" width="120" height="60" rx="2" fill="none" stroke="#065f46" strokeWidth="1" />
          {/* Goals */}
          <rect x="376" y="172" width="48" height="16" rx="2" fill="none" stroke="#065f46" strokeWidth="1" strokeDasharray="3,2" />
          <rect x="376" y="412" width="48" height="16" rx="2" fill="none" stroke="#065f46" strokeWidth="1" strokeDasharray="3,2" />
          {/* Pitch label */}
          <text x="400" y="287" textAnchor="middle" fill="#065f46" fontSize="9" fontWeight="700" fontFamily="system-ui">
            FIELD
          </text>

          {/* ── Compass / orientation ──────────────────────────── */}
          <text x="400" y="36" textAnchor="middle" fill="#374151" fontSize="9" fontFamily="system-ui">N</text>
          <text x="400" y="565" textAnchor="middle" fill="#374151" fontSize="9" fontFamily="system-ui">S</text>
          <text x="775" y="294" textAnchor="middle" fill="#374151" fontSize="9" fontFamily="system-ui">E</text>
          <text x="24" y="294" textAnchor="middle" fill="#374151" fontSize="9" fontFamily="system-ui">W</text>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div data-heatmap-tooltip>
            <ZoneTooltip tooltip={tooltip} onClose={() => setTooltip(null)} />
          </div>
        )}

        {/* Empty state overlay */}
        {zones.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/80 backdrop-blur-sm">
            <div className="text-center space-y-2">
              <div className="h-10 w-10 rounded-full border-2 border-accent/40 border-t-accent animate-spin mx-auto" />
              <p className="text-sm text-text-secondary font-medium">
                Connecting to live data…
              </p>
              <p className="text-xs text-text-muted">
                Seed the database in the Admin panel if this persists
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <HeatmapLegend />
    </div>
  )
}
