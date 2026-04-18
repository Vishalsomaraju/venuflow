// src/components/RoutingPanel.tsx
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVenueStore } from '@/store/venueStore'
import { useRoutingContext } from '@/context/RoutingContext'
import { waitTimeColor } from '@/lib/markerUtils'
import { cn } from '@/lib/utils'
import type { Facility, FacilityType } from '@/types'
import type { RouteResult } from '@/context/RoutingContext'
import {
  Navigation,
  DoorOpen,
  Utensils,
  Toilet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Route,
  Footprints,
  MapPin,
  ChevronDown,
  X,
  Zap,
  Clock,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────
type DestType = 'gate' | 'restroom' | 'concession'

interface RouteState {
  status: 'idle' | 'locating' | 'routing' | 'done' | 'error'
  result?: RouteResult
  error?: string
  facilityId?: string
}

// ─── Config ───────────────────────────────────────────────────────
const DEST_OPTIONS: { value: DestType; label: string; icon: typeof DoorOpen }[] = [
  { value: 'gate', label: 'Gates', icon: DoorOpen },
  { value: 'restroom', label: 'Restrooms', icon: Toilet },
  { value: 'concession', label: 'Concession Stands', icon: Utensils },
]

const TYPE_MAP: Record<DestType, FacilityType> = {
  gate: 'gate',
  restroom: 'restroom',
  concession: 'concession',
}

// ─── Wait time badge ──────────────────────────────────────────────
function WaitBadge({ minutes, isOpen }: { minutes: number; isOpen: boolean }) {
  const { fill } = waitTimeColor(minutes, isOpen)
  if (!isOpen) {
    return (
      <span className="text-xs font-medium text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded-full">
        Closed
      </span>
    )
  }
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: fill, backgroundColor: `${fill}18` }}
    >
      {minutes} min wait
    </span>
  )
}

// ─── Route result card ────────────────────────────────────────────
function RouteResultCard({
  result,
  onClear,
}: {
  result: RouteResult
  onClear: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-xl border border-accent/30 bg-accent/5 p-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-accent/20 flex items-center justify-center">
            <Route className="h-3.5 w-3.5 text-accent" />
          </div>
          <p className="text-sm font-semibold text-text-primary truncate max-w-[160px]">
            {result.destinationName}
          </p>
        </div>
        <button
          onClick={onClear}
          className="rounded-lg p-1 hover:bg-surface-light text-text-muted hover:text-text-primary transition-colors"
          aria-label="Clear route"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-surface-light px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Distance</p>
          <p className="text-sm font-bold text-text-primary flex items-center gap-1">
            <MapPin className="h-3 w-3 text-accent" />
            {result.distance}
          </p>
        </div>
        <div className="rounded-lg bg-surface-light px-3 py-2">
          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Walk Time</p>
          <p className="text-sm font-bold text-text-primary flex items-center gap-1">
            <Footprints className="h-3 w-3 text-accent" />
            {result.duration}
          </p>
        </div>
      </div>

      <p className="text-xs text-text-muted flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        Route displayed on map
      </p>
    </motion.div>
  )
}

// ─── Facility row ─────────────────────────────────────────────────
function FacilityRow({
  facility,
  allFacilities,
  routeState,
  onRoute,
}: {
  facility: Facility
  allFacilities: Facility[]
  routeState: RouteState
  onRoute: (facility: Facility, allFacilities: Facility[]) => void
}) {
  const isActive = routeState.facilityId === facility.id
  const isLoading =
    isActive &&
    (routeState.status === 'locating' || routeState.status === 'routing')
  const isDone = isActive && routeState.status === 'done'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'group flex items-center justify-between rounded-xl border px-3 py-2.5 transition-all duration-200',
        isDone
          ? 'border-accent/40 bg-accent/5'
          : 'border-surface-border bg-surface hover:border-accent/20'
      )}
    >
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-sm font-medium text-text-primary truncate">
          {facility.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <WaitBadge minutes={facility.waitMinutes} isOpen={facility.isOpen} />
          {isDone && routeState.result && (
            <span className="text-xs text-accent font-medium flex items-center gap-1">
              <Footprints className="h-3 w-3" />
              {routeState.result.duration}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onRoute(facility, allFacilities)}
        disabled={isLoading || !facility.isOpen}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold',
          'transition-all duration-150 shrink-0',
          isDone
            ? 'bg-emerald-500/15 text-emerald-400'
            : facility.isOpen
            ? 'bg-accent text-white hover:bg-accent/90 active:scale-95'
            : 'bg-surface-light text-text-muted cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <Navigation className="h-3.5 w-3.5" />
        )}
        {isLoading
          ? routeState.status === 'locating'
            ? 'Locating…'
            : 'Routing…'
          : isDone
          ? 'Routed'
          : 'Route me'}
      </button>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────
