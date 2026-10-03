// Placeholder data for the match page while the API cannot provide it yet.
// Used only in development (never in a production build) and only when the
// real endpoint comes back empty. What each piece is waiting for is listed in
// docs/backend-requests-match-page.md.
//
// Team names and past results follow MPL ID (id-mpl.com/schedule); player
// handles, heroes and in-game numbers are made up.
import type {
  BroadcastSummary,
  GoldSnapshot,
  ItemPurchase,
  MatchEvent,
  MatchStatistics,
  MatchSummary,
  PlayerRole,
  PlayerSnapshot,
} from "@/lib/api/types";

export const DUMMY_ENABLED = process.env.NODE_ENV !== "production";

/** The real list, or the placeholder when the real one is empty in development. */
export function orDummy<T>(real: T[] | undefined | null, make: () => T[]): T[] {
  if (real && real.length > 0) return real;
  return DUMMY_ENABLED ? make() : (real ?? []);
}

// The current game started this long ago in every placeholder series.
const GAME_SECONDS = 14.5 * 60;

// Anchored to the current minute so the server and the browser build the same
// placeholder, and ending a minute ago so the stream hold-back never trims it.
function gameStart(): number {
  const minute = Math.floor(Date.now() / 60_000) * 60_000;
  return minute - 60_000 - GAME_SECONDS * 1000;
}

const at = (start: number, seconds: number) => new Date(start + seconds * 1000).toISOString();

const ROLES: PlayerRole[] = ["exp", "jungle", "mid", "gold", "roam"];

const LINEUPS = {
  a: [
    { nickname: "Ardent", hero: "Terizla", k: 2, d: 2, a: 7, gold: 9400, level: 13 },
    { nickname: "Kyou", hero: "Fanny", k: 5, d: 1, a: 4, gold: 11800, level: 14 },
    { nickname: "Vexa", hero: "Valentina", k: 4, d: 3, a: 6, gold: 10200, level: 13 },
    { nickname: "Lumi", hero: "Claude", k: 3, d: 2, a: 5, gold: 12100, level: 14 },
    { nickname: "Rook", hero: "Tigreal", k: 0, d: 3, a: 11, gold: 8800, level: 12 },
  ],
  b: [
    { nickname: "Brizz", hero: "Edith", k: 1, d: 3, a: 5, gold: 9200, level: 12 },
    { nickname: "Nyx", hero: "Ling", k: 4, d: 3, a: 3, gold: 10900, level: 13 },
    { nickname: "Tora", hero: "Pharsa", k: 3, d: 4, a: 5, gold: 9600, level: 13 },
    { nickname: "Kael", hero: "Moskov", k: 3, d: 3, a: 4, gold: 11000, level: 13 },
    { nickname: "Jun", hero: "Hylos", k: 0, d: 1, a: 8, gold: 8400, level: 12 },
  ],
};

const BUILDS: Record<PlayerRole, string[]> = {
  exp: ["Tough Boots", "War Axe", "Dominance Ice", "Oracle"],
  jungle: ["Magic Shoes", "Hunter Strike", "Blade of Despair", "Malefic Roar", "Endless Battle"],
  mid: ["Arcane Boots", "Lightning Truncheon", "Holy Crystal", "Genius Wand"],
  gold: ["Swift Boots", "Demon Hunter Sword", "Windtalker", "Corrosion Scythe", "Golden Staff"],
  roam: ["Tough Boots", "Antique Cuirass", "Immortality"],
  flex: [],
  coach: [],
};

function playerId(side: "a" | "b", index: number) {
  return `dummy-${side}-${index}`;
}

export function dummyStatistics(match: MatchSummary): MatchStatistics {
  const teamOf = (side: "a" | "b") => (side === "a" ? match?.team_a : match?.team_b);
  const players = (["a", "b"] as const).flatMap((side) =>
    LINEUPS[side].map((line, index) => ({
      player_id: playerId(side, index),
      team_id: teamOf(side)?.id ?? side,
      player: {
        id: playerId(side, index),
        slug: line.nickname.toLowerCase(),
        nickname: line.nickname,
        real_name: null,
        role: ROLES[index],
        country: null,
        team_id: teamOf(side)?.id ?? null,
        team: teamOf(side) ?? null,
        photo_url: null,
        is_active: true,
      },
      kills: line.k,
      deaths: line.d,
      assists: line.a,
      gold: line.gold,
      hero_picked: line.hero,
      mvp: false,
      details: {},
    })),
  );
  return { match_id: match?.id ?? "", teams: [], players };
}

export function dummySnapshots(match: MatchSummary): PlayerSnapshot[] {
  const recorded = at(gameStart(), GAME_SECONDS);
  return (["a", "b"] as const).flatMap((side) =>
    LINEUPS[side].map((line, index) => ({
      player_id: playerId(side, index),
      team_id: (side === "a" ? match?.team_a?.id : match?.team_b?.id) ?? side,
      kills: line.k,
      deaths: line.d,
      assists: line.a,
      gold: line.gold,
      damage: 0,
      damage_taken: 0,
      level: line.level,
      recorded_at: recorded,
    })),
  );
}

