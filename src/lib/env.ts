const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_GOOGLE_MAPS_API_KEY',
] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter(
    (key) => !import.meta.env[key]
  )
  if (missing.length > 0 && import.meta.env.DEV) {
    // Only log in dev, never in prod
    console.warn(`[VenueFlow] Missing env vars: ${missing.join(', ')}`)
  }
  return missing
}