export function RoutingPanel() {
  const facilities = useVenueStore((s) => s.facilities)
  const zones = useVenueStore((s) => s.zones)
  const { handle } = useRoutingContext()

  const [destType, setDestType] = useState<DestType>('gate')
  const [routeState, setRouteState] = useState<RouteState>({ status: 'idle' })
  const [exitLoading, setExitLoading] = useState(false)

  // Filter and sort by wait time
  const filtered = useMemo(() => {
    const type = TYPE_MAP[destType]
    return [...facilities]
      .filter((f) => f.type === type)
      .sort((a, b) => {
        // Open facilities first, then by wait time
        if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1
        return a.waitMinutes - b.waitMinutes
      })
  }, [facilities, destType])

  async function handleRoute(facility: Facility, allFacilities: Facility[]) {
    if (!handle.current) return
    setRouteState({ status: 'locating', facilityId: facility.id })
    try {
      const result = await handle.current.routeTo(facility, allFacilities)
      setRouteState({ status: 'done', result, facilityId: facility.id })
    } catch (err) {
      setRouteState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Routing failed',
        facilityId: facility.id,
      })
    }
  }

  function clearRoute() {
    handle.current?.clearRoute()
    setRouteState({ status: 'idle' })
    setExitLoading(false)
  }

  // "Least congested exit" — find gate with lowest zone count
  async function handleLeastCongestedExit() {
    if (!handle.current) return
    setExitLoading(true)

    // Build zone occupancy map
    const zoneOccupancy = new Map<string, number>()
    for (const z of zones) {
      zoneOccupancy.set(z.id, z.capacity > 0 ? z.currentCount / z.capacity : 0)
    }

    // Gather all open gates and score by their zone occupancy
    const gates = facilities.filter((f) => f.type === 'gate' && f.isOpen)
    if (gates.length === 0) {
      setRouteState({
        status: 'error',
        error: 'No open gates found.',
      })
      setExitLoading(false)
      return
    }

    // Pick gate whose zone has the lowest occupancy ratio
    const best = gates.reduce<Facility>((prev, curr) => {
      const prevScore = zoneOccupancy.get(prev.zoneId) ?? 1
      const currScore = zoneOccupancy.get(curr.zoneId) ?? 1
      // Also factor in wait time
      const prevTotal = prevScore + prev.waitMinutes / 60
      const currTotal = currScore + curr.waitMinutes / 60
      return currTotal < prevTotal ? curr : prev
    }, gates[0]!)

    try {
      const result = await handle.current.routeTo(best, facilities)
      setRouteState({ status: 'done', result, facilityId: best.id })
      // Switch tab to gates so user sees the result
      setDestType('gate')
    } catch (err) {
      setRouteState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Routing failed',
        facilityId: best.id,
      })
    } finally {
      setExitLoading(false)
    }
  }

  const currentOption = DEST_OPTIONS.find((o) => o.value === destType)!

  return (
    <div className="flex flex-col h-full gap-4 min-h-0">
      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-bold text-text-primary">Routing Panel</h3>
        <p className="text-xs text-text-muted mt-0.5">Navigate to any facility</p>
      </div>

      {/* ── Least congested exit button ──────────────────── */}
      <button
        onClick={handleLeastCongestedExit}
        disabled={exitLoading || facilities.length === 0}
        className={cn(
          'w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3',
          'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white',
          'font-semibold text-sm shadow-lg shadow-emerald-500/20',
          'hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98]',
          'transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
        )}
      >
        {exitLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {exitLoading ? 'Finding best exit…' : 'Least congested exit'}
      </button>

      {/* Route result / error */}
      <AnimatePresence mode="wait">
        {routeState.status === 'done' && routeState.result && (
          <RouteResultCard result={routeState.result} onClear={clearRoute} />
        )}
        {routeState.status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3"
          >
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-400">{routeState.error}</p>
            </div>
            <button onClick={clearRoute} className="text-text-muted hover:text-text-primary" aria-label="Dismiss error">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Divider ─────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-surface-border" />
        <span className="text-xs text-text-muted">or browse by type</span>
        <div className="h-px flex-1 bg-surface-border" />
      </div>

      {/* ── Destination type selector ────────────────────── */}
      <div className="relative">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-surface-border bg-surface p-1">
          {DEST_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                setDestType(value)
                clearRoute()
              }}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium',
                'transition-all duration-200',
                destType === value
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="leading-none">{label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Facility list ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          {currentOption.label}
        </p>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Clock className="h-3 w-3" />
          sorted by wait time
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-0.5">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <ChevronDown className="h-8 w-8 text-text-muted/30 mb-2" />
              <p className="text-sm text-text-muted">No facilities loaded yet</p>
              <p className="text-xs text-text-muted mt-1">Seed the database in Admin panel</p>
            </motion.div>
          ) : (
            filtered.map((facility) => (
              <FacilityRow
                key={facility.id}
                facility={facility}
                allFacilities={facilities}
                routeState={routeState}
                onRoute={handleRoute}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
