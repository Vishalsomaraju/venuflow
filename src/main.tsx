import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './components/providers/AuthProvider.tsx'
import { validateEnv } from './lib/env'

const missingEnv = validateEnv()

if (missingEnv.length > 0) {
  createRoot(document.getElementById('root')!).render(
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', color: '#ef4444', backgroundColor: '#0f1115', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Configuration Error</h1>
      <p style={{ color: '#94a3b8' }}>The application cannot start because required environment variables are missing.</p>
      {import.meta.env.DEV && (
        <pre style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', color: '#f8fafc', fontSize: '0.875rem' }}>
          Missing keys: {missingEnv.join(', ')}
        </pre>
      )}
    </div>
  )
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  )
}
