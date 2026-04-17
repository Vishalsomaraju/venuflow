// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Dashboard } from '@/pages/Dashboard'
import { VenueMap } from '@/pages/VenueMap'
import { Assistant } from '@/pages/Assistant'
import { Admin } from '@/pages/Admin'
import { useAuthStore } from '@/store/authStore'
import { useVenueSubscription } from '@/hooks/useVenueSubscription'
import { useSimulationCleanup } from '@/hooks/useSimulationCleanup'
import { cn } from '@/lib/utils'

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const isStaff = useAuthStore((s) => s.isStaff())

  if (!isStaff) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  // Single subscription point for all Firestore real-time data
  useVenueSubscription()

  // Clean up simulator on unmount
  useSimulationCleanup()

  return (
    <div className={cn('flex h-screen bg-primary-bg text-text-primary')}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<VenueMap />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
