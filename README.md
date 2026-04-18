# VenueFlow — Real-time Smart Stadium Management

A production-grade React + TypeScript + Firebase dashboard for live stadium crowd management, built with Vite.

## Tech Stack

| Layer    | Technology                             |
| -------- | -------------------------------------- |
| Frontend | React 19, TypeScript 6, Vite 8         |
| Styling  | Tailwind CSS 3, Framer Motion          |
| State    | Zustand 5 with Firestore subscriptions |
| Backend  | Firebase (Firestore, Auth, Hosting)    |
| Maps     | Google Maps JS API v3                  |
| AI       | Google Gemini 1.5 Flash                |
| Testing  | Vitest 4, Testing Library              |

---

## Quick Start

### 1 — Clone & install

```bash
git clone <repo-url>
cd venueflow
npm install
```

### 2 — Environment variables

Create `.env.local` in the project root:

```env
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Google Maps (enable Maps JS API + Directions API in Google Cloud Console)
VITE_GOOGLE_MAPS_API_KEY=...

# Gemini AI (optional — enables the AI assistant)
VITE_GEMINI_API_KEY=...
```

### 3 — Seed the database

**Option A: Python script (recommended)**

```bash
# Install the Firebase Admin SDK
pip install firebase-admin

# Download service account key from:
# Firebase Console → Project Settings → Service accounts → Generate new private key
# Save as serviceAccountKey.json in the project root

python seed_firestore.py

# Optional flags:
python seed_firestore.py --wipe        # wipe existing data first
python seed_firestore.py --dry-run     # preview without writing
```

**Option B: Admin panel in the browser**

1. Run `npm run dev`
2. Open http://localhost:5173
3. Click "Staff Mode" (bottom-right corner)
4. Navigate to Admin → "Seed Database"

### 4 — Run

```bash
npm run dev        # development server
npm run build      # production build
npm run preview    # preview production build
npm test           # run test suite
```

---

## Firestore Rules

Deploy the included `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

---

## Deployment

### Firebase Hosting

```bash
npm run deploy
# equivalent to: vite build && firebase deploy --only hosting,firestore
```

### Vercel

Push to GitHub — `vercel.json` handles SPA routing automatically.

---

## Architecture

```
src/
├── components/
│   ├── dashboard/       # Stat cards, zone grid, alerts, charts
│   ├── layout/          # Sidebar, AppLayout
│   ├── providers/       # AuthProvider (Firebase Auth listener)
│   └── ui/              # Badge, Card, Skeleton, LoadingSpinner
├── context/             # RoutingContext (map ↔ routing panel)
├── hooks/               # useVenueStats, useVenueSubscription, ...
├── lib/
│   ├── firebase.ts      # Firebase app init
│   ├── simulator.ts     # Background crowd simulation engine
│   ├── seedData.ts      # Browser-based Firestore seeder
│   └── ...
├── pages/               # Dashboard, VenueMap, Assistant, Admin, StaffPanel
├── store/               # Zustand stores (venueStore, authStore, uiStore)
└── types/               # TypeScript interfaces
```

### Simulator ↔ Seed ID Contract

`simulator.ts` uses **stable document IDs** (`north-stand`, `gate-a`, etc.) to update Firestore.
`seedData.ts` and `seed_firestore.py` create documents with the **same IDs**.
Breaking this contract means simulator writes silently fail.

---

## Key Features

- **Live Firestore subscriptions** — zones, facilities, alerts update in real-time
- **Crowd Simulation Engine** — background worker drives realistic crowd waves
- **SVG Heatmap** — custom hand-crafted stadium visualization with zone tooltips
- **Google Maps Integration** — facility markers, walking directions, routing panel
- **AI Assistant** — Gemini 1.5 Flash with live venue context injection
- **Staff Panel** — override zone congestion, toggle facilities, broadcast alerts
- **Role-based access** — user / staff / admin roles

---

## Test Coverage

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

Six test suites covering:

- `calcCongestionLevel` — threshold logic
- `sortFacilitiesByWait` — sort stability
- `findNearestOpenFacility` — geospatial logic
- `buildVenueSystemPrompt` — AI context generation
- `SimulationControl` — component rendering
- `ZoneCongestionGrid` — component + badge variants

---

## Troubleshooting

| Problem                        | Fix                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| Map doesn't load               | Set `VITE_GOOGLE_MAPS_API_KEY`, enable Maps JS API + Directions API in Google Cloud Console |
| Simulator writes fail silently | Run seed script first — simulator expects stable doc IDs                                    |
| No data on dashboard           | Seed the database (see step 3 above)                                                        |
| AI assistant disabled          | Set `VITE_GEMINI_API_KEY`                                                                   |
| Firestore permission denied    | Deploy `firestore.rules` or set test mode in Firebase Console                               |
