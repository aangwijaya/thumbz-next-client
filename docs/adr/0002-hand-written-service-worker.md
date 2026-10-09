# 0002 — A small hand-written service worker

**Status:** accepted (2026-10)

## Context
The app should install as a PWA, survive flaky mobile networks and receive
match reminders. PWA frameworks (e.g. Serwist) add build integration and
precache manifests we would mostly not use.

## Decision
`public/sw.js` (~130 lines), registered in production only:
- hashed build assets, icons and images: cache-first;
- public pages: network-first, then the last copy, then `/offline`;
- **never cached:** anything cross-origin (API, auth, payments, DRM licences,
  video segments), non-GET requests, private routes (`/me`, `/login`, `/auth`,
  `/api`);
- `push` / `notificationclick` for reminders, with notification URLs limited
  to same-origin paths.

## Consequences
- No precache of every route: the first offline visit to an unseen page shows
  `/offline`. Acceptable for a live-data product.
- The worker is plain JS reviewed like any other code; `sw.js` is served with
  `no-cache` so updates are picked up on the next navigation.
