# VenueFlow — Fix Checklist & Setup Guide

## Root Causes Fixed (5 bugs)

| #   | File                                        | Bug                                                                                                                                                                | Fix                                                            |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| 1   | `src/main.tsx`                              | No `BrowserRouter` — React Router threw "useRoutes() may only be used in a Router context" → **blank white screen**                                                | Added `<BrowserRouter>` + `<AuthProvider>`                     |
| 2   | `src/components/providers/AuthProvider.tsx` | Never called `signInAnonymously` → users were always unauthenticated → Firestore alerts rule (`auth != null`) denied reads                                         | Added auto `signInAnonymously()` when no user session exists   |
| 3   | `src/store/venueStore.ts`                   | Alerts query used `where()` + `orderBy()` on different fields → required composite Firestore index that didn't exist → `FirebaseError` crashed alerts subscription | Removed `orderBy` from query, sort client-side instead         |
| 4   | `firestore.indexes.json`                    | File missing but referenced in `firebase.json` → `firebase deploy` failed                                                                                          | Created with correct composite indexes                         |
| 5   | `firestore.rules`                           | Old rules blocked alert reads unless user was admin — combined with Bug 2, alerts never loaded                                                                     | Alerts now readable by any signed-in user (anonymous included) |

---

## Files to Replace

Copy each file to the exact path shown:

```
src/main.tsx                              ← main.tsx
src/components/providers/AuthProvider.tsx ← AuthProvider.tsx
src/store/venueStore.ts                   ← venueStore.ts
firestore.rules                           ← firestore.rules
firestore.indexes.json                    ← firestore.indexes.json (NEW FILE)
```

---

## Firebase Console: Enable Anonymous Auth (REQUIRED)

The fixed `AuthProvider` calls `signInAnonymously()`. You must enable this in Firebase:

1. Go to: https://console.firebase.google.com/project/venueflow-promptwars-493616/authentication/providers
2. Click **"Anonymous"**
3. Toggle **"Enable"** → Save

Without this, `signInAnonymously()` throws "auth/operation-not-allowed" and alerts won't load.

---

## One-time Setup

```bash
# 1. Install deps (if not done)
npm install

# 2. Seed the database (if not done)
python seed_firestore.py

# 3. Deploy Firestore rules + indexes
firebase deploy --only firestore

# 4. Start dev server
npm run dev
```

---

## Verification: Dashboard Should Show

After these fixes, opening `http://localhost:5173` you should see:

- ✅ **Key Metrics** — Total Attendees ~43,605, Avg Wait Time, Open Gates 3/4, Active Alerts 5
- ✅ **Zone Status Grid** — 12 zone cards with congestion bars (South Stand = CRITICAL, West Wing = HIGH)
- ✅ **Recent Alerts** — 5 alerts including 1 critical (South Stand)
- ✅ **Facility Wait Times** — 22 facilities sorted by wait time

If you click **Staff Mode** (bottom-right button) you get the Staff Panel to control zones live.

---

## Troubleshooting

| Symptom                                          | Cause                                       | Fix                                                     |
| ------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------- |
| Blank white screen                               | Missing BrowserRouter                       | Replace `main.tsx`                                      |
| No data, skeletons spin forever                  | Firestore not seeded OR subscription error  | Check browser console; run `python seed_firestore.py`   |
| Alerts show 0                                    | Anonymous auth disabled                     | Enable in Firebase Console (see above)                  |
| `firebase deploy` fails                          | Missing `firestore.indexes.json`            | Add the new file                                        |
| "Missing or insufficient permissions" in console | Firestore rules not deployed                | Run `firebase deploy --only firestore`                  |
| Simulator writes don't change anything           | Mismatch between seed IDs and simulator IDs | Use the fixed `seed_firestore.py` which uses stable IDs |
