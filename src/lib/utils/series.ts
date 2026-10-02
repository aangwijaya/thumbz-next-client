import type { MatchSummary } from "@/lib/api/types";

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
