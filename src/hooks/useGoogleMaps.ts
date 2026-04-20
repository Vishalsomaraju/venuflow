// Google Service: Google Maps JavaScript API (@googlemaps/js-api-loader)
// Purpose: Lazy-loads the Google Maps JS SDK once per session for the interactive venue map.
// Docs: https://developers.google.com/maps/documentation/javascript/overview
// src/hooks/useGoogleMaps.ts
import { useState, useEffect } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

let loadStarted = false
let loadPromise: Promise<void> | null = null

type GoogleWindow = Window & {
  google?: { maps?: { Map?: unknown } }
}

/**
 * Loads the Google Maps JS API once using @googlemaps/js-api-loader v2.
 * Uses the new functional API: setOptions() + importLibrary().
 */
export function useGoogleMaps() {
  const apiKey = import.meta.env['VITE_GOOGLE_MAPS_API_KEY'] as
    | string
    | undefined
  const missingKeyMessage =
    'VITE_GOOGLE_MAPS_API_KEY is not set in .env.local. Add your Google Maps API key to enable the map.'
  const isMissingApiKey = !apiKey || apiKey === '...'
  const isGoogleMapsLoaded =
    typeof (window as GoogleWindow).google?.maps?.Map === 'function'
  const [state, setState] = useState<LoadState>(() =>
    isMissingApiKey ? 'error' : isGoogleMapsLoaded ? 'ready' : 'loading'
  )
  const [error, setError] = useState<string | null>(() =>
    isMissingApiKey ? missingKeyMessage : null
  )

  useEffect(() => {
    if (isMissingApiKey || isGoogleMapsLoaded) {
      return
    }

    if (!loadStarted) {
      loadStarted = true

      // v2 functional API
      setOptions({
        key: apiKey,
        v: 'weekly',
        libraries: ['geometry'],
      })

      loadPromise = importLibrary('maps')
        .then(() => {
          setState('ready')
        })
        .catch((err: unknown) => {
          loadStarted = false
          loadPromise = null
          setState('error')
          setError(
            err instanceof Error ? err.message : 'Failed to load Google Maps'
          )
        })
    } else if (loadPromise) {
      // Join the existing promise
      void loadPromise.then(() => setState('ready'))
    } else {
      // Fallback: poll until the global exists
      const interval = setInterval(() => {
        if (
          typeof (window as GoogleWindow).google?.maps?.Map === 'function'
        ) {
          clearInterval(interval)
          setState('ready')
        }
      }, 200)
      return () => clearInterval(interval)
    }
  }, [apiKey, isGoogleMapsLoaded, isMissingApiKey])

  return {
    isReady: state === 'ready',
    isLoading: state === 'loading' || state === 'idle',
    isError: state === 'error',
    error,
  }
}
