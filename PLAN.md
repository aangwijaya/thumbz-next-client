# THUMBZ Client Implementation Plan (thumbz-next-client)

> **Next.js frontend for THUMBZ. This plan is the primary execution guide for the client implementation agent.**
>
> Authoritative inputs:
> 1. `design/design.md` — the authoritative visual/UX specification (dark-first, editorial + technical + streaming).
> 2. `design/references/steep.md`, `design/references/monad.md` — reference material only; THUMBZ rules always win (design.md §1).
> 3. `../thumbz-server/docs/API-CONTRACT.md` — the API the client MUST consume.

---

## 1. Executive summary

Build a Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 frontend for THUMBZ: a premium, dark-first Mobile Legends esports streaming/content platform. The client is responsible for UI/UX only — all business logic, validation and persistence live in the NestJS backend. The app is primarily anonymous/read-oriented (browse, discover, watch, explore stats) with light authenticated features (profile, favorites for teams/players, watch history) via Supabase Auth. The three visual languages (editorial/technical/streaming) are implemented as one coherent design system, not three.

## 2. Current architecture

- Repository contains only: `README.md` (one line), `design/design.md` (authoritative spec), `design/references/steep.md`, `design/references/monad.md`.
- No `package.json`, no source, no `AGENTS.md`, no tests.

Greenfield. Nothing to reuse; nothing to rewrite.

## 3. Target architecture

```text
Browser
   │
   ├── Supabase Auth (session cookies, @supabase/ssr)
   │
   └── NestJS API (/api/v1, JSON)   ── base URL: NEXT_PUBLIC_API_URL
         │
         └── data rendered via Server Components, hydrated with TanStack Query
```

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15, App Router, React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (`@theme` design tokens in `globals.css`) |
| Data fetching | Server Components for first paint + TanStack Query for client hydration/refresh (live polling) |
| Auth | `@supabase/ssr` (cookie sessions, middleware refresh); access token attached to `/me/*` API calls |
| Video | Shaka Player behind a THUMBZ `VideoPlayer` component (native `<video>` fallback for unsupported env) |
| Validation | None client-side beyond forms-free UX — API responses consumed defensively with optional chaining; backend validates all input |
| Tests | Vitest + React Testing Library; Playwright for E2E |

No state-management library beyond TanStack Query + URL state. No shadcn dependency (design.md §28 forbids default shadcn styling; primitives are built in-house and small).

## 4. Design system strategy

One design system, three visual languages, dark-first. Implement as CSS custom properties (Tailwind v4 `@theme`) + a small set of primitive components.

### 4.1 Tokens (`app/globals.css` `@theme`)

From design.md §13 (starting points, refine during implementation):

```css
@theme {
  --color-background: #0A0A0A;
  --color-surface: #111111;
  --color-surface-elevated: #181818;
  --color-text-primary: #F5F5F5;
  --color-text-secondary: #A1A1AA;
  --color-border: #27272A;

  --color-live: #E5484D;        /* restrained warm red */
  --color-success: #30A46C;
  --color-warning: #F5A623;
  --color-error: #E5484D;       /* or distinct hue if contrast demands */

  --font-display: var(--font-source-serif-4), ui-serif, Georgia, serif;
  --font-body: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-ibm-plex-mono), ui-monospace, monospace;
}
```

Typography roles (design.md §15):

| Role | Font | Use |
| --- | --- | --- |
| Display | serif (Source Serif 4 via `next/font`; weight 400) | page headlines, featured content, editorial statements |
| Body | sans (Inter) | descriptions, nav, buttons, UI |
| Technical | mono (IBM Plex Mono) | timestamps, scores, metadata, statistics |

Font selection follows design.md §15: chosen for availability/performance/licensing (all Google-fonts-based `next/font` packages, self-hosted, zero layout shift). Serif is never bold — the weight-400 whisper is the signature (Steep/Monad principle, adapted).

Spacing: 4px base scale. Cards: restrained borders (`--color-border`), minimal shadows, meaningful hover states, varied compositions per entity (design.md §17 — match cards ≠ team cards). Team `color_primary`/`color_secondary` used only for subtle accents/identity; never override the system palette (design.md §14).

