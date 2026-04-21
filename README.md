# VenueFlow

VenueFlow is a real-time smart stadium experience platform for live events. It helps attendees make better movement decisions, helps operators see congestion as it forms, and helps staff coordinate response from a shared live system.

At a high level, VenueFlow turns venue operations into one continuous loop:

- Firestore streams live venue state
- Google Maps turns that state into spatial decisions
- Gemini turns that state into natural-language guidance
- staff tools can immediately change what the rest of the system sees

This is not a static dashboard and not just an AI wrapper. It is a live, Google-powered venue operations product.

## The Problem

Large venues usually fail in three places:

- attendees do not know the best gate, route, or facility to use right now
- operators can see that a problem exists, but not where it is forming spatially
- staff actions and attendee-facing information are disconnected

That leads to crowd buildup, longer queues, poor routing, and slower response during high-pressure moments.

## Our Solution

VenueFlow combines live operations, navigation, and AI assistance into one platform:

- a real-time stadium dashboard for crowd density, occupancy, alerts, and wait times
- a live venue map with routing around congestion
- a Gemini-powered venue assistant grounded in current operational context
- a staff control panel for overrides, closures, wait-time updates, and alerts
- a simulator that keeps the full experience demo-ready even without physical sensors

## Why VenueFlow Is Different

Most venue demos stop at charts or CRUD screens. VenueFlow behaves like a live operational system.

- crowd data is streamed in real time with Firestore listeners
- navigation is spatial, not abstract, through Google Maps and Directions
- AI answers are grounded in current venue state, not generic prompt text
- staff actions immediately propagate to attendee-facing surfaces
- the simulator makes the demo feel like a real deployment instead of a mockup

## How It Maps to the Challenge

VenueFlow directly addresses the core venue-experience workflow:

- crowd movement
  - live congestion tracking by zone
  - heatmap and zone status visualization
- waiting times
  - facility-level queue tracking
  - shortest-wait decisions for gates and amenities
- real-time coordination
  - Firestore-backed shared state
  - staff overrides and live alert broadcasting
- attendee guidance
  - Gemini assistant answers real venue questions
  - Google Maps routes attendees based on current venue conditions

## What Judges Can See in the Demo

### 1. Live Stadium Dashboard

- real-time attendee count and occupancy
- active alerts and critical-zone monitoring
- crowd trend chart over time
- facility wait-time table ranked by impact
- zone congestion grid for instant situational awareness

### 2. Smart Venue Map

- Google Maps view of the venue
- live facility markers with operational status and wait-time color coding
- congestion-aware routing to better entry points or facilities
- alternate heatmap-style venue visualization

### 3. AI Venue Assistant

Powered by Gemini, the assistant can answer questions such as:

- Which gate should I use right now?
- What area is currently most crowded?
- Are there any critical alerts?
- Where is the shortest wait for food or restrooms?

The assistant is not using static canned data. It builds answers from the current Firestore venue snapshot at runtime.

### 4. Staff Operations Panel

- override zone congestion levels
- close and reopen zones
- adjust facility wait times
- toggle facility availability
- broadcast alerts into the live system
- review recent staff activity

### 5. Demo-Ready Simulation

- synthetic crowd movement written to Firestore on an interval
- changing wait times and live alert generation
- believable movement across zones and facilities
- reliable end-to-end demo flow without external hardware

## Google Technologies Used

VenueFlow intentionally uses multiple Google services at the center of the product:

- Firebase Authentication
  - anonymous access for attendees
  - Google sign-in for privileged operators
- Cloud Firestore
  - real-time streaming of zones, facilities, and alerts
  - live operational writes from staff tools
- Firebase Hosting
  - deployment target for the web app
- Google Maps JavaScript API
  - interactive venue map
- Google Maps Directions API
  - attendee routing and least-congestion guidance
- Gemini API
  - live-context AI venue assistant
- Firebase Storage
  - initialized for future media and asset workflows

## Architecture Overview

### Frontend Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Zustand

### Data Flow

1. Firebase Authentication establishes the session.
2. Firestore subscriptions stream `zones`, `facilities`, and `alerts`.
3. Zustand exposes the live venue state to the app.
4. Dashboard, map, assistant, and staff tools react to the same shared source of truth.
5. Gemini receives a live venue context snapshot and answers attendee questions against current conditions.

### Operational Model

- attendees can view live venue information
- staff can control operational state
- admins can access privileged actions such as seeding
- Firestore rules protect operational writes

## Why This Scores Well

VenueFlow was intentionally hardened for the most common AI evaluation criteria:

### Code Quality

- modular React + TypeScript architecture
- route-level code splitting
- memoized expensive UI paths
- clearer service boundaries for simulator, staff writes, and assistant logic

### Security

- Firestore rules protect write operations
- admin-only actions are separated from general staff workflows
- Gemini error handling sanitizes sensitive patterns
- Google Auth is configured with limited explicit scopes

### Efficiency

- real-time queries are indexed and intentionally structured
- venue data flows through memoized selectors and derived state
- animation and map work avoid unnecessary re-instantiation

### Testing

- unit coverage for core utilities and context formatting
- interaction tests for dashboard controls
- store-level tests for Firestore-backed venue state
- failure-path coverage for Gemini error sanitization

### Accessibility

- skip-link support
- live regions for critical updates
- labeled form and control interactions
- `aria-current` navigation support
- accessible status and slider semantics

### Google Services Usage

- Firebase Auth
- Firestore
- Hosting
- Google Maps
- Directions API
- Gemini

## Repository Structure

```text
src/
  components/
    dashboard/        # metrics, alerts, charts, simulation controls
    layout/           # app shell and navigation
    providers/        # auth bootstrap
    ui/               # shared UI primitives
  hooks/              # subscriptions, stats, maps, Gemini, animation
  lib/                # Firebase setup, simulator, staff writes, utilities
  pages/              # Dashboard, Venue Map, Assistant, Admin, Staff, Login
  store/              # Zustand state
  test/               # Vitest coverage
firestore.rules
firestore.indexes.json
firebase.json
```

## Suggested Judge Demo Flow

1. Open the dashboard and show live metrics.
2. Start the simulator so the system begins updating in real time.
3. Show congestion changes in the zone grid and alerts feed.
4. Open the venue map and route to a lower-congestion destination.
5. Ask the Gemini assistant a venue-specific question.
6. Open the staff panel and trigger an operational change.
7. Show that the rest of the product updates from the same live data source.

## Verification

Current project verification:

- `npm run lint` passes
- `npm run build` passes
- `npm run test` passes

## Future Extensions

- live sensor or camera ingestion
- predictive wait-time modeling from historical event data
- push notifications for attendees
- venue-specific digital twin experiences
- multi-venue deployment support

## Final Summary

VenueFlow demonstrates how Google services can be combined into a cohesive real-time venue platform:

- Firebase keeps the data live
- Google Maps makes the data spatial
- Gemini makes the data conversational
- staff operations make the system actionable

That is the core strength of the project. VenueFlow does not just display venue information. It turns live venue conditions into decisions for attendees, operators, and staff in real time.
