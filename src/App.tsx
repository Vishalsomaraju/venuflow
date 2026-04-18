import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Dashboard } from '@/pages/Dashboard'
import { Assistant } from '@/pages/Assistant'
import { Admin } from '@/pages/Admin'

const VenueMap = lazy(() => import('@/pages/VenueMap').then(m => ({ default: m.VenueMap })))
const StaffPanel = lazy(() => import('@/pages/StaffPanel').then(m => ({ default: m.StaffPanel })))
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
      {/* ── Skip to main content (WCAG 2.4.1) ─────────────── */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Sidebar />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto md:ml-16"
        aria-label="Main content"
        tabIndex={-1}
      >
        <div className="p-6">
          <Suspense fallback={
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-text-muted">
                <span className="h-4 w-4 rounded-full border-2 border-accent border-r-transparent animate-spin" />
                <span className="text-sm font-medium">Loading module...</span>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<VenueMap />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
              <Route path="/staff" element={<ProtectedAdminRoute><StaffPanel /></ProtectedAdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