Semantic states: LIVE = red dot + `LIVE` mono label (design.md §20); success/warning/error restrained; no neon, no flashing.

### 4.2 Steep reference usage (Editorial)

Applied principles (not copied):
- Strong typographic hierarchy; oversized weight-400 serif headlines with tight negative tracking at large sizes.
- Generous whitespace between major sections (editorial rhythm); editorial areas breathe.
- Varied card compositions; large visual blocks; asymmetric section layouts where appropriate.
- Single accent per context — restraint.
- Pill-shaped CTAs.

Rejected (conflicts with THUMBZ): Steep's light paper palette, peach accent, floating-artifact collage hero, 24px-everywhere radius (THUMBZ uses restrained radii tuned per component on dark surfaces).

### 4.3 Monad reference usage (Technical)

Applied principles (not copied):
- Precise alignment, compact metadata, hairline borders.
- Mono type for numbers/labels/timestamps (selectively — never body copy).
- Numerical hierarchy: big figure, small unit, clear alignment.
- Restrained data visualization (§4.8): simple, contextual charts only.

Rejected: Monad's parchment canvas, all-mono UI strings, uppercase mono navigation, 40px card radii, colored atmospheric washes.

### 4.4 Streaming language (THUMBZ-original)

Dark surfaces, cinematic media areas, strong contrast, clear LIVE state, minimal chrome around the player. The `VideoPlayer` is designed in-house (design.md §19) — never styled after Steep/Monad.

### 4.5 Page composition mapping (design.md §5–11, §29)

| Page | Priority 1 | Priority 2 | Priority 3 |
| --- | --- | --- | --- |
| Home | Editorial | Streaming | Technical |
| Live | Streaming | Editorial | Technical |
| Match detail | Streaming | Technical | Editorial |
| Tournaments | Editorial | Technical | Streaming |
| Teams | Editorial | Technical | Streaming |
| Players | Technical | Editorial | Streaming (only when playable content exists) |
| Search | Technical/Editorial balanced | Streaming | — |

### 4.6 Do-not list (design.md §28)

No generic SaaS dashboard, no gaming/neon interface, no Twitch/Netflix clone, no default shadcn look, no dense KPI dashboards, no dashboard-sidebar navigation.

## 5. Steep/Monad reference analysis (summary)

- **Steep** informs *hierarchy and editorial composition*: how headlines, sections and hero areas are structured and weighted. Used on: homepage hero/featured, tournament/team/player identity areas, section headers, featured cards.
- **Monad** informs *data presentation*: how scores, stats tables, standings, timestamps and technical metadata are typeset and aligned. Used on: match metadata, statistics tabs, standings, schedules, search result metadata.
- Where they conflict with each other or with THUMBZ (light palettes, radius systems, all-mono body, etc.), THUMBZ design.md rules and this plan's tokens win (design.md §1 precedence).
- They never appear as separate visual systems: every component draws from one token set; the "language" is expressed through composition density and typography role, not separate stylesheets.

## 6. Route/page plan

App Router structure (all under `src/app`):

