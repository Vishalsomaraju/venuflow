// src/pages/StaffPanel.tsx
import { useState, useCallback, useRef, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useVenueStore } from '@/store/venueStore'
import {
  overrideZoneCongestion,
  setZoneClosed,
  setFacilityOpen,
  setFacilityWaitTime,
  broadcastAlert,
  makeActivityEntry,
  type ActivityEntry,
  type BroadcastAlertPayload,
} from '@/lib/staffService'
import { cn } from '@/lib/utils'
import type { CongestionLevel, AlertSeverity } from '@/types'
import toast from 'react-hot-toast'
import {
  ShieldCheck,
  Thermometer,
  Megaphone,
  Wrench,
  Activity,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Power,
  Clock,
  Lock,
  Unlock,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────
const CONGESTION_OPTIONS: {
  value: CongestionLevel
  label: string
  color: string
}[] = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#eab308' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
]

const CONGESTION_VALUES: Record<CongestionLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
}

const CONGESTION_FROM_VALUE: CongestionLevel[] = [
  'low',
  'medium',
  'high',
  'critical',
]

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; color: string; Icon: typeof Info }
> = {
  info: { label: 'Info', color: 'text-blue-400', Icon: Info },
  warning: { label: 'Warning', color: 'text-amber-400', Icon: AlertTriangle },
  critical: { label: 'Critical', color: 'text-red-400', Icon: AlertTriangle },
}

import { Card, CardHeader, CardContent } from '@/components/ui/Card'

