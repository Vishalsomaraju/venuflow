// src/pages/Login.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { cn } from '@/lib/utils'
import { Loader2, Eye, EyeOff, Zap, Shield, Users } from 'lucide-react'
import toast from 'react-hot-toast'

const googleProvider = new GoogleAuthProvider()

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState<'email' | 'google' | 'guest' | null>(
    null
  )

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading('email')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      toast.error(
        msg.includes('user-not-found') ||
          msg.includes('wrong-password') ||
          msg.includes('invalid-credential')
          ? 'Invalid email or password'
          : msg
      )
    } finally {
      setLoading(null)
    }
  }

  async function handleGoogle() {
    setLoading('google')
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed'
      if (!msg.includes('popup-closed')) toast.error(msg)
    } finally {
      setLoading(null)
    }
  }

  async function handleGuest() {
    setLoading('guest')
    try {
      await signInAnonymously(auth)
      navigate('/')
    } catch {
      toast.error('Guest access failed. Please try logging in.')
    } finally {
      setLoading(null)
    }
  }

  const busy = loading !== null

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-accent/15 border border-accent/25 mb-4">
            <Zap className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">VenueFlow</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Real-time Stadium Management
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-text-primary mb-5">
            Sign in to your account
          </h2>

          {/* Email form */}
          <form onSubmit={handleEmail} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-xs font-semibold text-text-secondary uppercase tracking-wide"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@venueflow.demo"
                disabled={busy}
                autoComplete="email"
                className={cn(
                  'w-full rounded-xl border border-surface-border bg-surface-light',
                  'px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted',
                  'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50',
                  'disabled:opacity-50 transition-all'
                )}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="text-xs font-semibold text-text-secondary uppercase tracking-wide"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={busy}
                  autoComplete="current-password"
                  className={cn(
                    'w-full rounded-xl border border-surface-border bg-surface-light',
                    'px-4 py-2.5 pr-10 text-sm text-text-primary placeholder:text-text-muted',
                    'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50',
                    'disabled:opacity-50 transition-all'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  tabIndex={-1}
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !email || !password}
              className={cn(
                'w-full flex items-center justify-center gap-2 rounded-xl py-2.5',
                'bg-accent text-white font-semibold text-sm',
                'hover:bg-accent/90 active:scale-[0.98] transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
              )}
            >
              {loading === 'email' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {loading === 'email' ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-surface-border" />
            <span className="text-xs text-text-muted">or</span>
            <div className="h-px flex-1 bg-surface-border" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={busy}
            className={cn(
              'w-full flex items-center justify-center gap-2.5 rounded-xl py-2.5',
              'border border-surface-border bg-surface-light text-text-primary font-medium text-sm',
              'hover:border-accent/30 hover:bg-surface active:scale-[0.98] transition-all',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
            )}
          >
            {loading === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {loading === 'google' ? 'Opening Google…' : 'Continue with Google'}
          </button>

          {/* Guest */}
          <button
            onClick={handleGuest}
            disabled={busy}
            className={cn(
              'w-full flex items-center justify-center gap-2 rounded-xl py-2.5 mt-3',
              'text-text-muted text-sm hover:text-text-secondary transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading === 'guest' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Users className="h-3.5 w-3.5" />
            )}
            Continue as Guest (view only)
          </button>
        </div>

        {/* Demo credentials hint */}
        <div className="mt-4 rounded-xl border border-surface-border bg-surface/50 p-3">
          <p className="text-xs text-text-muted text-center font-medium mb-2">
            Demo Credentials
          </p>
          <div className="space-y-1 text-xs text-text-muted font-mono text-center">
            <p>admin@venueflow.demo — set this up in Firebase Console</p>
            <p className="text-[10px]">
              Firebase Console → Authentication → Add user
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
