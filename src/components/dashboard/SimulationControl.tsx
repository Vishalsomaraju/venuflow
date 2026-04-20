import { useState, useCallback } from 'react'
import {
  startSimulation,
  stopSimulation,
  isSimulationRunning,
} from '@/lib/simulator'
import { cn } from '@/lib/utils'
import { Play, Radio } from 'lucide-react'
import toast from 'react-hot-toast'

export function SimulationControl() {
  const [running, setRunning] = useState(isSimulationRunning())

  const handleToggle = useCallback(() => {
    if (running) {
      stopSimulation()
      setRunning(false)
      toast.success('Simulation stopped')
    } else {
      const result = startSimulation({ intervalMs: 5000, volatility: 0.15 })
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setRunning(true)
      toast.success(result.message)
    }
  }, [running])

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
        running
          ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30'
          : 'bg-accent/15 text-accent hover:bg-accent/25 border border-accent/30'
      )}
    >
      {running ? (
        <>
          <Radio className="h-4 w-4 animate-pulse" />
          <span>Stop Simulation</span>
        </>
      ) : (
        <>
          <Play className="h-4 w-4" />
          <span>Simulate Crowd</span>
        </>
      )}
    </button>
  )
}
