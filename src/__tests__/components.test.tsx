import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AnimatedStatCard } from '../components/dashboard/AnimatedStatCard'
import { Badge, congestionToBadgeVariant } from '../components/ui/Badge'
import { RecentAlerts } from '../components/dashboard/RecentAlerts'
import { Assistant } from '../pages/Assistant'
import { Users } from 'lucide-react'
import { useVenueStore } from '../store/venueStore'

vi.mock('../hooks/useAnimatedCounter', () => ({
  useAnimatedCounter: ({ value, format = (n: number) => Math.round(n).toLocaleString() }: { value: number, format?: (n: number) => string }) => format(value)
}))

vi.mock('../hooks/useAssistant', () => ({
  useAssistant: () => ({
    messages: [],
    input: '',
    setInput: vi.fn(),
    isStreaming: false,
    isConfigured: true,
    contextLine: 'context',
    inputRef: { current: null },
    bottomRef: { current: null },
    submit: vi.fn(),
    clearChat: vi.fn(),
    handleCopy: vi.fn(),
    handleKeyDown: vi.fn(),
  })
}))

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}))

describe('components', () => {
  it('StatCard renders the correct value and label', async () => {
    render(
      <AnimatedStatCard
        icon={Users}
        label="Total Attendees"
        numericValue={1234}
        iconBg="bg-blue-500"
        iconColor="text-white"
      />
    )
    
    // Async test utilizing waitFor
    await waitFor(() => {
      expect(screen.getByText('Total Attendees')).toBeInTheDocument()
      expect(screen.getByText('1,234')).toBeInTheDocument()
    })
  })

  it('CongestionBadge renders correct color class for each congestion level', () => {
    const { rerender } = render(<Badge variant={congestionToBadgeVariant('low')}>Low</Badge>)
    expect(screen.getByText('Low').className).toContain('emerald')

    rerender(<Badge variant={congestionToBadgeVariant('critical')}>Critical</Badge>)
    expect(screen.getByText('Critical').className).toContain('red')
  })

  it('AlertsPanel renders "All Clear" when alerts array is empty', () => {
    useVenueStore.setState({ alerts: [], isConnected: true })
    render(<RecentAlerts />)
    expect(screen.getByText('All Clear')).toBeInTheDocument()
  })

  it('ChatInput disables send button when input is empty', () => {
    render(<Assistant />)
    const btn = screen.getByLabelText('Send message') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })
})
