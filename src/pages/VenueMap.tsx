// src/pages/VenueMap.tsx
import { useState } from 'react'
import { StadiumHeatmap } from '@/components/StadiumHeatmap'
import { GoogleMapView } from '@/components/GoogleMap'
import { RoutingPanel } from '@/components/RoutingPanel'
import { RoutingProvider } from '@/context/RoutingContext'
import { useVenueStore } from '@/store/venueStore'
import { useVenueStats } from '@/hooks/useVenueStats'
import { cn } from '@/lib/utils'
import {
  Users,
  Thermometer,
  AlertTriangle,
  Map,
  Activity,
  PanelRight,
  PanelRightClose,
} from 'lucide-react'

type Tab = 'map' | 'heatmap'

function MiniStat({
  icon: Icon,
  label,
  value,
  iconBg,
}: {
  icon: typeof Users
  label: string
  value: string
  iconBg: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('rounded-lg p-1.5', iconBg)}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div>
        <p className="text-[10px] text-text-muted leading-none uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-bold text-text-primary leading-snug tabular-nums">
          {value}
        </p>
      </div>
    </div>
  )
}

export function VenueMap() {
  const [activeTab, setActiveTab] = useState<Tab>('map')
  const [panelOpen, setPanelOpen] = useState(true)
  const { stats } = useVenueStats({ refreshInterval: 3000 })
  const criticalZones = useVenueStore((s) =>
    s.zones.filter((z) => z.congestionLevel === 'critical')
  )

  return (
    <RoutingProvider>
      <div className="flex flex-col h-full gap-4">
        {/* ── Page header ─────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Live Venue Map
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Rajiv Gandhi International Stadium · Hyderabad
            </p>
          </div>

          {/* Mini stats */}
          <div className="flex items-center gap-5 flex-wrap">
            <MiniStat
              icon={Users}
              label="Attendees"
              value={
                stats.totalAttendees > 0
                  ? stats.totalAttendees.toLocaleString()
                  : '—'
              }
              iconBg="bg-blue-500/60"
            />
            <MiniStat
              icon={Thermometer}
              label="Occupancy"
              value={stats.totalCapacity > 0 ? `${stats.occupancyPercent}%` : '—'}
              iconBg="bg-amber-500/60"
            />
            <MiniStat
              icon={AlertTriangle}
              label="Critical"
              value={`${stats.criticalZoneCount} zone${stats.criticalZoneCount !== 1 ? 's' : ''}`}
              iconBg={
                stats.criticalZoneCount > 0 ? 'bg-red-500/60' : 'bg-surface-light'
              }
            />
          </div>
        </div>

        {/* ── Critical zone banner ─────────────────────────── */}
        {criticalZones.length > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <p className="text-sm text-red-400 font-medium">
              Critical congestion:{' '}
              <span className="font-bold">
                {criticalZones.map((z) => z.name).join(', ')}
              </span>
            </p>
          </div>
        )}

        {/* ── Toolbar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-surface-border bg-surface p-1">
            {(
              [
                { id: 'map' as Tab, label: 'Google Maps', Icon: Map },
                { id: 'heatmap' as Tab, label: 'SVG Heatmap', Icon: Activity },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                  activeTab === id
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Routing panel toggle (only on map tab) */}
          {activeTab === 'map' && (
            <button
              onClick={() => setPanelOpen((v) => !v)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200',
                panelOpen
                  ? 'border-accent/40 bg-accent/10 text-accent'
                  : 'border-surface-border bg-surface text-text-secondary hover:text-text-primary'
              )}
            >
              {panelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRight className="h-4 w-4" />
              )}
              {panelOpen ? 'Hide' : 'Routing'}
            </button>
          )}
        </div>

        {/* ── Main content area ─────────────────────────────── */}
        <div className="flex-1 min-h-0 flex gap-4">
          {/* Map / heatmap */}
          <div className={cn('flex-1 min-w-0', activeTab === 'map' && panelOpen ? '' : 'w-full')}>
            {activeTab === 'map' ? <GoogleMapView /> : <StadiumHeatmap />}
          </div>

          {/* Routing panel — shown only on map tab */}
          {activeTab === 'map' && panelOpen && (
            <div className="w-72 shrink-0 rounded-2xl border border-surface-border bg-surface p-4 overflow-hidden flex flex-col">
              <RoutingPanel />
            </div>
          )}
        </div>
      </div>
    </RoutingProvider>
  )
}
