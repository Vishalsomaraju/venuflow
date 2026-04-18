// src/test/components.test.tsx
// Tests 4 & 5 — component rendering tests with mocked stores
import '../test/mocks/firebase'
import React from 'react'

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { makeMockVenueStore, mockZones } from './mocks/venueStore'

// ── Mock react-hot-toast (not testable in jsdom) ─────────────────
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// ── Mock framer-motion (avoid animation overhead in tests) ───────
vi.mock('framer-motion', () => {
  const MotionDiv = React.forwardRef(
    ({ children, layout, layoutId, initial, animate, exit, variants, transition, ...props }: any, ref: React.Ref<HTMLDivElement>) =>
      React.createElement('div', { ...props, ref }, children)
  )
  MotionDiv.displayName = 'motion.div'
  return {
    motion: { div: MotionDiv, span: 'span' },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useAnimation: () => ({ start: vi.fn() }),
  }
})

// ── Mock @/lib/simulator ─────────────────────────────────────────
vi.mock('@/lib/simulator', () => ({
  startSimulation: vi.fn(),
  stopSimulation: vi.fn(),
  isSimulationRunning: vi.fn(() => false),
}))

// ── Mock Zustand venueStore ───────────────────────────────────────
let mockStoreState = makeMockVenueStore()
vi.mock('@/store/venueStore', () => ({
  useVenueStore: (selector: (state: typeof mockStoreState) => unknown) =>
    selector(mockStoreState),
}))

// ── Mock Badge component ──────────────────────────────────────────
vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant: string; pulse?: boolean }) => {
    return React.createElement('span', { 'data-testid': `badge-${variant}`, 'data-variant': variant }, children)
  },
  congestionToBadgeVariant: (level: string) => {
    const map: Record<string, string> = {
      low: 'success',
      medium: 'warning',
      high: 'danger',
      critical: 'critical',
    }
    return map[level] ?? 'default'
  },
}))

// ── Mock Skeleton ─────────────────────────────────────────────────
vi.mock('@/components/ui/Skeleton', () => ({
  ZoneCardSkeleton: () => {
    return React.createElement('div', { 'data-testid': 'skeleton' })
  },
}))

// ─────────────────────────────────────────────────────────────────
// Test 4: SimulationControl renders & toggle button exists
// ─────────────────────────────────────────────────────────────────
describe('SimulationControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', async () => {
    const { SimulationControl } = await import('@/components/dashboard/SimulationControl')
    const { unmount } = render(<SimulationControl />)
    expect(document.body).toBeTruthy()
    unmount()
  })

  it('has a toggle button', async () => {
    const { SimulationControl } = await import('@/components/dashboard/SimulationControl')
    render(<SimulationControl />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('shows "Simulate Crowd" when not running', async () => {
    const { SimulationControl } = await import('@/components/dashboard/SimulationControl')
    render(<SimulationControl />)
    expect(screen.getByText(/Simulate Crowd/i)).toBeInTheDocument()
  })

  it('calls startSimulation on click', async () => {
    const { SimulationControl } = await import('@/components/dashboard/SimulationControl')
    const { startSimulation } = await import('@/lib/simulator')
    const user = userEvent.setup()
    render(<SimulationControl />)
    await user.click(screen.getByRole('button'))
    expect(startSimulation).toHaveBeenCalledOnce()
  })
})

// ─────────────────────────────────────────────────────────────────
// Test 5: ZoneCongestionGrid renders zone cards with badge colours
// ─────────────────────────────────────────────────────────────────
describe('ZoneCongestionGrid', () => {
  beforeEach(() => {
    mockStoreState = makeMockVenueStore({ zones: mockZones })
    vi.clearAllMocks()
  })

  it('renders all zone names', async () => {
    const { ZoneCongestionGrid } = await import('@/components/dashboard/ZoneCongestionGrid')
    render(<ZoneCongestionGrid />)
    expect(screen.getByText('North Stand')).toBeInTheDocument()
    expect(screen.getByText('VIP Box')).toBeInTheDocument()
    expect(screen.getByText('Fan Zone A')).toBeInTheDocument()
  })

  it('renders a badge for each zone', async () => {
    const { ZoneCongestionGrid } = await import('@/components/dashboard/ZoneCongestionGrid')
    render(<ZoneCongestionGrid />)
    // mockZones: high, critical, low → should produce 3 badges
    const badges = screen.getAllByTestId(/^badge-/)
    expect(badges).toHaveLength(mockZones.length)
  })

  it('renders a "danger" badge for high congestion zones', async () => {
    const { ZoneCongestionGrid } = await import('@/components/dashboard/ZoneCongestionGrid')
    render(<ZoneCongestionGrid />)
    expect(screen.getByTestId('badge-danger')).toBeInTheDocument()
  })

  it('renders a "critical" badge for critical congestion zones', async () => {
    const { ZoneCongestionGrid } = await import('@/components/dashboard/ZoneCongestionGrid')
    render(<ZoneCongestionGrid />)
    expect(screen.getByTestId('badge-critical')).toBeInTheDocument()
  })

  it('renders a "success" badge for low congestion zones', async () => {
    const { ZoneCongestionGrid } = await import('@/components/dashboard/ZoneCongestionGrid')
    render(<ZoneCongestionGrid />)
    expect(screen.getByTestId('badge-success')).toBeInTheDocument()
  })

  it('shows skeletons when zones array is empty and not connected', async () => {
    mockStoreState = makeMockVenueStore({ zones: [], isConnected: false })
    const { ZoneCongestionGrid } = await import('@/components/dashboard/ZoneCongestionGrid')
    render(<ZoneCongestionGrid />)
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
