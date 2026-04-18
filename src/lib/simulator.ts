import { doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { addDocument } from '@/lib/db' // changed from firestore to db
import type { CongestionLevel, Alert } from '@/types'

interface SimulationConfig {
  intervalMs: number
  volatility: number // 0-1, how much counts change per tick
}

const DEFAULT_CONFIG: SimulationConfig = {
  intervalMs: 5000,
  volatility: 0.15,
}

const ZONE_CONFIGS = [
  { id: 'north-stand', capacity: 15000, baseLoad: 0.55 },
  { id: 'south-stand', capacity: 15000, baseLoad: 0.8 },
  { id: 'east-wing', capacity: 10000, baseLoad: 0.3 },
  { id: 'west-wing', capacity: 10000, baseLoad: 0.85 },
  { id: 'main-concourse', capacity: 5000, baseLoad: 0.45 },
  { id: 'vip-lounge', capacity: 500, baseLoad: 0.25 },
]

const FACILITY_CONFIGS = [
  { id: 'gate-a', baseWait: 10, maxWait: 30 },
  { id: 'gate-b', baseWait: 20, maxWait: 45 },
  { id: 'gate-c', baseWait: 4, maxWait: 15 },
  { id: 'gate-d', baseWait: 0, maxWait: 0 },
  { id: 'restroom-n1', baseWait: 6, maxWait: 20 },
  { id: 'restroom-s1', baseWait: 12, maxWait: 25 },
  { id: 'food-court-main', baseWait: 15, maxWait: 35 },
  { id: 'food-north', baseWait: 5, maxWait: 15 },
  { id: 'merch-store', baseWait: 8, maxWait: 20 },
  { id: 'medical-east', baseWait: 0, maxWait: 5 },
]

let simulationInterval: ReturnType<typeof setInterval> | null = null
let tickCount = 0

function getCongestionLevel(ratio: number): CongestionLevel {
  if (ratio > 0.9) return 'critical'
  if (ratio > 0.7) return 'high'
  if (ratio > 0.4) return 'medium'
  return 'low'
}

function jitter(base: number, volatility: number, min: number, max: number): number {
  const change = base * volatility * (Math.random() * 2 - 1)
  return Math.max(min, Math.min(max, Math.round(base + change)))
}

// Simulate a gradual event lifecycle: arrival → peak → departure
function getEventMultiplier(tick: number): number {
  // Creates a bell curve over ~60 ticks (5 min at 5s intervals)
  const phase = (tick % 120) / 120
  if (phase < 0.3) return 0.6 + phase * 1.3 // Arriving
  if (phase < 0.7) return 1.0 // Peak
  return 1.0 - (phase - 0.7) * 1.5 // Leaving
}

async function simulateTick(config: SimulationConfig): Promise<void> {
  tickCount++
  const eventMultiplier = getEventMultiplier(tickCount)
  const batch = writeBatch(db)

  // Update zones
  for (const zone of ZONE_CONFIGS) {
    const adjustedLoad = zone.baseLoad * eventMultiplier
    const targetCount = Math.round(zone.capacity * adjustedLoad)
    const currentCount = jitter(
      targetCount,
      config.volatility,
      0,
      zone.capacity
    )
    const ratio = currentCount / zone.capacity
    const congestionLevel = getCongestionLevel(ratio)

    const ref = doc(db, 'zones', zone.id)
    batch.update(ref, {
      currentCount,
      congestionLevel,
      updatedAt: serverTimestamp(),
    })
  }

  // Update facility wait times
  for (const facility of FACILITY_CONFIGS) {
    if (facility.maxWait === 0) continue // Closed or no-wait facility

    const waitMinutes = jitter(
      facility.baseWait * eventMultiplier,
      config.volatility * 1.5,
      0,
      facility.maxWait
    )

    const ref = doc(db, 'facilities', facility.id)
    batch.update(ref, {
      waitMinutes,
      updatedAt: serverTimestamp(),
    })
  }

  await batch.commit()

  // Occasionally generate alerts
  if (tickCount % 6 === 0) {
    await generateRandomAlert()
  }
}

async function generateRandomAlert(): Promise<void> {
  const alertTemplates = [
    {
      message: 'South Stand reaching capacity — recommend redirecting to East Wing',
      severity: 'warning' as const,
      zoneId: 'south-stand',
    },
    {
      message: 'Gate B queue exceeding 20 minute wait time',
      severity: 'warning' as const,
      zoneId: 'south-stand',
    },
    {
      message: 'West Wing at critical capacity — overflow protocol activated',
      severity: 'critical' as const,
      zoneId: 'west-wing',
    },
    {
      message: 'Concession wait times normalizing across Main Concourse',
      severity: 'info' as const,
      zoneId: 'main-concourse',
    },
    {
      message: 'East Wing gates operating below 30% capacity — ideal for late arrivals',
      severity: 'info' as const,
      zoneId: 'east-wing',
    },
    {
      message: 'VIP Lounge experiencing unusual traffic spike',
      severity: 'warning' as const,
      zoneId: 'vip-lounge',
    },
  ]

  const template = alertTemplates[Math.floor(Math.random() * alertTemplates.length)]

  try {
    await addDocument('alerts', {
      ...template,
      active: true,
      createdAt: new Date(), // using local date instead of serverTimestamp since we don't have it natively matched in generic addDocument just yet
    } as Omit<Alert, 'id'>)
  } catch (error) {
    console.warn('Alert generation failed:', error)
  }
}

export function startSimulation(
  config: Partial<SimulationConfig> = {}
): void {
  if (simulationInterval) {
    console.warn('Simulation already running')
    return
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  tickCount = 0

  // Run first tick immediately
  simulateTick(finalConfig).catch(console.error)

  simulationInterval = setInterval(() => {
    simulateTick(finalConfig).catch(console.error)
  }, finalConfig.intervalMs)
}

export function stopSimulation(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
    tickCount = 0
  }
}

export function isSimulationRunning(): boolean {
  return simulationInterval !== null
}
