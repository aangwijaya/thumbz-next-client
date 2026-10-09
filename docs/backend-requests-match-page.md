# Backend requests: match page (`/matches/[id]`)

> **Status (2026-10-09):** items 1–4 and 7 are served (API contract §19, plus
> `game_number`/`games` on the realtime `match:update`), and the development
> placeholders (`src/lib/dummy/match.ts`) are deleted. Items 5 (item/hero
> images) and 6 (moment markers on the stream timeline) remain open.

Written by the frontend on 2026-10-03 for the backend agent. The match page was
rebuilt from the approved "THUMBZ Match Page" mockup. Where the API cannot
supply data yet, the page fills it with placeholders from
`src/lib/dummy/match.ts`, **only in development** (`NODE_ENV !== "production"`)
and **only when the real endpoint returns nothing**. A production build never
shows placeholder data: those parts render their empty state instead.

Nothing below changes `docs/API-CONTRACT.md` yet. Each item is a proposal for
the contract owner to approve first.

Already in the contract and used by this page: `stream_delay_seconds` (live data
hold-back) and `TeamSummary.short_name` (scorebug, gold lead, head to head).

## 1. Per-game results of a series (needed, contract change)

**Shown as:** the row of game markers under the series score ("RRQ won game 1,
ONIC game 2, game 4 is live"), and the "Game 4 of 5" label.

**Today:** the API only has the series score (`score_a`, `score_b`) and
`game_number`. In development the page invents an order of winners from the
score; in production finished games show without a winner color.

**Proposal:** add to `MatchDetail` (or a `GET /matches/:id/games` endpoint):

```json
"games": [
  { "game_number": 1, "status": "completed", "winner_team_id": "uuid", "started_at": "...", "ended_at": "...", "duration_seconds": 1180 },
  { "game_number": 4, "status": "live", "winner_team_id": null, "started_at": "...", "ended_at": null, "duration_seconds": null }
]
```

## 2. Which game live data belongs to (needed, contract change)

**Shown as:** "Live stats, Game 4", the gold lead chart and the moments list.

**Today:** `/live-stats`, `/economy`, `/events` and `/equipment` have no game
number, so the page cannot tell the current game's data from earlier games. It
treats everything returned as the current game.

**Proposal:** add `game_number` to `PlayerSnapshot`, `GoldSnapshot`,
`MatchEvent` and `ItemPurchase`, and an optional `game_number` query parameter
on those four endpoints (default: the current or last game).

## 3. Heroes and roles while the match is live (needed)

**Shown as:** each player row in Live stats ("Kyou · Fanny · Lv 14").

**Today:** the hero comes from `/matches/:id/statistics` (`hero_picked`), which
seems to be filled only after the match. `/live-stats` has no hero. The
development placeholder supplies ten players with heroes.

**Proposal:** either fill `/matches/:id/statistics.players` (player, role,
`hero_picked`) as soon as the draft is locked, or add `hero` to
`PlayerSnapshot`.

## 4. Event types as a fixed list (contract clarification)

**Shown as:** the Towers, Turtles and Lords counts in Live stats, and the
small labels in the moments list.

**Today:** `event_type` is free-form, and the page counts `tower`, `turtle` and
`lord` by exact string; it also recognises `first_blood` and `kill`.

**Proposal:** document the allowed values (at least `first_blood`, `kill`,
`tower`, `turtle`, `lord`) and require `team_id` for objectives.

## 5. Item and hero images (nice to have)

**Shown as:** the six build slots per player, and the square hero badge (now
the hero's initials).

**Proposal:** `item_icon_url` on `ItemPurchase`, `hero_icon_url` next to
`hero_picked`.

## 6. Moment markers on the player's timeline (later, contract change)

The mockup puts the key moments on the video's progress bar so viewers can
jump back. This is **not built**: it needs a stream that can be rewound and
the offset between stream time and game time.

**Proposal:** on `MatchDetail`: `stream_dvr: boolean` and
`stream_started_at` (ISO), or per-event `stream_offset_seconds`.

## 7. Seed data for live matches (needed for testing)

In the seed, live matches should have rows for `/statistics`, `/live-stats`,
`/economy`, `/events`, `/equipment`, `/broadcasts` and `/history`, plus real
`stream_url` values for each broadcast language. With those, the development
placeholders stop showing on their own.

## Removing the placeholders

When items 1–3 and 7 are served, delete `src/lib/dummy/match.ts` and the
`orDummy(...)` / `gameWinners(...)` calls in `src/app/matches/[id]/page.tsx`,
`src/components/match/LiveStats.tsx` and `src/components/match/MatchMoments.tsx`.