| Route | Page | Composition | Data (API) | Notes |
| --- | --- | --- | --- | --- |
| `/` | Home | Editorial-led | `GET /home` | Sections: featured live hero, live now, upcoming, featured tournaments, popular teams, latest content, continue watching (auth) |
| `/live` | Live | Streaming-led | `GET /matches/live` (poll 30s) | Grid of live match cards; stream thumbnail + LIVE dominate |
| `/matches` | Matches list | Technical-leaning editorial | `GET /matches` | Filters: status (scheduled/live/completed), tournament; URL-driven |
| `/matches/[id]` | Match detail | Streaming-led | `GET /matches/:id` + `/statistics`, `/roster`, `/history`, `/related`, `/economy`, `/live-stats`, `/equipment`, `/events` | Watch deck (full, §6.1): MatchHeader → desktop 3-col deck (head-to-head · `VideoPlayer` · live rail with economy) → build timeline + events feed → tabs (overview/statistics/roster/history) → related. Tabs synced to `?tab=` |
| `/tournaments` | Tournament list | Editorial+Technical | `GET /tournaments` | Status/region filters |
| `/tournaments/[id]` | Tournament detail | Editorial identity + technical tabs | `/:id`, `/schedule`, `/standings`, `/teams`, `/results`, `/stages` | Tabs synced to `?tab=`. Bracket tab deferred — design.md §8 lists it as optional ("may include"); standings + schedule cover the MVP need |
| `/teams` | Teams list | Editorial+Technical | `GET /teams` | |
| `/teams/[id]` | Team detail | Editorial identity + technical stats | `/:id`, `/matches`, `/statistics`, `/roster` | Hero (logo/colors), form, live/next match, stats, roster |
| `/players` | Players list | Technical-leaning | `GET /players` | team/role filters |
| `/players/[id]` | Player detail | Technical-leaning editorial | `/:id`, `/matches`, `/statistics` | Identity, role, team, stats, per-hero, tournament history |
| `/search` | Search | Balanced | `GET /search?q=&type=` | Fully URL-driven/shareable; type tabs (all/match/team/player/tournament/video) |
| `/login` | Login | Editorial | Supabase Auth UI | Email/password form + link back |
| `/auth/callback` | Auth callback | — | Supabase | `route.ts` exchanging auth code; redirects back |
| `/profile` | Profile (auth) | Editorial | `GET /me` | Username/avatar display (edit = post-MVP) |
| `/favorites` | Favorites (auth) | Editorial cards | `GET /me/favorites` | Team + player favorite cards; remove action |
| `/history` | Watch history (auth) | Streaming+Technical | `GET /me/history` | Match cards with progress; clear-entry action |

Shared files: `layout.tsx` (Header/Footer), `not-found.tsx`, `error.tsx` (route-level), `loading.tsx` per data page.

Nav (design.md §12): THUMBZ logo → Live / Matches / Tournaments / Teams / Players + Search; authenticated users see Profile / Favorites / History. No sidebar; top bar on desktop, condensed nav on mobile.

### 6.1 Match detail — watch-deck composition (full streaming deck)

User-approved composition for `/matches/[id]` (refines design.md §7 for this route; tabs and related below the deck stay per §7). Restored to the full streaming deck after the contract upgrade added `/matches/:id/live-stats`, `/matches/:id/equipment` and `/matches/:id/events` (the trio was previously not servable; see contract §5.1/§6.1):

```text
┌────────────────────────────────────────────────────────────────────┐
│                            MATCH HEADER                            │
├──────────────────┬──────────────────────────────┬──────────────────┤
│ HEAD-TO-HEAD     │                              │ LIVE RAIL        │
│ · per-team       │         VIDEO PLAYER         │ · team gold      │
│   player lines   │                              │   advantage      │
│ · K/D/A · gold   │                              │ · economy chart  │
│ · hero · level   │                              │ · player         │
│ · damage         │                              │   rankings       │
│ (/live-stats)    │                              │ (/live-stats,    │
│                  │                              │  /economy)       │
├──────────────────┴──────────────────────────────┴──────────────────┤
│ BUILD TIMELINE (equipment)      │ EVENTS FEED (kills/objectives)   │
├─────────────────────────────────┴──────────────────────────────────┤
│         TABS: overview / statistics / roster / history (?tab=)     │
├────────────────────────────────────────────────────────────────────┤
│                         RELATED MATCHES                            │
└────────────────────────────────────────────────────────────────────┘
```

