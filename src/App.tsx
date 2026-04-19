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
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// ── Route guards ──────────────────────────────────────────────────

function ProtectedStaffRoute({ children }: { children: React.ReactNode }) {
  const isStaff = useAuthStore((s) => s.isStaff())
  if (!isStaff) return <Navigate to="/" replace />
  return <>{children}</>
}

// ── Loading screen while Firebase resolves auth state ─────────────
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

// ── Authenticated shell (sidebar + main routes) ───────────────────
function AuthenticatedApp() {
  useVenueSubscription()
  useSimulationCleanup()

  return (
    <div className={cn('flex h-screen bg-primary-bg text-text-primary')}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto"
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

// ── Root ──────────────────────────────────────────────────────────
export default function App() {
  const loading = useAuthStore((s) => s.loading)
  const user = useAuthStore((s) => s.user)

  // Still waiting for Firebase to resolve auth state
  if (loading) return <AppLoading />

  // Not signed in at all — show login
  // (AuthProvider auto-calls signInAnonymously, so this is usually
  //  only seen for a fraction of a second on first visit)
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
