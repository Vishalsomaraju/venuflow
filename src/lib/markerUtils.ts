// src/lib/markerUtils.ts
// Helpers for building SVG data-URI marker icons for Google Maps

export type MarkerKind = 'gate' | 'restroom' | 'concession' | 'medical' | 'info' | 'merchandise'

interface WaitColor {
  fill: string
  stroke: string
}

export function waitTimeColor(minutes: number, isOpen: boolean): WaitColor {
  if (!isOpen) return { fill: '#374151', stroke: '#4b5563' }
  if (minutes < 5)  return { fill: '#22c55e', stroke: '#16a34a' }
  if (minutes < 15) return { fill: '#eab308', stroke: '#ca8a04' }
  return { fill: '#ef4444', stroke: '#dc2626' }
}

// Returns an inline SVG as a data URI for Google Maps icon
export function buildMarkerSVG(
  kind: MarkerKind,
  fill: string,
  stroke: string,
  label?: string
): string {
  const icons: Record<MarkerKind, string> = {
    gate: `<path d="M7 2h10v20H7V2zm4 8h2v4h-2v-4z" fill="white"/>`,
    restroom: `<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="white"/>`,
    concession: `<path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2V8h-2V3zm-2 10c0 1.1-.9 2-2 2h-6c-1.1 0-2-.9-2-2V5h10v8z" fill="white"/>`,
    medical: `<path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" fill="white"/>`,
    info: `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="white"/>`,
    merchandise: `<path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm0 10c-1.66 0-3-1.34-3-3h2c0 .55.45 1 1 1s1-.45 1-1h2c0 1.66-1.34 3-3 3z" fill="white"/>`,
  }

  const icon = icons[kind] ?? icons.info
  const numLabel = label
    ? `<text x="12" y="34" text-anchor="middle" font-size="9" font-weight="700" font-family="system-ui" fill="${fill}">${label}</text>`
    : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <defs>
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
      </filter>
    </defs>
    <!-- Pin body -->
    <path d="M14 2 C8 2 4 7 4 13 C4 22 14 38 14 38 C14 38 24 22 24 13 C24 7 20 2 14 2 Z"
      fill="${fill}" stroke="${stroke}" stroke-width="1.5" filter="url(#shadow)"/>
    <!-- Icon inside pin -->
    <g transform="translate(2, 2) scale(0.833)">${icon}</g>
    ${numLabel}
  </svg>`

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function markerKindFromType(type: string): MarkerKind {
  const map: Record<string, MarkerKind> = {
    gate: 'gate',
    restroom: 'restroom',
    concession: 'concession',
    medical: 'medical',
    info: 'info',
    merchandise: 'merchandise',
  }
  return map[type] ?? 'info'
}
