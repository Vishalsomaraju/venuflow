// src/components/GoogleMap.tsx
import { useEffect, useRef, useCallback, useState } from 'react'
import { useVenueStore } from '@/store/venueStore'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { DARK_MAP_STYLES } from '@/lib/mapStyles'
import { buildMarkerSVG, waitTimeColor, markerKindFromType } from '@/lib/markerUtils'
import { getFacilityCoords, STADIUM_CENTER, STADIUM_ZOOM } from '@/lib/facilityCoords'
import { useRoutingContext } from '@/context/RoutingContext'
import { cn } from '@/lib/utils'
import type { Facility } from '@/types'
import type { RouteResult } from '@/context/RoutingContext'
import { Loader2, WifiOff, MapPin, Clock, X } from 'lucide-react'

// ─── InfoWindow HTML builder ──────────────────────────────────────
function buildInfoWindowContent(facility: Facility): string {
  const { fill } = waitTimeColor(facility.waitMinutes, facility.isOpen)
  const statusColor = facility.isOpen ? '#22c55e' : '#ef4444'
  const status = facility.isOpen ? 'Open' : 'Closed'

  return `
    <div style="font-family:'Inter',system-ui,sans-serif;background:#161b27;border:1px solid #1e2433;border-radius:12px;padding:12px 14px;min-width:200px;color:#f1f5f9;">
      <p style="font-weight:700;font-size:14px;margin:0 0 6px 0;color:#f8fafc;">${facility.name}</p>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="background:${statusColor}22;color:${statusColor};border-radius:99px;padding:2px 10px;font-size:11px;font-weight:600;">${status}</span>
        <span style="font-size:11px;background:#1e2433;color:#94a3b8;border-radius:4px;padding:2px 8px;">${facility.type}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:13px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${fill}" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style="color:#94a3b8;">Wait time:</span>
        <strong style="color:${fill};">${facility.waitMinutes} min</strong>
      </div>
    </div>
  `
}

