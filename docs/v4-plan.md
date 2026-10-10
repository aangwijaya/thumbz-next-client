# v4: league switcher, MPL Indonesia and bolder pages

Status: **mock approved 2026-10-11; build in progress** (see Progress). This file holds everything needed to
pick the work up later: the request, the decisions, the mock, and the
implementation units.

- Mock (Design canvas, private to the owner): https://claude.ai/artifact/DLeg2R9BRcYFztLu3BZvUo
- Mock source snapshot: [`design/mock-v4/`](../design/mock-v4/). Each artboard
  is a `.dc.html` file that links `thumbz.css`; phone artboards import the
  desktop ones with `phone="yes"`. `/_blob/...` images (logo, app icon) only
  resolve inside the canvas.
- Data notes (what each new element reads from the API): `design/mock-v4/Notes.dc.html`.

## The request (2026-10-10)

1. Something outstanding in the UI. Keep the Home hero player and the gold
   tracker (Match center) as they are; the other Home sections and the Matches
   pages feel too basic. Mock first, no code until the mock is approved.
2. Only MPL PH S18 is shown. Add tabs/dropdown/menu listing tournaments (MPL
   Indonesia, M8, MSC…); for now only MPL PH and MPL Indonesia. MPL ID data
   comes from our DB; dummy matches are fine, e.g. a copy of MPL PH with team
   and roster names changed.

Review notes on the first mock, all applied in the canvas:

1. Use variant A (league bar), but not the `[code · title · live]` layout: it
   takes too much space. Add title-only dummy tabs "M8 Tournament" and
   "EWC 2027" to show the bar with many tournaments.
2. Improve the match page Live stats and especially the Item sequence.
3. Install the app must also show on mobile browsers, not only desktop.

## Decisions

- **MPL ID lives in the backend DB via the seed.** Teams, rosters and logos
  from the old seed (`git -C ../thumbz-server show 901e949^:prisma/seed.ts`).
  Matches are a copy of PH week 8 with teams mapped
  ONIC→ONIC Esports, APBR→RRQ Hoshi, FLCN→EVOS Legends, OMG→Bigetron,
  TLPH→Team Liquid ID, RORA→Alter Ego, TNC→Dewa United, TWIS→Geek Fam ID
  (NAVI dropped; old rosters have no roam, so 8 roam names are needed).
- **API contract change approved:** `GET /home?tournament_id=<uuid>` (optional)
  scopes `featured_live_match`, `live_now`, `upcoming`, `latest_videos`,
  `popular_teams`. `featured_tournaments` and `continue_watching` stay global.
  Unknown id → empty sections; malformed → 400. Home stays one call (§11.5).
- **Switcher = league bar (variant A):** one 44px row of text tabs under the
  header, live count as a red dot + number, scrolls sideways when there are
  many tournaments, "All tournaments →" on the right; `/matches` adds "All"
  first. Data from `GET /tournaments`, no names in code. URL
  `?tournament=<uuid>`; default = first featured ongoing tournament.
- **Visual direction:** stay in `design/design.md` (paper, ink, one ember
  accent); spread the hero/gold-tracker language (scorebug, split-fill ink
  charts, team colours) to one signature visual per section.

## What the mock contains

- **Home:** league bar · hero and Match center unchanged (copy names the
  league) · Live now as multiview tiles · Schedule as a rundown timeline with a
  "now" needle · Standings as "race to the playoffs" (stage tracker, win-rate
  bars, last five, playoff line) · Teams as a team wall · Replays as a shelf ·
  mobile install (header pill, bottom card, iPhone steps sheet, drawer row).
- **Matches:** league bar with "All" · status segmented control with counts ·
  week strip · series rows (team colours, per-game pips with lengths,
  countdown + reminder bell, watch replay).
- **Tournaments + league page:** league cards (stage tracker, top three);
  league header with stage tracker; Standings/Teams tabs.