| Deck element | Source | Behavior |
| --- | --- | --- |
| `MatchHeader` | `GET /matches/:id` | teams, score, status, tournament, stage, BO, scheduled time |
| Left rail `HeadToHeadPanel` | latest per-player snapshot of `/live-stats`; identity/hero joined from `/statistics` | team-split player lines: nickname, role/hero, K/D/A, gold, damage, level — current values derived client-side from the latest snapshot per player (contract §11.14; never fabricate); falls back to static statistics when no snapshots exist; EmptyState when neither exists |
| Center `VideoPlayer` | `MatchDetail.stream_url` | design.md §19 states; dominates the deck; first element on mobile |
| Right rail `EconomyChart` + `LiveRankings` | `/economy`; latest `/live-stats` snapshot | economy = two hand-rolled SVG gold series (one per team) + derived team-gold advantage; rankings = players sorted gold desc (damage / damage-taken shown) |
| `BuildTimeline` | `/equipment` | item purchases per player over match time (phase grouping, `purchased_at` asc); EmptyState when no purchases yet |
| `EventsFeed` | `/events` | chronological events/objectives feed; while live, new events are appended locally between polls (contract §11.14); server duplicates tolerated (contract §8.14); EmptyState when empty |
| Tabs + Related | `/statistics`, `/roster`, `/history`, `/related` | URL-synced `?tab=`; tabs show full tables/lists, deck shows compact during-watch views |

Live cadence: while the match is live the deck sources (`/live-stats`, `/equipment`, `/events`, `/economy`) are polled every 30 s together (contract §11.6, §11.13–14) and paused in background tabs; a single fetch each once the match is completed. Statistics/roster are never polled (static snapshots). On polling errors keep the last valid data and resume silently — never fabricate points or events.

Responsive: the deck collapses to player-first stacking (video → header info → rails → timeline/events) on tablet/mobile per design.md §24 mobile priorities.

Deviation note: the 3-column deck is a user-approved refinement of design.md §7 for the match route; design.md itself is not rewritten. The earlier "reduced" composition was superseded on 2026-09-02 when the contract gained the live streaming-series endpoints.

## 7. Component plan

Primitives (`src/components/ui/`) — exist only for reuse/consistency:

| Component | Responsibility |
| --- | --- |
| `Button` | Primary (pill, filled), ghost, link-button variants |
| `Link` | Text link with arrow affordance (Steep principle, adapted to dark) |
| `Container` | Page max-width + section rhythm |
| `SectionHeader` | Editorial section title + optional "view all" link |
| `StatusBadge` | Match/tournament status chip (scheduled/live/completed/...) |
| `LiveIndicator` | Red dot + `LIVE` mono label |
| `ScoreDisplay` | Mono score `2 : 1` with team colors |
| `Tabs` | URL-synced tab bar (searchParams-based) |
| `Skeleton` | Reserved-dimension loading blocks (media + text variants) |
| `EmptyState` | Contextual: what is missing, why, what to do next |
| `ErrorState` | User-safe error + recovery actions (retry/back/home) |
| `ViewerCount` | Mono viewer count with icon (only when live) |

Domain components (`src/components/cards/`, `stats/`, `video/`, `layout/`):

| Component | Responsibility | Language |
| --- | --- | --- |
| `MatchCard` | Upcoming/completed match card (teams, score, tournament, time) | Editorial + technical metadata |
| `LiveMatchCard` | Live match card (thumbnail, LIVE, viewers, watch CTA) | Streaming-led |
| `StreamCard` | Stream/replay thumbnail card | Streaming |
| `TeamCard` | Logo, name, region, subtle team-color accent | Editorial |
| `PlayerCard` | Photo, nickname, role, team | Technical-leaning |
| `TournamentCard` | Logo, name, status, dates, region, prize | Editorial |
| `VideoCard` | Thumbnail, title, type badge, duration | Streaming |
| `StatCard` | Single metric (big mono figure + label) | Technical |
| `StatTable` | Aligned stats table (match stats, player stats) | Technical |
| `StandingsTable` | Rank/team/played/wins/win-rate table | Technical |
| `ScheduleList` | Tournament schedule grouped by stage | Technical |
| `RosterList` | Team/player roster rows | Technical |
| `HeadToHeadPanel` | Deck left rail: per-team player lines (nickname, role/hero, K/D/A, gold, damage, level) — current values derived from the latest `/live-stats` snapshot per player, identity/hero joined from `/statistics`; polled while live; static fallback when no snapshots; EmptyState when absent | Technical |
| `EconomyChart` | Deck right-rail gold chart: two hand-rolled SVG series (one per team) + derived team-gold advantage, mono time axis, team-color accents; 30s polling while live; keep last data on reconnect; EmptyState when no snapshots | Technical |
| `LiveRankings` | Deck right rail: all players ranked from the latest `/live-stats` snapshot (gold desc; damage, damage-taken, level shown); polled while live; EmptyState when absent | Technical |
| `BuildTimeline` | Deck strip: item purchases per player over match time from `/equipment` (phase grouping, `purchased_at` asc); polled while live; EmptyState "No build data yet" | Technical |
| `EventsFeed` | Deck strip: chronological events/objectives feed from `/events`; while live appends new events locally between polls; tolerates duplicate rows; EmptyState when empty | Streaming |
| `MatchHeader` | Teams, score, status, tournament, stage, scheduled time | Mixed (header of match page) |
| `VideoPlayer` | Shaka-based player wrapper; poster, LIVE, controls, states | Streaming (THUMBZ-original) |
| `Header` / `Footer` / `MobileNav` | App chrome | Editorial+Streaming |

