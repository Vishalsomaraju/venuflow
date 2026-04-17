import { useEffect } from 'react'
import { stopSimulation, isSimulationRunning } from '@/lib/simulator'

export function useSimulationCleanup() {
  useEffect(() => {
    return () => {
      if (isSimulationRunning()) {
        stopSimulation()
      }
    }
  }, [])
}
