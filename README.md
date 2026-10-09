# thumbz-next-client

Web app for **THUMBZ**, a Mobile Legends esports companion: watch live
matches with realtime stats and chat, protected replays, venue tickets paid by
QRIS / bank virtual account / crypto, fuzzy search, and match reminders. It
installs as a PWA on Android, iOS and desktop.

Next.js 15 (App Router) · React 19 · TanStack Query · Tailwind 4 · Supabase
Auth · Socket.IO · shaka-player · Playwright · Vitest.

The API lives in [`thumbz-server`](../thumbz-server). Its contract,
`thumbz-server/docs/API-CONTRACT.md`, is the boundary; types are generated
from its OpenAPI document (`npm run gen:api`).

## Engineering highlights

| Area | What | Where |
| --- | --- | --- |
| Rendering | ISR for public pages + on-demand revalidation by tag from the API; dynamic only where personal ([ADR 0001](docs/adr/0001-rendering-and-caching.md)) | `src/app/**/page.tsx`, `src/app/api/revalidate/` |
| Lists | Numbered, shareable pagination; infinite replay feed (keyset cursors, IntersectionObserver, "Load more" fallback, scroll restored on back) | `src/components/ui/Pagination.tsx`, `src/components/video/VideoFeed.tsx` |
| Search | Deep-linkable `/search?q=&type=&page=` (server-rendered), debounced URL updates, ⌘K command palette with suggestions | `src/app/search/`, `src/components/search/` |
| Realtime | Lazy Socket.IO client, rooms, sequence-gap detection → REST resync, polling only while disconnected | `src/lib/realtime/`, `src/components/match/LiveMatchProvider.tsx` |
| Video & DRM | shaka-player; picks Widevine/PlayReady → ClearKey → native HLS (Apple) → HLS via MSE; rotating playback tokens, heartbeats, device limit, quality menu, PiP, iOS fullscreen, keyboard shortcuts | `src/components/video/`, `src/lib/player/` |
| Checkout | QRIS (QR rendered client-side), bank VA, crypto; idempotent retries; payment status over the socket | `src/components/checkout/` |
| PWA | Manifest + maskable icons, hand-written service worker with offline fallback, install prompt / iOS steps, Web Push reminders ([ADR 0002](docs/adr/0002-hand-written-service-worker.md)) | `public/sw.js`, `src/components/pwa/`, `src/components/account/MatchReminders.tsx` |
| Speed | Navigation progress bar, route skeletons, lazy heavy components, image CDN loader (WebP, sized), preconnect, real-user Web Vitals to `/api/vitals` | `src/components/layout/`, `src/lib/image-loader.ts` |
| Cross-platform | `dvh`, safe areas, no input zoom on iOS, sticky bars under the header, `hover:hover` only | `src/app/globals.css` |
| Accessibility | Skip link, WAI-ARIA tabs with arrow keys, focus return, labelled controls, contrast fixed to AA | throughout |
| SEO | Metadata in `<head>`, title template, sitemap, robots, per-match Open Graph image, `SportsEvent` JSON-LD | `src/app/sitemap.ts`, `src/app/matches/[id]/` |
| Security | Strict image hosts, security headers + CSP (report-only), safe `next` redirects, server-side `getClaims()` | `next.config.ts`, `src/middleware.ts` |

## Quick start

Requirements: Node (see `.nvmrc`) and the API running locally (see the
server README; `LIVE_SIMULATOR=true` on its worker makes live matches play).

```bash
cp .env.example .env.local     # NEXT_PUBLIC_API_URL, Supabase URL + anon key
npm ci
npm run dev                    # http://localhost:3000
```

The service worker registers in production builds only:
`npm run build && npm start`.

## Testing

| Suite | Command | Notes |
| --- | --- | --- |
| Lint + types | `npm run lint && npm run typecheck` | |
| Unit / component | `npm run test:cov` | Vitest + Testing Library; coverage floor on the logic layer |
| End to end | `npm run test:e2e` | Playwright: Desktop Chrome, Desktop Safari, iPhone, Pixel, against a running stack ([ADR 0003](docs/adr/0003-cross-browser-testing.md)) |
| Lighthouse | `npm run lighthouse` | Budgets in `lighthouserc.json` |

Local results on the production build: 48 e2e tests pass on all four browser
projects (5 skipped by design); Lighthouse accessibility, best practices and
SEO are 100 on the audited pages (`/search` is `noindex` on purpose).

End-to-end environment variables: `E2E_BASE_URL` (default
`http://localhost:3000`), `E2E_API_URL`, `E2E_EMAIL` / `E2E_PASSWORD` (a demo
account), `E2E_SW=1` to include service-worker tests (production build),
`E2E_NO_SANDBOX=1` where Chromium's sandbox is unavailable (containers, WSL).

CI: `ci.yml` (lint, types, unit + coverage, build) on every push and PR;
`preview-checks.yml` runs Playwright and Lighthouse against each Vercel
preview.

## Deployment

Vercel. Environment: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `REVALIDATE_SECRET` (same value as the API's),
optional `NEXT_PUBLIC_SITE_URL` (canonical domain for metadata and the
sitemap).
