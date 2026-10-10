import type { MatchGame, MatchSummary } from "@/lib/api/types";

export type SeriesState = "just-started" | "match-point" | "decider" | null;

export interface SeriesInfo {
  /** Current game: game_number when the backend sets it, else games played + 1. */
  game: number;
  state: SeriesState;
  /** The team one win away from taking the series (state "match-point" only). */
  pointSide: "a" | "b" | null;
}

// score_a / score_b are the series score (games won), as in the contract's
// MatchSummary example (best_of 3, score 2–1). Null until the backend sets them.
export function seriesInfo(match?: MatchSummary | null): SeriesInfo | null {
  const scoreA = match?.score_a;
  const scoreB = match?.score_b;
  if (scoreA == null || scoreB == null) return null;

  const bestOf = match?.best_of ?? 1;
  const game = match?.game_number ?? scoreA + scoreB + 1;
  const oneWinAway = Math.ceil(bestOf / 2) - 1;
  const aOnPoint = bestOf >= 3 && scoreA === oneWinAway;
  const bOnPoint = bestOf >= 3 && scoreB === oneWinAway;

  if (aOnPoint && bOnPoint) return { game, state: "decider", pointSide: null };
  if (aOnPoint) return { game, state: "match-point", pointSide: "a" };
  if (bOnPoint) return { game, state: "match-point", pointSide: "b" };
  if (scoreA + scoreB === 0) return { game, state: "just-started", pointSide: null };
  return { game, state: null, pointSide: null };
}

export type GameSlot = "a" | "b" | "live" | "next";

/**
 * One slot per game of the series: who won it, the game being played, or
 * not played yet. Uses `games` when the payload has them (match detail);
 * list payloads only carry the series score, so the order of the won games
 * there is a stand-in (alternating, the leader taking the last ones) until
 * the API lists games on MatchSummary.
 */
export function gameSlots(match?: (MatchSummary & { games?: MatchGame[] }) | null): GameSlot[] {
  const bestOf = Math.max(1, match?.best_of ?? 1);
  const slots: GameSlot[] = [];
  const games = [...(match?.games ?? [])].sort((x, y) => x.game_number - y.game_number);
  if (games.length > 0) {
    for (const game of games) {
      if (game?.status === "live") slots.push("live");
      else if (game?.winner_team_id && game.winner_team_id === match?.team_a?.id) slots.push("a");
      else if (game?.winner_team_id && game.winner_team_id === match?.team_b?.id) slots.push("b");
    }
  } else {
    const a = match?.score_a ?? 0;
    const b = match?.score_b ?? 0;
    for (let i = 0; i < Math.min(a, b); i++) slots.push("a", "b");
    for (let i = 0; i < Math.abs(a - b); i++) slots.push(a > b ? "a" : "b");
    if (match?.status === "live") slots.push("live");
  }
  while (slots.length < bestOf) slots.push("next");
  return slots.slice(0, bestOf);
}