`VideoPlayer` states (design.md §19): loading, buffering, error, unavailable-stream, live, replay; quality selection + fullscreen + PiP when supported; poster = `thumbnail_url`. The player remains usable without JS decorations (semantic fallback markup).

Components are created only when they provide reuse, meaningful visual responsibility, or domain clarity (design.md §27). No one-off file splitting.

## 8. State management

- **Server state:** TanStack Query. Server Components fetch initial data; Query hydrates and manages refetching, deduplication, and caching client-side. Query keys are derived from endpoint + params (e.g. `['matches', {status}]`).
- **Live freshness:** `refetchInterval: 30_000` on live queries (`/matches/live`, live match detail, `/matches/:id/economy`, `/matches/:id/live-stats`, `/matches/:id/equipment`, `/matches/:id/events` while the match is live, `/home` while a live section is visible); pause via `refetchIntervalInBackground: false`. Streaming-page events/purchases are appended locally between polls and server duplicates tolerated (contract §8.14); polling errors keep the last valid data and resume silently (contract §11.13–14). Match statistics and roster are never polled (static snapshots).
- **URL state:** search, filters, tabs, pagination all live in `searchParams` (shareable, back/forward-safe). Components read/write via router pushes, never local-only state for these.
- **Auth state:** Supabase session via `@supabase/ssr` (server-readable). Client auth state for nav rendering comes from a server component pass-through (no client auth context needed in MVP).
- **Favorites/history:** optimistic updates through Query mutations with rollback on error.
- No Redux/Zustand/Context for data. Keep it boring.

## 9. Authentication

- Supabase Auth (email/password) managed by `@supabase/ssr`:
  - `middleware.ts` refreshes expired sessions (cookie flow).
  - `lib/supabase/server.ts` / `client.ts` helpers for server/client components.
  - `/login` renders the email/password form (Supabase JS, browser).
  - `/auth/callback/route.ts` handles the OAuth/code exchange and redirects.
- The NestJS API is called with the Supabase access token as `Bearer` on `/me/*` requests (server-side fetch attaches it; never exposed in client bundles beyond the session itself).
- Protected routes (`/profile`, `/favorites`, `/history`) server-redirect unauthenticated users to `/login?next=...`.
- Nav shows Profile/Favorites/History only when a session exists (server component).
- Sign-out clears the Supabase session locally (Supabase handles it) and redirects home.
- API `401` responses trigger a session refresh + retry once, then redirect to login (contract §11.4).

## 10. API integration

