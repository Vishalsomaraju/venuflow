# Google Services Integration

This document outlines all Google services and APIs integrated into the VenueFlow application, including their specific purpose and where they are located within the codebase.

## Firebase Auth
- **SDK/Package**: `firebase/auth` (via `firebase` npm package)
- **Location**: `src/lib/firebase.ts`, `src/lib/auth.ts`
- **Purpose**: Handles secure user authentication, registration, and session management for the platform.

## Cloud Firestore
- **SDK/Package**: `firebase/firestore` (via `firebase` npm package)
- **Location**: `src/lib/firebase.ts`, `src/lib/db.ts`
- **Purpose**: Acts as the primary real-time database. It stores and syncs venue metrics, zone congestion levels, facility statuses, and alerts across all connected clients.

## Firebase Hosting
- **SDK/Package**: `firebase-tools` CLI
- **Location**: `firebase.json`
- **Purpose**: Configured for deploying, hosting, and serving the built production web application globally.

## Google Maps JavaScript API
- **SDK/Package**: `@react-google-maps/api` / Global `google.maps` object
- **Location**: `src/components/GoogleMap.tsx`, `src/hooks/useGoogleMaps.ts`
- **Purpose**: Renders the interactive, stylized stadium map, displaying custom markers, zones, gates, and essential facilities.

## Directions API
- **SDK/Package**: `google.maps.DirectionsService` / `google.maps.DirectionsRenderer`
- **Location**: `src/components/GoogleMap.tsx`
- **Purpose**: Calculates and draws optimal pedestrian routing paths on the map, dynamically guiding users to the least congested gates or specific facilities.

## Gemini AI
- **SDK/Package**: `@google/generative-ai`
- **Location**: `src/hooks/useGemini.ts`, `src/lib/geminiContext.ts`
- **Purpose**: Powers the intelligent AI assistant. It processes real-time venue context to provide users with accurate, context-aware conversational support and recommendations.