// ─── Section Card ─────────────────────────────────────────────────
function SectionCard({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
}: {
  title: string
  subtitle?: string
  icon: typeof ShieldCheck
  iconColor: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center border"
            style={{
              background: `${iconColor}15`,
              borderColor: `${iconColor}25`,
            }}
          >
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            {subtitle && (
              <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ─── 1. Zone Override Controls ────────────────────────────────────
function ZoneOverrideSection({
  onActivity,
}: {
  onActivity: (e: ActivityEntry) => void
}) {
  const zones = useVenueStore((s) => s.zones)
  const [pending, setPending] = useState<Set<string>>(new Set())

  async function handleCongestionChange(
    zoneId: string,
    zoneName: string,
    val: number
  ) {
    const level = CONGESTION_FROM_VALUE[val] as CongestionLevel
    setPending((p) => new Set(p).add(zoneId))
    try {
      await overrideZoneCongestion(zoneId, level)
      onActivity(
        makeActivityEntry(
          'Zone Override',
          `${zoneName} → ${level.toUpperCase()}`,
          level === 'critical'
            ? 'critical'
            : level === 'high'
              ? 'warning'
              : 'info'
        )
      )
      toast.success(`${zoneName} set to ${level}`)
    } catch {
      toast.error('Failed to update zone')
    } finally {
      setPending((p) => {
        const n = new Set(p)
        n.delete(zoneId)
        return n
      })
    }
  }

  async function handleClosedToggle(
    zoneId: string,
    zoneName: string,
    closed: boolean
  ) {
    setPending((p) => new Set(p).add(`${zoneId}-close`))
    try {
      await setZoneClosed(zoneId, closed)
      onActivity(
        makeActivityEntry(
          'Zone Status',
          `${zoneName} ${closed ? 'CLOSED' : 'REOPENED'}`,
          closed ? 'warning' : 'info'
        )
      )
      toast.success(`${zoneName} ${closed ? 'closed' : 'reopened'}`)
    } catch {
      toast.error('Failed to update zone')
    } finally {
      setPending((p) => {
        const n = new Set(p)
        n.delete(`${zoneId}-close`)
        return n
      })
    }
  }

  return (
    <SectionCard
      title="Zone Override Controls"
      subtitle="Manually set congestion level or close a zone"
      icon={Thermometer}
      iconColor="#6366f1"
    >
      <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
        {zones.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            No zones loaded — seed the database first
          </p>
        ) : (
          zones.map((zone) => {
            const currentVal = CONGESTION_VALUES[zone.congestionLevel] ?? 0
            const currentColor =
              CONGESTION_OPTIONS[currentVal]?.color ?? '#22c55e'
            const isBusy = pending.has(zone.id)

            return (
              <div
                key={zone.id}
                className="rounded-xl border border-surface-border bg-surface-light/30 p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${currentColor}15`,
                        border: `1px solid ${currentColor}30`,
                      }}
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: currentColor }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-text-primary">
                      {zone.name}
                    </span>
                    {isBusy && (
                      <Loader2 className="h-3.5 w-3.5 text-accent animate-spin" />
                    )}
                  </div>

                  {/* Closed toggle */}
                  <button
                    onClick={() =>
                      handleClosedToggle(
                        zone.id,
                        zone.name,
                        !(zone as unknown as Record<string, unknown>)['closed']
                      )
                    }
                    disabled={pending.has(`${zone.id}-close`)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                      (zone as unknown as Record<string, unknown>)['closed']
                        ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 ring-1 ring-red-500/30'
                        : 'bg-surface-light border border-surface-border text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {(zone as unknown as Record<string, unknown>)['closed'] ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                    {(zone as unknown as Record<string, unknown>)['closed']
                      ? 'Closed'
                      : 'Open'}
                  </button>
                </div>

                {/* Congestion slider */}
                <div className="space-y-2">
                  <label
                    htmlFor={`zone-congestion-${zone.id}`}
                    className="sr-only"
                  >
                    Set congestion level for {zone.name}
                  </label>
                  <div className="flex justify-between text-[10px] text-text-muted font-medium px-1">
                    {CONGESTION_OPTIONS.map((o) => (
                      <span
                        key={o.value}
                        style={{
                          color:
                            currentVal >= CONGESTION_VALUES[o.value]
                              ? o.color
                              : undefined,
                        }}
                      >
                        {o.label}
                      </span>
                    ))}
                  </div>
                  <input
                    id={`zone-congestion-${zone.id}`}
                    type="range"
                    min={0}
                    max={3}
                    step={1}
                    defaultValue={currentVal}
                    disabled={isBusy}
                    onMouseUp={(e) =>
                      handleCongestionChange(
                        zone.id,
                        zone.name,
                        Number(e.currentTarget.value)
                      )
                    }
                    onTouchEnd={(e) =>
                      handleCongestionChange(
                        zone.id,
                        zone.name,
                        Number(e.currentTarget.value)
                      )
                    }
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface border border-surface-border"
                    style={{ accentColor: currentColor }}
                  />
                </div>

                <div className="flex justify-between text-xs text-text-muted font-medium">
                  <span>
                    {zone.currentCount.toLocaleString()} /{' '}
                    {zone.capacity.toLocaleString()} attendees
                  </span>
                  <span
                    style={{ color: currentColor }}
                    className="capitalize px-2 py-0.5 rounded-md bg-surface"
                  >
                    {zone.congestionLevel}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </SectionCard>
  )
}

// ─── 2. Broadcast Alert ───────────────────────────────────────────
function BroadcastAlertSection({
  onActivity,
}: {
  onActivity: (e: ActivityEntry) => void
}) {
  const zones = useVenueStore((s) => s.zones)
  const [severity, setSeverity] = useState<AlertSeverity>('info')
  const [message, setMessage] = useState('')
  const [selectedZone, setSelectedZone] = useState('')
  const [isSending, setIsSending] = useState(false)

  async function handleBroadcast() {
    if (!message.trim()) {
      toast.error('Enter a message')
      return
    }
    setIsSending(true)
    const payload: BroadcastAlertPayload = {
      severity,
      message: message.trim(),
      title: `Staff Alert: ${severity.toUpperCase()}`,
      ...(selectedZone ? { zoneId: selectedZone } : {}),
    }
    try {
      await broadcastAlert(payload)
      const zoneName =
        zones.find((z) => z.id === selectedZone)?.name ?? 'All zones'
      onActivity(
        makeActivityEntry(
          'Alert Broadcast',
          `[${severity.toUpperCase()}] ${message.trim()} → ${zoneName}`,
          severity === 'critical'
            ? 'critical'
            : severity === 'warning'
              ? 'warning'
              : 'info'
        )
      )
      toast.success('Alert broadcasted!')
      setMessage('')
      setSelectedZone('')
    } catch {
      toast.error('Failed to broadcast alert')
    } finally {
      setIsSending(false)
    }
  }

  const cfg = SEVERITY_CONFIG[severity]!

  return (
    <SectionCard
      title="Broadcast Alert"
      subtitle="Push a live alert to all dashboards"
      icon={Megaphone}
      iconColor="#f97316"
    >
      <div className="space-y-4">
        {/* Severity */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Severity
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(SEVERITY_CONFIG) as AlertSeverity[]).map((s) => {
              const c = SEVERITY_CONFIG[s]!
              return (
                <button
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold border transition-all',
                    severity === s
                      ? `border-current bg-current/10 ${c.color} shadow-sm shadow-current/10`
                      : 'border-surface-border text-text-secondary hover:text-text-primary bg-surface-light hover:bg-surface-light/80'
                  )}
                >
                  <c.Icon className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Zone selector */}
        <div className="space-y-1.5">
          <label
            htmlFor="broadcast-zone"
            className="text-[10px] font-bold text-text-muted uppercase tracking-wider"
          >
            Zone (optional)
          </label>
          <div className="relative">
            <select
              id="broadcast-zone"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full appearance-none rounded-xl border border-surface-border bg-surface-light/50 px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 hover:bg-surface-light/80 transition-colors"
            >
              <option value="">All zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label
            htmlFor="broadcast-message"
            className="text-[10px] font-bold text-text-muted uppercase tracking-wider"
          >
            Message
          </label>
          <textarea
            id="broadcast-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type alert message…"
            rows={3}
            className="w-full rounded-xl border border-surface-border bg-surface-light/50 px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent/40 hover:bg-surface-light/80 transition-colors"
          />
        </div>

        <button
          onClick={handleBroadcast}
          disabled={isSending || !message.trim()}
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]',
            severity === 'critical'
              ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20'
              : severity === 'warning'
                ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20'
                : 'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20',
            'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
          )}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <cfg.Icon className="h-4 w-4" />
          )}
          {isSending ? 'Broadcasting…' : 'Broadcast Alert'}
        </button>
      </div>
    </SectionCard>
  )
}