- `lib/api/client.ts`: thin typed `fetch` wrapper — base URL from `NEXT_PUBLIC_API_URL`, JSON, error normalization to the contract shape (`{ error: { code, message } }`), Bearer attachment, optional `tags`/`revalidate` for server fetches.
- `lib/api/types.ts`: TypeScript types mirroring contract §6 schemas (hand-written, snake_case). Every external property access uses optional chaining (`data?.match?.team_a?.name`), since API/payload shapes are external data.
- `lib/api/endpoints.ts`: endpoint builders + TanStack Query hooks (`useMatches`, `useMatch`, `useHome`, `useSearch`, `useFavorites`, ...). `GoldSnapshot`, `PlayerSnapshot`, `ItemPurchase` and `MatchEvent` types mirror contract §6.1 `/economy`, `/live-stats`, `/equipment`, `/events`; `useMatchEconomy`, `useMatchLiveStats`, `useMatchEquipment`, `useMatchEvents(matchId, { enabled })` poll every 30s while the match is live, keep the last valid data across polling errors, derive current rankings client-side from the latest snapshot, and append events/purchases locally (contract §11.13–14).
- Error mapping (contract §11.4) implemented once in `lib/api/errors.ts`.
- Client validates nothing; it renders defensively and surfaces contract errors through `ErrorState`.
- Never call `/admin/*`; never embed server secrets.

## 11. Error/loading/empty states

- **Loading:** skeletons with reserved media dimensions (stable layout, no jumps — design.md §21); route `loading.tsx` per page; player shows a reserved 16:9 dark surface with poster.
- **Empty:** contextual `EmptyState` per context — e.g. "No live matches right now — here are upcoming matches", "No results for 'onic' — try a different term or type", favorites/history explain what they are and link to Teams/Players (design.md §22).
- **Streaming-deck rails** (`HeadToHeadPanel`, `EconomyChart`, `LiveRankings`, `BuildTimeline`, `EventsFeed`): empty API results are valid states — render contextual `EmptyState` ("No economy data yet", "No statistics for this match yet", "No build data yet", "No events yet"), never an error and never fabricated points/rows. Polling failures keep the last valid data and resume silently (contract §11.13–14); the events feed tolerates duplicate rows. Hard page failures still use `ErrorState`.
- **Error:** `ErrorState` mapped from contract error codes with recovery actions (retry / go back / return home / try another match). Never render raw API bodies, stack traces or technical objects (design.md §23).
- Playback errors get player-specific messaging ("This stream is unavailable") with a link to the match overview.

## 12. Responsive/accessibility strategy

Responsive (design.md §24): desktop → laptop → tablet → mobile, intentional per-breakpoint layouts (not shrunk desktop):
- Match detail: header + player stacked on mobile; stats go from multi-column tables to stacked sections.
- Card grids: 4-col desktop → 2-col tablet → single-column mobile (or horizontal scroll rows where it fits the composition).
- Mobile priorities: Live, Matches, Video, Match info (design.md §24).
- Header condenses to a simple bar + accessible menu on mobile.

Accessibility (design.md §26):
- Semantic HTML everywhere (`<nav>`, `<main>`, `<button>`, `<a>`, tables for tabular stats); no clickable `<div>`s.
- Keyboard navigation + visible focus states on all interactive elements.
- Sufficient contrast (WCAG AA) on the dark palette; LIVE indicated by label + color, never color alone.
- ARIA only where needed: live regions for viewer counts (`aria-live="polite"`), tabs via proper roles, player controls labeled.
- `prefers-reduced-motion` respected: hover/transition/live-pulse animations disabled or minimized (design.md §25).
- Alt text on logos/thumbnails/player photos.

## 13. Performance

- Server Components for initial data (fast first paint, no client waterfalls); Query for hydration.
- Images via `next/image` (external domains allowlisted in config); thumbnails lazy-loaded.
- Fonts self-hosted via `next/font` (zero CLS).
- Route-level code splitting (App Router default); Shaka Player loaded dynamically only on match pages (`next/dynamic`).
- Live polling: 30s, paused in background tabs.
- No excessive client JS; skeleton dimensions prevent layout shift.

## 14. Testing

