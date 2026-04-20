// src/App.tsx
import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
const Dashboard = lazy(() =>
  import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard }))
)
const VenueMap = lazy(() =>
  import('@/pages/VenueMap').then((m) => ({ default: m.VenueMap }))
)
const Assistant = lazy(() =>
  import('@/pages/Assistant').then((m) => ({ default: m.Assistant }))
)
const Admin = lazy(() =>
  import('@/pages/Admin').then((m) => ({ default: m.Admin }))
)
const StaffPanel = lazy(() =>
  import('@/pages/StaffPanel').then((m) => ({ default: m.StaffPanel }))
)
const Login = lazy(() =>
  import('@/pages/Login').then((m) => ({ default: m.Login }))
)
import { useAuthStore } from '@/store/authStore'
import { useVenueSubscription } from '@/hooks/useVenueSubscription'
import { useSimulationCleanup } from '@/hooks/useSimulationCleanup'
import { Loader2 } from 'lucide-react'

function ProtectedStaffRoute({ children }: { children: React.ReactNode }) {
  const isStaff = useAuthStore((s) => s.isStaff())
  if (!isStaff) return <Navigate to="/" replace />
  return <>{children}</>
}

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = useAuthStore((s) => s.isAdmin())
  if (!isAdmin) return <Navigate to="/" replace />
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

function RouteFallback() {
  return (
    <div className="p-6 text-sm text-text-muted" role="status" aria-live="polite">
      Loading experience...
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
          <Suspense fallback={<RouteFallback />}>
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
          </Suspense>
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
      <Suspense fallback={<AppLoading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    )
  }

  return <AuthenticatedApp />
}
