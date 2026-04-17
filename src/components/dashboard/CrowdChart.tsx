import { useState, useEffect, useRef } from 'react'
import { useCrowdStore } from '@/store/crowdStore'
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
  const zones = useCrowdStore((s) => s.zones)
  const [history, setHistory] = useState<ChartDataPoint[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Capture snapshots of zone data over time
  useEffect(() => {
    if (zones.length === 0) return

    function captureSnapshot() {
      const now = new Date()
      const point: ChartDataPoint = {
        time: format(now, 'HH:mm:ss'),
        timestamp: now.getTime(),
      }

      for (const zone of zones) {
        point[zone.name] = zone.currentCount
      }

      setHistory((prev) => {
        const updated = [...prev, point]
        return updated.slice(-MAX_DATA_POINTS)
      })
    }

    // Capture immediately
    captureSnapshot()

    // Then capture every 5 seconds
    intervalRef.current = setInterval(captureSnapshot, 5000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [zones.length > 0]) // Only re-setup when zones first arrive

  // Update latest point when zones change
  useEffect(() => {
    if (zones.length === 0 || history.length === 0) return

    setHistory((prev) => {
      if (prev.length === 0) return prev

      const updated = [...prev]
      const lastPoint = { ...updated[updated.length - 1] } as ChartDataPoint

      for (const zone of zones) {
        lastPoint[zone.name] = zone.currentCount
      }

      updated[updated.length - 1] = lastPoint
      return updated
    })
  }, [zones])

  const zoneNames = zones.map((z) => z.name)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-text-secondary" />
          <h3 className="font-semibold text-text-primary">
            Crowd Density Over Time
          </h3>
          {history.length > 1 && (
            <span className="text-xs text-text-muted ml-auto">
              {history.length} data points
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {history.length < 2 ? (
          <div className="flex h-52 items-center justify-center">
            <p className="text-text-muted text-sm">
              📊 Collecting data points... Start the simulator to see live trends.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={history}>
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
                  val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val)
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