| Layer | Tool | What |
| --- | --- | --- |
| Unit | Vitest | `lib/api` error mapping, endpoint URL builders, format utils (viewer count formatting `24.8K`, dates) |
| Component | React Testing Library | `MatchCard`, `LiveMatchCard`, `StatusBadge`, `ScoreDisplay`, `EmptyState`, `ErrorState`, `Tabs` URL-sync, `VideoPlayer` states (mock Shaka), `EconomyChart` (two series / empty / label formatting), `HeadToHeadPanel` (rows / empty), `LiveRankings` (rank derivation from latest snapshot / empty), `BuildTimeline` (phase grouping / empty), `EventsFeed` (append + duplicate tolerance / empty) |
| Integration | Vitest + MSW | Query hooks against mocked contract responses (pagination, filters, error shapes) |
| E2E | Playwright | Critical flows: home → live → match detail → watch; home → tournament → standings; search flow (URL shareable); login → favorite a team → favorites page → remove; open match → watch history entry |

Prioritize critical user journeys over coverage percentages.

## 15. File-level changes

Repository: `thumbz-next-client`

| File/directory | Responsibility | Change | Depends on | Reason |
| --- | --- | --- | --- | --- |
| `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest`/`playwright` configs | Project scaffold | Create | — | Greenfield |
| `.env.example`, `.gitignore` | `NEXT_PUBLIC_API_URL`, Supabase public keys | Create | — | Config hygiene |
| `src/app/layout.tsx` | Root layout: fonts, Header/Footer, metadata | Create | tokens | App chrome |
| `src/app/globals.css` | Tailwind v4 `@theme` tokens (§4.1) | Create | design.md §13–16 | Single design system |
| `src/middleware.ts` | Supabase session refresh + protected-route redirects | Create | `@supabase/ssr` | Auth §9 |
| `src/lib/supabase/server.ts`, `client.ts` | Supabase session helpers | Create | env | Auth |
| `src/lib/api/client.ts`, `types.ts`, `endpoints.ts`, `errors.ts` | API layer (§10) | Create | API contract | Single integration point |
| `src/lib/utils/format.ts` | number/date/score formatting | Create | — | Technical language formatting |
| `src/components/ui/*` | primitives (§7) | Create | tokens | Consistency |
| `src/components/cards/*` | Match/LiveMatch/Stream/Team/Player/Tournament/Video cards | Create | primitives + types | Core visual vocabulary |
| `src/components/stats/*` | StatCard/StatTable/StandingsTable/ScheduleList/RosterList/EconomyChart/HeadToHeadPanel/LiveRankings/BuildTimeline/EventsFeed | Create | primitives, `/economy`, `/live-stats`, `/equipment`, `/events`, `/statistics` | Technical/streaming language; watch-deck (§6.1) |
| `src/components/video/VideoPlayer.tsx` | Shaka wrapper + states | Create | match detail data | Core experience (design.md §19) |
| `src/components/layout/*` | Header/Footer/MobileNav | Create | auth state | Nav (design.md §12) |
| `src/app/page.tsx` (+ sections) | Home | Create | `/home` | Primary discovery journey |
| `src/app/live/page.tsx` | Live page | Create | `/matches/live` | Live discovery |
| `src/app/matches/page.tsx`, `matches/[id]/**` | Match list + detail (header, full watch deck §6.1, tabs, related) | Create | match endpoints incl. `/economy`, `/live-stats`, `/equipment`, `/events` | Core THUMBZ experience |
| `src/app/tournaments/**` | Tournament list + detail tabs | Create | tournament endpoints | Standings/schedule/teams/results |
| `src/app/teams/**` | Team list + detail | Create | team endpoints | Team identity + stats + roster |
| `src/app/players/**` | Player list + detail | Create | player endpoints | Player identity + stats |
| `src/app/search/page.tsx` | Search (URL-driven) | Create | `/search` | Shareable search |
| `src/app/login/page.tsx`, `auth/callback/route.ts` | Login + callback | Create | Supabase Auth | Auth |
| `src/app/profile/`, `favorites/`, `history/` | Authenticated pages | Create | `/me/*` | Design.md §12 nav |
| `src/app/not-found.tsx`, `error.tsx`, `loading.tsx` | Route states | Create | §11 | State handling |
| `src/**/*.test.ts(x)`, `e2e/*` | Tests | Create | §14 | Quality gate |
| `README.md` | Setup/dev docs | Rewrite | — | Replace one-liner |