// ─── Component ────────────────────────────────────────────────────
export function GoogleMapView() {
  const facilities = useVenueStore((s) => s.facilities)
  const { isReady, isLoading, isError, error } = useGoogleMaps()
  const { setHandle } = useRoutingContext()

  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null)

  const [activeMarkerInfo, setActiveMarkerInfo] = useState<Facility | null>(null)

  // ── Initialize map ──────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !mapDivRef.current || mapRef.current) return

    const map = new google.maps.Map(mapDivRef.current, {
      center: STADIUM_CENTER,
      zoom: STADIUM_ZOOM,
      styles: DARK_MAP_STYLES,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
      gestureHandling: 'greedy',
    })

    mapRef.current = map
    infoWindowRef.current = new google.maps.InfoWindow()

    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#6366f1',
        strokeWeight: 5,
        strokeOpacity: 0.85,
      },
    })

    // Stadium boundary
    new google.maps.Circle({
      map,
      center: STADIUM_CENTER,
      radius: 300,
      fillColor: '#6366f1',
      fillOpacity: 0.06,
      strokeColor: '#6366f1',
      strokeWeight: 1.5,
      strokeOpacity: 0.4,
    })
  }, [isReady])

  // ── Sync markers when facilities update ─────────────────────────
  useEffect(() => {
    if (!isReady || !mapRef.current || facilities.length === 0) return

    const map = mapRef.current
    const currentIds = new Set(facilities.map((f) => f.id))

    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.setMap(null)
        markersRef.current.delete(id)
      }
    })

    facilities.forEach((facility, index) => {
      const { fill, stroke } = waitTimeColor(facility.waitMinutes, facility.isOpen)
      const kind = markerKindFromType(facility.type)
      const gateNum =
        facility.type === 'gate'
          ? String(
              facilities
                .filter((f) => f.type === 'gate')
                .indexOf(facility) + 1
            )
          : undefined
      const iconUrl = buildMarkerSVG(kind, fill, stroke, gateNum)
      const position = getFacilityCoords(facility.name, index)

      const existing = markersRef.current.get(facility.id)
      if (existing) {
        existing.setIcon({
          url: iconUrl,
          scaledSize: new google.maps.Size(28, 40),
          anchor: new google.maps.Point(14, 40),
        })
      } else {
        const marker = new google.maps.Marker({
          position,
          map,
          title: facility.name,
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(28, 40),
            anchor: new google.maps.Point(14, 40),
          },
          animation: google.maps.Animation.DROP,
        })

        marker.addListener('click', () => {
          if (!infoWindowRef.current || !mapRef.current) return
          infoWindowRef.current.setContent(buildInfoWindowContent(facility))
          infoWindowRef.current.open(mapRef.current, marker)
          setActiveMarkerInfo(facility)
        })

        markersRef.current.set(facility.id, marker)
      }
    })
  }, [isReady, facilities])

  // ── Register RoutingHandle so RoutingPanel can call routeTo ──────
  const routeTo = useCallback(
    (facility: Facility, allFacilities: Facility[]): Promise<RouteResult> => {
      return new Promise((resolve, reject) => {
        if (!mapRef.current) {
          reject(new Error('Map not ready'))
          return
        }

        const facilityIndex = allFacilities.indexOf(facility)
        const destCoord = getFacilityCoords(facility.name, facilityIndex)

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            const svc = new google.maps.DirectionsService()

            svc.route(
              {
                origin,
                destination: destCoord,
                travelMode: google.maps.TravelMode.WALKING,
              },
              (result: google.maps.DirectionsResult | null, status: string) => {
                if (status === 'OK' && result && directionsRendererRef.current) {
                  directionsRendererRef.current.setDirections(result)

                  // Drop highlighted destination marker
                  destinationMarkerRef.current?.setMap(null)
                  destinationMarkerRef.current = new google.maps.Marker({
                    position: destCoord,
                    map: mapRef.current!,
                    title: facility.name,
                    icon: {
                      url: buildMarkerSVG('gate', '#6366f1', '#4f46e5'),
                      scaledSize: new google.maps.Size(36, 52),
                      anchor: new google.maps.Point(18, 52),
                    },
                    animation: google.maps.Animation.BOUNCE,
                    zIndex: 999,
                  })

                  // Pan map to show route
                  mapRef.current?.fitBounds(
                    result.routes[0]!.bounds
                  )

                  const leg = result.routes[0]?.legs[0]
                  resolve({
                    distance: leg?.distance?.text ?? '—',
                    duration: leg?.duration?.text ?? '—',
                    destinationName: facility.name,
                  })
                } else {
                  reject(
                    new Error(
                      `Directions error: ${status}. Try from closer to the stadium.`
                    )
                  )
                }
              }
            )
          },
          (err) => reject(new Error(`Location error: ${err.message}`)),
          { enableHighAccuracy: true, timeout: 8000 }
        )
      })
    },
    []
  )

  const clearRoute = useCallback(() => {
    directionsRendererRef.current?.setDirections(
      null as unknown as google.maps.DirectionsResult
    )
    destinationMarkerRef.current?.setMap(null)
    destinationMarkerRef.current = null
    if (mapRef.current) {
      mapRef.current.setCenter(STADIUM_CENTER)
      mapRef.current.setZoom(STADIUM_ZOOM)
    }
  }, [])

  // Register/unregister handle
  useEffect(() => {
    if (!isReady) return
    setHandle({ routeTo, clearRoute })
    return () => setHandle(null)
  }, [isReady, setHandle, routeTo, clearRoute])

  // ── Render ──────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5">
        <div className="text-center space-y-3 p-8 max-w-sm">
          <WifiOff className="h-10 w-10 text-red-400 mx-auto" />
          <p className="font-semibold text-text-primary">Maps failed to load</p>
          <p className="text-sm text-text-muted">{error}</p>
          <p className="text-xs text-text-muted">
            Set <code className="text-accent">VITE_GOOGLE_MAPS_API_KEY</code> in{' '}
            <code className="text-accent">.env.local</code>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full gap-3">
      {/* ── Map canvas ───────────────────────────────────── */}
      <div className="relative flex-1 min-h-[340px] rounded-2xl overflow-hidden border border-surface-border">
        <div
          ref={mapDivRef}
          className="w-full h-full"
          aria-label="Interactive venue map showing crowd density"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1117]/90 backdrop-blur-sm rounded-2xl">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 text-accent animate-spin mx-auto" />
              <p className="text-sm text-text-secondary">Loading Google Maps…</p>
            </div>
          </div>
        )}

        {/* Wait time legend */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 rounded-xl border border-surface-border bg-surface/90 backdrop-blur-sm p-3 shadow-xl">
          <p className="text-xs font-semibold text-text-secondary mb-1">Wait Time</p>
          {[
            { label: '< 5 min', color: '#22c55e' },
            { label: '5–15 min', color: '#eab308' },
            { label: '> 15 min', color: '#ef4444' },
            { label: 'Closed', color: '#374151' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-xs text-text-muted">{label}</span>
            </div>
          ))}
        </div>

        {/* Facility count */}
        {facilities.length > 0 && (
          <div className="absolute top-4 right-4 rounded-xl border border-surface-border bg-surface/90 backdrop-blur-sm px-3 py-2 flex items-center gap-2 shadow-lg">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium text-text-secondary">
              {facilities.length} facilities
            </span>
          </div>
        )}
      </div>

      {/* ── Active marker card ─────────────────────────────── */}
      {activeMarkerInfo && (
        <div className="flex items-center justify-between rounded-xl border border-surface-border bg-surface px-4 py-3">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-accent" />
            <div>
              <p className="text-sm font-semibold text-text-primary">{activeMarkerInfo.name}</p>
              <p className="text-xs text-text-muted capitalize">{activeMarkerInfo.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="h-3.5 w-3.5 text-text-muted" />
              <span
                style={{ color: waitTimeColor(activeMarkerInfo.waitMinutes, activeMarkerInfo.isOpen).fill }}
                className="font-semibold"
              >
                {activeMarkerInfo.waitMinutes} min
              </span>
            </div>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                activeMarkerInfo.isOpen
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
              )}
            >
              {activeMarkerInfo.isOpen ? 'Open' : 'Closed'}
            </span>
            <button
              onClick={() => setActiveMarkerInfo(null)}
              className="text-text-muted hover:text-text-primary transition-colors"
              aria-label="Close facility details"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