export function dummyEquipment(match: MatchSummary): ItemPurchase[] {
  const start = gameStart();
  return (["a", "b"] as const).flatMap((side) =>
    ROLES.flatMap((role, index) =>
      BUILDS[role].slice(0, side === "a" ? undefined : -1).map((item, slot) => ({
        player_id: playerId(side, index),
        team_id: (side === "a" ? match?.team_a?.id : match?.team_b?.id) ?? side,
        item_id: item.toLowerCase().replace(/\s+/g, "-"),
        item_name: item,
        phase: slot < 2 ? ("phase2" as const) : ("phase3" as const),
        slot,
        purchased_at: at(start, 60 + slot * 150),
      })),
    ),
  );
}

export function dummyEvents(match: MatchSummary): MatchEvent[] {
  const start = gameStart();
  const a = match?.team_a;
  const b = match?.team_b;
  const event = (id: string, team: typeof a, type: string, title: string, seconds: number) => ({
    id,
    team_id: team?.id ?? null,
    player_id: null,
    event_type: type,
    title,
    details: {},
    occurred_at: at(start, seconds),
  });
  return [
    event("dummy-e1", b, "first_blood", `First blood to ${b?.name ?? "Team B"}`, 245),
    event("dummy-e2", b, "turtle", `${b?.name ?? "Team B"} took the first Turtle`, 440),
    event("dummy-e3", a, "kill", "Kyou triple kill in the jungle", 588),
    event("dummy-e4", a, "tower", `${a?.name ?? "Team A"} destroyed the mid outer tower`, 675),
    event("dummy-e5", b, "turtle", `${b?.name ?? "Team B"} took the second Turtle`, 760),
    event("dummy-e6", a, "lord", `${a?.name ?? "Team A"} secured the Lord`, 842),
  ];
}

export function dummyEconomy(match: MatchSummary): GoldSnapshot[] {
  const start = gameStart();
  const leads = [0, -400, -900, -600, 200, 800, 500, 1100, 1600, 1200, 2000, 2600, 2200, 2900, 3200];
  return leads.flatMap((lead, minute) => {
    const recorded = at(start, minute * 60);
    const base = 2000 + minute * 3300;
    return [
      { team_id: match?.team_a?.id ?? "a", gold: base + lead, recorded_at: recorded },
      { team_id: match?.team_b?.id ?? "b", gold: base, recorded_at: recorded },
    ];
  });
}

export function dummyBroadcasts(match: MatchSummary): BroadcastSummary[] {
  if (match?.status !== "live") return [];
  const total = match?.viewer_count || 163000;
  return [
    { language: "id", stream_url: "", viewer_count: Math.round(total * 0.74) },
    { language: "en", stream_url: "", viewer_count: Math.round(total * 0.26) },
  ];
}

/** Earlier meetings of the two teams, newest first (MPL ID seasons 16 and 17). */
export function dummyHistory(match: MatchSummary): MatchSummary[] {
  const a = match?.team_a;
  const b = match?.team_b;
  const rows: Array<[string, string, "a" | "b", number, number, string]> = [
    ["2026-08-23T10:00:00Z", "regular_season", "a", 2, 1, "MPL Indonesia Season 17"],
    ["2026-04-27T12:00:00Z", "grand_final", "b", 4, 2, "MPL Indonesia Season 16"],
    ["2026-03-15T09:00:00Z", "regular_season", "a", 2, 0, "MPL Indonesia Season 16"],
    ["2025-09-28T12:00:00Z", "playoffs", "b", 3, 1, "MPL Indonesia Season 15"],
    ["2025-08-30T10:00:00Z", "regular_season", "a", 2, 1, "MPL Indonesia Season 15"],
  ];
  return rows.map(([when, stage, winner, high, low, tournament], index) => ({
    ...match,
    id: `dummy-h2h-${index}`,
    tournament: { id: `dummy-t-${index}`, name: tournament, slug: "" },
    stage: stage as MatchSummary["stage"],
    score_a: winner === "a" ? high : low,
    score_b: winner === "a" ? low : high,
    winner_team_id: (winner === "a" ? a?.id : b?.id) ?? null,
    status: "completed",
    scheduled_at: when,
    ended_at: when,
    viewer_count: 0,
    broadcasts: [],
  }));
}

/**
 * Who won each game of the series. The API has no per-game results yet, so in
 * development the order is invented from the series score; in production the
 * finished games show without a winner.
 */
export function gameWinners(match: MatchSummary): Array<"a" | "b" | null> {
  const a = match?.score_a ?? 0;
  const b = match?.score_b ?? 0;
  if (!DUMMY_ENABLED) return Array.from({ length: a + b }, () => null);
  const winners: Array<"a" | "b"> = [];
  let left = { a, b };
  while (left.a + left.b > 0) {
    const next = winners.length % 2 === 0 ? (left.a > 0 ? "a" : "b") : left.b > 0 ? "b" : "a";
    winners.push(next);
    left = { ...left, [next]: left[next] - 1 };
  }
  return winners;
}
