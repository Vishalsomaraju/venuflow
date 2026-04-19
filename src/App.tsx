// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Dashboard } from '@/pages/Dashboard'
import { VenueMap } from '@/pages/VenueMap'
import { Assistant } from '@/pages/Assistant'
import { Admin } from '@/pages/Admin'
import { StaffPanel } from '@/pages/StaffPanel'
import { Login } from '@/pages/Login'
import { useAuthStore } from '@/store/authStore'
import { useVenueSubscription } from '@/hooks/useVenueSubscription'
import { useSimulationCleanup } from '@/hooks/useSimulationCleanup'
import { Loader2 } from 'lucide-react'

function ProtectedStaffRoute({ children }: { children: React.ReactNode }) {
  const isStaff = useAuthStore((s) => s.isStaff())
  if (!isStaff) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppLoading() {
  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 text-accent animate-spin mx-auto" />
        <p className="text-sm text-text-secondary">Loading VenueFlow…</p>
      </div>
    </div>
  )
}

function AuthenticatedApp() {
  useVenueSubscription()
  useSimulationCleanup()

  return (
    <div className="flex min-h-screen bg-primary-bg text-text-primary">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Sidebar />

      {/* md:ml-16 clears the collapsed sidebar (w-16 = 4rem = 64px) */}
      {/* pb-16 clears the mobile bottom tab bar */}
      <main
        id="main-content"
        className="flex-1 md:ml-16 pb-16 md:pb-0 overflow-y-auto min-h-screen"
        aria-label="Main content"
        tabIndex={-1}
      >
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<VenueMap />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route
              path="/admin"
              element={
                <ProtectedStaffRoute>
                  <Admin />
                </ProtectedStaffRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedStaffRoute>
                  <StaffPanel />
                </ProtectedStaffRoute>
              }
            />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const loading = useAuthStore((s) => s.loading)
  const user = useAuthStore((s) => s.user)

  if (loading) return <AppLoading />

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return <AuthenticatedApp />
}
