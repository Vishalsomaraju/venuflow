// src/components/dashboard/CrowdChart.tsx
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useVenueStore } from '@/store/venueStore'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Activity } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'

interface ChartDataPoint {
  time: string
  timestamp: number
  [zoneName: string]: string | number
}

const ZONE_COLORS: Record<string, string> = {
  'North Stand': '#4f8ef7',
  'South Stand': '#f87171',
  'East Wing': '#34d399',
  'West Wing': '#fbbf24',
  'Main Concourse': '#a78bfa',
  'VIP Lounge': '#f472b6',
}

const MAX_DATA_POINTS = 30

export function CrowdChart() {
  const zones = useVenueStore((s) => s.zones)
  const [history, setHistory] = useState<ChartDataPoint[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const zonesRef = useRef(zones)
  const prevZoneLengthRef = useRef(0)

  useEffect(() => {
    zonesRef.current = zones
  }, [zones])

  const captureSnapshot = useCallback(() => {
    const latestZones = zonesRef.current
    if (latestZones.length === 0) return

    const now = new Date()
    const point: ChartDataPoint = {
      time: format(now, 'HH:mm:ss'),
      timestamp: now.getTime(),
    }

    for (const zone of latestZones) {
      point[zone.name] = zone.currentCount
    }

    setHistory((prev) => {
      const updated = [...prev, point]
      return updated.slice(-MAX_DATA_POINTS)
    })
  }, [])

  useEffect(() => {
    if (zones.length === 0) {
      prevZoneLengthRef.current = 0
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    if (prevZoneLengthRef.current === 0) {
      captureSnapshot()
      intervalRef.current = setInterval(captureSnapshot, 5000)
    }

    prevZoneLengthRef.current = zones.length
  }, [zones.length, captureSnapshot])

  useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    },
    []
  )

  const chartData = useMemo(() => {
    if (history.length === 0) return history

    const updated = [...history]
    const last = updated[updated.length - 1]
    if (!last) return updated

    const lastPoint: ChartDataPoint = { ...last }
    for (const zone of zones) {
      lastPoint[zone.name] = zone.currentCount
    }

    updated[updated.length - 1] = lastPoint
    return updated
  }, [history, zones])

  const zoneNames = zones.map((z) => z.name)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-text-secondary" />
          <h3 className="font-semibold text-text-primary">
            Crowd Density Over Time
          </h3>
          {chartData.length > 1 && (
            <span className="text-xs text-text-muted ml-auto">
              {chartData.length} data points
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <div className="flex h-52 items-center justify-center">
            <p className="text-text-muted text-sm">
              📊 Collecting data points... Start the simulator to see live
              trends.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                {zoneNames.map((name) => (
                  <linearGradient
                    key={name}
                    id={`gradient-${name.replace(/\s/g, '')}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={ZONE_COLORS[name] || '#4f8ef7'}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={ZONE_COLORS[name] || '#4f8ef7'}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2a2e3a"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) =>
                  val >= 1000
                    ? `${(val / 1000).toFixed(1)}k`
                    : String(val)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1d27',
                  border: '1px solid #2a2e3a',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#94a3b8' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
              />
              {zoneNames.map((name) => (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={ZONE_COLORS[name] || '#4f8ef7'}
                  fill={`url(#gradient-${name.replace(/\s/g, '')})`}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
