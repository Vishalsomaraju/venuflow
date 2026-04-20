# Google Services Used — VenueFlow

This document explicitly declares every Google / Firebase service integrated into
VenueFlow so that evaluators, auditors, and new contributors have a single
authoritative reference without needing to scan the entire codebase.

---

## Firebase Authentication

| Property | Value |
|----------|-------|
| Package | `firebase/auth` |
| Key files | `src/lib/firebase.ts`, `src/components/providers/AuthProvider.tsx` |
| Usage | Anonymous sign-in for attendees; Google OAuth sign-in for admin/staff |
| Docs | https://firebase.google.com/docs/auth |

---

## Cloud Firestore

| Property | Value |
|----------|-------|
| Package | `firebase/firestore` |
| Key files | `src/store/venueStore.ts`, `src/lib/staffService.ts` |
| Usage | Real-time zone, facility, and alert data sync via `onSnapshot` listeners; staff override writes via `updateDoc` / `addDoc` |
| Docs | https://firebase.google.com/docs/firestore |

---

## Firebase Hosting

| Property | Value |
|----------|-------|
| Config files | `firebase.json`, `.firebaserc` |
| Usage | Production deployment with SPA rewrites (`"destination": "/index.html"`) so client-side routing works on direct URL access |
| Docs | https://firebase.google.com/docs/hosting |

---

## Google Maps JavaScript API

| Property | Value |
|----------|-------|
| Package | `@googlemaps/js-api-loader` |
| Key files | `src/components/GoogleMap.tsx`, `src/hooks/useGoogleMaps.ts` |
| APIs enabled | Maps JavaScript API, Directions API |
| Usage | Interactive venue map with live facility markers colour-coded by wait time; walking directions from user location to the least-congested gate |
| Env var | `VITE_GOOGLE_MAPS_API_KEY` |
| Docs | https://developers.google.com/maps/documentation/javascript/overview |

---

## Gemini AI (Generative Language API)

| Property | Value |
|----------|-------|
| Package | `@google/generative-ai` |
| Key files | `src/hooks/useGemini.ts`, `src/hooks/useAssistant.ts`, `src/lib/geminiContext.ts` |
| Model | `gemini-2.5-flash` with fallback to `gemini-flash-latest` |
| Usage | Live-context AI venue assistant that answers attendee questions using real-time zone/facility/alert data injected as a system prompt; responses are streamed token-by-token |
| Env var | `VITE_GEMINI_API_KEY` |
| Docs | https://ai.google.dev/docs |

---

## Firebase Cloud Storage

| Property | Value |
|----------|-------|
| Package | `firebase/storage` |
| Key files | `src/lib/firebase.ts` |
| Usage | Initialised for potential future asset uploads (e.g. zone images, admin media) |
| Docs | https://firebase.google.com/docs/storage |

---

## Environment Variables Summary

| Variable | Service | Required |
|----------|---------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase | ✅ Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth | ✅ Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firestore / Hosting | ✅ Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Cloud Storage | ✅ Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase | ✅ Yes |
| `VITE_FIREBASE_APP_ID` | Firebase | ✅ Yes |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps | ✅ Yes |
| `VITE_GEMINI_API_KEY` | Gemini AI | ✅ Yes |
