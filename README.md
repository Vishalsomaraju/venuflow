# VenueFlow

VenueFlow is a real-time smart stadium experience platform built for live venue operations. It combines real-time crowd monitoring, AI-powered visitor assistance, staff coordination tools, and congestion-aware navigation into one system designed for high-footfall events.

The core idea is simple: attendees should know where to go, operators should know where problems are forming, and both should be working from the same live data.

## What It Solves

Large venues struggle with three recurring problems:

- crowd movement is hard to visualize in real time
- queue and wait-time information is usually delayed or unavailable
- venue staff and visitors often work from different sources of truth

VenueFlow addresses that with a single live platform:

- a real-time stadium dashboard for crowd density, alerts, and facility wait times
- a congestion-aware venue map with Google Maps routing
- a Gemini-powered AI assistant grounded in live venue context
- a staff control panel for operational overrides and emergency broadcasts
- a simulation engine so the product can be demoed reliably even without live stadium sensors

## Why It Stands Out

Most hackathon venue projects stop at static dashboards or CRUD tooling. VenueFlow is designed as a live operational system.

- Firestore `onSnapshot` listeners keep the UI continuously updated
- Google Maps adds spatial awareness instead of just charts
- Gemini answers real attendee questions using current crowd, alert, and facility data
- staff can actively change congestion states, close zones, update wait times, and broadcast alerts
- the simulator creates believable live behavior for demos and evaluation

## Core Features

### Live Stadium Dashboard

- total attendees, occupancy, active alerts, gate availability, and wait-time metrics
- zone congestion cards with live severity states
- recent alerts feed and crowd trend chart
- facility wait-time table sorted by operational impact

### Smart Venue Map

- interactive Google Maps view with live facility markers
- facility status and wait-time color coding
- walking directions to facilities and gates
- alternate heatmap-style visualization for venue congestion

### AI Venue Assistant

- powered by Gemini
- answers questions like:
  - where should I enter right now?
  - which zone is most crowded?
  - are there any critical alerts?
  - where are wait times shortest?
- uses a live system prompt built from current Firestore venue state

### Staff Operations Panel

- manually override zone congestion
- close and reopen zones
- adjust facility wait times
- toggle facility availability
- broadcast live alerts to the system
- activity feed for recent operational actions

### Demo-Ready Simulation

- writes synthetic crowd and facility updates to Firestore on an interval
- updates zone occupancy and wait times
- generates realistic alert activity
- makes the system look and behave like a live deployment during judging

## Google Technologies Used

VenueFlow is intentionally built around Google services:

- Firebase Authentication
  - anonymous access for attendees
  - Google sign-in for privileged operators
- Cloud Firestore
  - real-time zone, facility, and alert synchronization
  - operational writes for staff actions
- Firebase Hosting
  - SPA deployment target
- Google Maps JavaScript API
  - interactive venue navigation and facility mapping
- Google Maps Directions API
  - attendee routing to least-congested destinations
- Gemini API
  - live-context AI assistant for venue questions
- Firebase Storage
  - initialized for future media and asset workflows

See [GOOGLE_SERVICES.md](/E:/venueflow/GOOGLE_SERVICES.md) for the explicit service inventory.

## Architecture

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Zustand for local app state

### Data Flow

1. Firebase Auth establishes the session.
2. Firestore subscriptions stream `zones`, `facilities`, and `alerts`.
3. Zustand stores normalize live data for the UI.
4. Dashboard, map, and staff panels react to the same real-time source.
5. Gemini receives a live venue context snapshot and answers user questions.

### Operational Model

- attendees can view live venue data
- staff can manage live operations
- admins can access admin-only actions like database seeding
- Firestore security rules enforce write protection for operational collections

## Repository Structure

```text
src/
  components/
    dashboard/        # dashboard widgets, charts, alerts, simulation controls
    layout/           # sidebar and app shell
    providers/        # auth bootstrap
    ui/               # shared UI primitives
  hooks/              # venue stats, subscriptions, Gemini, maps, animation
  lib/                # Firebase setup, Firestore writes, simulator, utilities
  pages/              # Dashboard, Venue Map, Assistant, Admin, Staff Panel, Login
  store/              # Zustand stores
  test/               # Vitest coverage
firestore.rules
firestore.indexes.json
firebase.json
```

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` from `.env.example` and provide:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_GOOGLE_MAPS_API_KEY=
VITE_GEMINI_API_KEY=
VITE_GCP_PROJECT_ID=
```

### 3. Enable Firebase Authentication

In Firebase Console:

- enable Anonymous authentication
- configure Google sign-in if using staff/admin login

### 4. Run the app

```bash
npm run dev
```

### 5. Optional: deploy Firestore rules and indexes

```bash
firebase deploy --only firestore
```

## Demo Flow

The intended judging flow is:

1. Open the dashboard and show live metrics.
2. Start the simulator to generate real-time venue updates.
3. Show the zone grid and alert feed reacting live.
4. Open the venue map and route to a lower-congestion destination.
5. Ask the Gemini assistant venue-specific questions.
6. Switch to the staff panel and override a zone or broadcast an alert.
7. Show the attendee-facing screens update in real time.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:coverage
npm run deploy
```

## Quality Notes

VenueFlow was hardened for automated code review across:

- code quality
- security
- efficiency
- testing
- accessibility
- Google services usage

Current verification status:

- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes

## Accessibility

The UI includes:

- skip navigation support
- live regions for critical operational changes
- `aria-current` navigation state
- labeled interactive controls in staff workflows
- accessible status indicators for alerts and live updates

## Security

Key security decisions:

- Firestore rules protect write operations for operational data
- admin-only actions are separated from staff workflows
- Gemini error handling sanitizes API-key-like patterns
- simulator and seeding workflows require authentication
- Google Auth requests only the scopes needed for identity

## Future Extensions

- sensor or camera-driven real crowd ingestion
- predictive wait-time modeling from historical event data
- push notifications for attendees
- venue-specific digital twin views
- multi-stadium deployment support

## Submission Summary

VenueFlow is a smart stadium platform that demonstrates:

- real-time coordination with Firebase
- spatial decision-making with Google Maps
- live AI assistance with Gemini
- operational tooling for staff
- a polished, demo-ready system instead of a static mockup

That combination is what makes it a strong hackathon submission: it is not just a dashboard, and not just an AI wrapper. It is a live Google-powered venue operations product.