// ─── 3. Facility Controls ─────────────────────────────────────────
function FacilityControlsSection({
  onActivity,
}: {
  onActivity: (e: ActivityEntry) => void
}) {
  const facilities = useVenueStore((s) => s.facilities)
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [editingWait, setEditingWait] = useState<Record<string, string>>({})
  const [filterType, setFilterType] = useState<string>('all')

  const types = ['all', ...Array.from(new Set(facilities.map((f) => f.type)))]
  const filtered =
    filterType === 'all'
      ? facilities
      : facilities.filter((f) => f.type === filterType)

  async function handleToggleOpen(id: string, name: string, isOpen: boolean) {
    setPending((p) => new Set(p).add(id))
    try {
      await setFacilityOpen(id, isOpen)
      onActivity(
        makeActivityEntry(
          'Facility Toggle',
          `${name} → ${isOpen ? 'OPEN' : 'CLOSED'}`,
          isOpen ? 'info' : 'warning'
        )
      )
      toast.success(`${name} ${isOpen ? 'opened' : 'closed'}`)
    } catch {
      toast.error('Update failed')
    } finally {
      setPending((p) => {
        const n = new Set(p)
        n.delete(id)
        return n
      })
    }
  }

  async function handleWaitSave(id: string, name: string) {
    const raw = editingWait[id]
    if (raw === undefined) return
    const val = Number(raw)
    if (isNaN(val) || val < 0) {
      toast.error('Enter a valid wait time')
      return
    }
    setPending((p) => new Set(p).add(`wait-${id}`))
    try {
      await setFacilityWaitTime(id, val)
      onActivity(
        makeActivityEntry('Wait Time Override', `${name} → ${val} min`)
      )
      toast.success(`Wait time updated`)
      setEditingWait((e) => {
        const n = { ...e }
        delete n[id]
        return n
      })
    } catch {
      toast.error('Update failed')
    } finally {
      setPending((p) => {
        const n = new Set(p)
        n.delete(`wait-${id}`)
        return n
      })
    }
  }

  return (
    <SectionCard
      title="Facility Controls"
      subtitle="Toggle open/closed and override wait times"
      icon={Wrench}
      iconColor="#8b5cf6"
    >
      {/* Type filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-all',
              filterType === t
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'border border-surface-border text-text-secondary hover:text-text-primary bg-surface-light hover:bg-surface-light/80'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">
            No facilities loaded
          </p>
        ) : (
          filtered.map((f) => {
            const isBusy = pending.has(f.id) || pending.has(`wait-${f.id}`)
            const isEditing = editingWait[f.id] !== undefined

            return (
              <div
                key={f.id}
                className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-light/30 px-4 py-3 transition-colors hover:bg-surface-light/50"
              >
                {/* Status toggle */}
                <button
                  onClick={() => handleToggleOpen(f.id, f.name, !f.isOpen)}
                  disabled={isBusy}
                  className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all ring-1',
                    f.isOpen
                      ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 ring-emerald-500/30'
                      : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 ring-red-500/30'
                  )}
                  aria-label={f.isOpen ? `Close ${f.name}` : `Open ${f.name}`}
                >
                  {isBusy && pending.has(f.id) ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Power className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>

                {/* Name + type */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {f.name}
                  </p>
                  <p className="text-[10px] text-text-muted capitalize">
                    {f.type}
                  </p>
                </div>

                {/* Wait time editor */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {isEditing ? (
                    <>
                      <label
                        htmlFor={`facility-wait-${f.id}`}
                        className="sr-only"
                      >
                        Wait time for {f.name}
                      </label>
                      <input
                        id={`facility-wait-${f.id}`}
                        type="number"
                        min={0}
                        max={120}
                        value={editingWait[f.id]}
                        onChange={(e) =>
                          setEditingWait((prev) => ({
                            ...prev,
                            [f.id]: e.target.value,
                          }))
                        }
                        className="w-14 rounded-lg border border-accent/40 bg-surface px-2 py-1 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 text-center shadow-inner"
                        autoFocus
                      />
                      <button
                        onClick={() => handleWaitSave(f.id, f.name)}
                        disabled={pending.has(`wait-${f.id}`)}
                        className="rounded-lg bg-accent/10 text-accent px-2.5 py-1.5 text-xs font-semibold hover:bg-accent/20 transition-colors"
                        aria-label="Save wait time"
                      >
                        {pending.has(`wait-${f.id}`) ? (
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <CheckCircle2
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setEditingWait((e) => {
                            const n = { ...e }
                            delete n[f.id]
                            return n
                          })
                        }
                        className="text-text-muted hover:text-text-primary text-xs p-1"
                        aria-label="Cancel editing wait time"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() =>
                        setEditingWait((prev) => ({
                          ...prev,
                          [f.id]: String(f.waitMinutes),
                        }))
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-light transition-all"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {f.waitMinutes}m
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </SectionCard>
  )
}

// ─── 4. Activity Feed ─────────────────────────────────────────────
function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  const severityStyle: Record<ActivityEntry['severity'], string> = {
    info: 'text-blue-400 bg-blue-500/10 ring-1 ring-blue-500/30',
    warning: 'text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/30',
    critical: 'text-red-400 bg-red-500/10 ring-1 ring-red-500/30',
  }

  return (
    <SectionCard
      title="Live Activity Feed"
      subtitle="Last 10 staff actions"
      icon={Activity}
      iconColor="#22c55e"
    >
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 font-mono text-xs">
        <AnimatePresence initial={false}>
          {entries.length === 0 ? (
            <p className="text-text-muted text-center py-6 font-sans text-sm">
              No activity yet
            </p>
          ) : (
            [...entries].reverse().map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 rounded-xl border border-surface-border bg-surface-light/30 px-4 py-3"
              >
                <span
                  className={cn(
                    'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    severityStyle[entry.severity]
                  )}
                >
                  {entry.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-text-secondary">[{entry.action}]</span>{' '}
                  <span className="text-text-primary">{entry.detail}</span>
                </div>
                <span className="text-text-muted shrink-0 text-[10px] font-medium">
                  {entry.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </SectionCard>
  )
}

// ─── Main page ────────────────────────────────────────────────────
export function StaffPanel(): React.JSX.Element {
  const isStaff = useAuthStore((s) => s.isStaff())
  const appUser = useAuthStore((s) => s.appUser)
  const [activity, setActivity] = useState<ActivityEntry[]>([])

  // NOTE: hooks must be called unconditionally — the guard is a render return,
  // not a conditional hook call. useCallback must live here, before the guard.
  const addActivity = useCallback((entry: ActivityEntry): void => {
    setActivity((prev) => [...prev.slice(-49), entry]) // keep last 50
  }, [])

  if (!isStaff) {
    return <Navigate to="/" replace />
  }

  const last10 = activity.slice(-10)

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Staff Panel
            </h1>
            <p className="text-sm text-text-secondary">
              Live venue control ·{' '}
              <span
                className={cn(
                  'font-semibold capitalize',
                  appUser?.role === 'admin'
                    ? 'text-red-400'
                    : 'text-emerald-400'
                )}
              >
                {appUser?.role ?? 'staff'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">
            Firestore connected
          </span>
        </div>
      </div>

      {/* ── Grid layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ZoneOverrideSection onActivity={addActivity} />
        <BroadcastAlertSection onActivity={addActivity} />
        <FacilityControlsSection onActivity={addActivity} />
        <ActivityFeed entries={last10} />
      </div>
    </div>
  )
}