- **Match page:** series strip (winner, length, mini gold chart per game) ·
  live stats as a scoreboard band + lane-by-lane rows (KDA, gold, level,
  damage, items, gold-difference bar) · item sequence as a power-spike board
  (finished items vs components on the game clock, objective lines, "first
  core item" per lane, full build order for a picked player); on phones a
  lane-vs-lane race list.

## Answers (2026-10-11)

- Series/game pips: a `games` field on `MatchSummary` may be proposed, but
  dummy data in the frontend is fine for now.
- Short tab labels: made in the frontend (`tournamentLabel()` in
  `src/lib/api/tournaments.ts`), no database field.
- Playoff line and "week N of M": a per-league constant; dummy values are fine.
- MPL ID roam players: RRQ Said, TLID lyoni, Alter Ego ALEXANDER, BTR Finn,
  EVOS Muezza, ONIC Kiboy, NAVI Aprho, Dewa Shane, Geek Frenzy. NAVI is seeded
  as a team without matches this week.

## Progress

| Unit | Where | Commit | Checked |
| --- | --- | --- | --- |
| B1 + B4 `/home?tournament_id` (contract, DTO, scoped queries, tests, OpenAPI) | thumbz-server `v4` | `fb69173` | typecheck, lint; DB tests pending (local Postgres was down) |
| B2 + B3 seed: `seedLeague()` + MPL ID from the PH week | thumbz-server `v4` | `0146322` | typecheck, lint, dry run up to the first query; reseed pending |
| F1–F6 league bar, tournament plumbing, links, copy, Teams tab fix | this repo `v4` | `5479b1f` | typecheck, lint, vitest |
| F7 install the app on phones | this repo `v4` | `da503d4` | typecheck, lint, vitest |
| F8+ mock sections | — | — | needs the local stack running for screenshots |

## Implementation units (after approval)

Environment: the backend `.env` points at remote Supabase; always seed with the
local URL from `.env.test`, never `SEED_REMOTE`. Ask before reseeding (wipes
local favorites/history/orders) and before restarting the user's API on :3001.
`:3000` is the user's `next start` on `.build` — never run `npm run build`;
check with `NEXT_DIST_DIR=.next-v4 npx next dev -p 3002`, then delete that dir
and revert `tsconfig.json`.

Backend (`thumbz-server`):

1. **B1 contract:** document `tournament_id` on `GET /home` (§6.6); copy to
   `../docs/API-CONTRACT.md`.
2. **B2 seed refactor, no behaviour change:** move the league part of
   `prisma/seed.ts` into `seedLeague(league, catalog)` with a `PH` config;
   baseline API dump identical before/after.
3. **B3 MPL ID:** `ID_TEAMS`, `indonesiaFrom(ph)` (swap codes, winners, sides,
   nicknames by role; `data_slug` prefix `id-`); slug-collision and role checks
   before the wipe; slug `mpl-id-s18`, featured, `startDay -57`, `shiftMs -60min`,
   other live offsets, broadcasts `id` + `en`, venue Jakarta.
4. **B4 `/home?tournament_id`:** query DTO, scoped queries, unit + e2e tests,
   `npm run openapi:export`.

Frontend (this repo), one unit at a time:

1. **F1** `npm run gen:api`; `current_stage` on `TournamentSummary`.
2. **F2** `src/lib/api/tournaments.ts` (`getTournaments`, `pickTournament`);
   `getHome(token, tournamentId?)`; Home and `@banner` read `?tournament=`.
3. **F3** league bar component; on Home and `/matches` (replaces the tournament
   FilterChips).
4. **F4** Home links carry `?tournament=`.
5. **F5** copy: hero lead names the league; footer and search placeholder
   generic.
6. **F6** league Teams tab uses `/teams?tournament_id=` (`/tournaments/:id/teams`
   is not implemented).
7. **F7** install app on mobile: header pill, bottom card (dismiss remembered),
   drawer row; iOS steps also for Chrome on iOS.
8. **F8+** the mock, one section per unit: Live now → Schedule → Standings →
   Teams → Replays → `/matches` → `/tournaments` → match page (series strip,
   live stats, item sequence). Reuse `GoldLeadChart`, the hero scorebug,
   `Rail`, `FeatureRow`, `Spoiler`, `LocalTime`, `team-colors.ts`,
   `inventoryOf`/`timelineOf` in `src/lib/utils/builds.ts`.

Validate each unit: `npm run typecheck && npm run lint && npm test`, plus
screenshots at 1440 and 390 against the mock.
