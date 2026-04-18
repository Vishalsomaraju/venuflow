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
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiKey = import.meta.env['VITE_GOOGLE_MAPS_API_KEY'] as
      | string
      | undefined

    if (!apiKey || apiKey === '...') {
      setState('error') // eslint-disable-line react-hooks/set-state-in-effect
      setError(
        'VITE_GOOGLE_MAPS_API_KEY is not set in .env.local. Add your Google Maps API key to enable the map.'
      )
      return
    }

    // Already fully loaded
    if (typeof (window as GoogleWindow).google?.maps?.Map === 'function') {
      setState('ready')
      return
    }

    setState('loading')

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
  }, [])

  return {
    isReady: state === 'ready',
    isLoading: state === 'loading' || state === 'idle',
    isError: state === 'error',
    error,
  }
}