## 16. Implementation phases

**Phase 1 — Foundation:** scaffold Next.js, tokens in `globals.css`, fonts, root layout + Header/Footer, API client + types + error mapping, Supabase helpers + middleware.

**Phase 2 — Design system primitives:** `ui/*` components, `SectionHeader`, `StatusBadge`, `LiveIndicator`, skeletons, `EmptyState`/`ErrorState`, card component family with per-entity compositions.

**Phase 3 — Core pages (anonymous):** Home (via `/home`), Live (polling), Matches list, Match detail (header + full watch deck §6.1: head-to-head · `VideoPlayer` · live rail (economy + rankings) · build timeline · events feed, tabs, related), Tournaments list/detail (schedule/standings/teams/results), Teams list/detail, Players list/detail, Search. — Largest phase; may split across parallel agents once the card/system layer is stable. Note: streaming-deck rails render `EmptyState` until the backend provides live data (backend ships economy + live-series snapshots at its Phase 4/5 boundary; frontend must not block on it or fabricate data).

**Phase 4 — Auth + user features:** login/callback, protected routes, nav auth state, favorites (add/remove/list), watch history recording + page, profile.

**Phase 5 — Polish:** loading/empty/error states everywhere, responsive pass (mobile priorities), reduced-motion, a11y audit.

**Phase 6 — Validation:** component/E2E tests, design compliance review against design.md (composition percentages, do-not list), performance pass (Lighthouse), integration with live backend (contract conformance).

Phases 3 and 4 can run in parallel with the backend phases 3/4 once the API contract is frozen; the API layer (`lib/api`) is the only coupling point.

## 17. Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Shaka Player complexity (DRM/quirks) | Player bugs | Native `<video>` fallback; player states isolated in one component; e2e covers player |
| Live freshness without realtime | ≤30s stale viewer counts | Accepted product decision; polling + background-tab pause |
| Dark editorial design drifts toward "generic dark dashboard" | Design non-compliance | Phase 6 design compliance review; tokens fixed in Phase 1 |
| Team colors misused (override system) | Incoherent UI | Only via `TeamCard`/accents; compliance review |
| Font licensing/perf | Display serif choice | Self-hosted `next/font` (Source Serif 4); fallback stacks per design.md §15 |
| Backend contract drift | Broken pages | `lib/api/types.ts` mirrors contract; e2e against real backend; contract changes update both repos |
| JSONB `details` fields malformed/absent | Crashes | Optional chaining everywhere on API data (mandatory rule) |

## 18. Definition of done

- [ ] App boots; all §6 routes render with correct data from `docs/API-CONTRACT.md` endpoints.
- [ ] One design system: tokens in `globals.css`, no ad-hoc colors/spacing outside the scale.
- [ ] Page compositions match design.md §5–11 priorities (editorial/technical/streaming percentages respected).
- [ ] `VideoPlayer` handles live/replay/loading/error/unavailable states.
- [ ] LIVE state, viewer counts, and polling behave per contract §11 (30s, background pause).
- [ ] Search/filters/tabs are URL-driven and shareable.
- [ ] Auth: login → favorites add/remove → watch history recorded → protected routes redirect correctly.
- [ ] Loading skeletons (no layout jump), contextual empty states, user-safe error states with recovery actions on every data page.
- [ ] Responsive: desktop/tablet/mobile intentional layouts; mobile priorities (Live/Matches/Video/Match info) reachable quickly.
- [ ] Accessibility: semantic HTML, keyboard nav, focus states, AA contrast, reduced-motion respected.
- [ ] Tests: unit/component/integration green; Playwright critical flows green.
- [ ] No Steep/Monad wholesale copying; no Twitch/Netflix/dashboard clone aesthetics.
- [ ] README documents setup, env vars, and test commands.
- [ ] No business logic implemented in the client; no `/admin/*` calls; no server secrets in client code.
