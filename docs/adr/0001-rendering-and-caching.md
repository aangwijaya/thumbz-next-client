# 0001 — Static/ISR where public, dynamic only where personal

**Status:** accepted (2026-10)

## Context
Every page used to be `force-dynamic` because the root layout read a cookie
(spoiler mode) on the server, so nothing could be served from the CDN.

## Decision
- The spoiler preference is applied by a tiny inline script before first
  paint (`data-hide-scores` on `<html>` + CSS), so the layout no longer needs
  `cookies()`.
- Public detail pages (`/teams/[id]`, `/players/[id]`, `/videos/[id]`) are ISR:
  rendered on first request, served from the CDN, refreshed on an interval
  **and** on demand: the API calls `POST /api/revalidate` with cache tags after
  writes (`revalidateTag`).
- Pages that depend on the visitor or on query strings stay dynamic: home
  (followed teams, continue watching), the match page (signed-in state, live
  data), search and filtered lists (`searchParams`). Their API reads still go
  through the Next data cache with tags.
- Account pages (`/profile`, `/favorites`, `/history`, `/me/*`) are static
  shells that fetch with the user's token on the client.
- Metadata renders in `<head>` for every client (`htmlLimitedBots`), not
  streamed after the content.

## Consequences
- Most catalog traffic is CDN hits; the API sees revalidations, not views.
- A failed revalidation keeps serving the last good page (ISR semantics).
