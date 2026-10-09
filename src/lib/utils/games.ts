import type { MatchDetail, MatchSummary } from "@/lib/api/types";

type SeriesMatch = Pick<MatchSummary, "team_a" | "team_b" | "score_a" | "score_b"> & Pick<MatchDetail, "games">;

/**
 * Who won each finished game of the series, in order (contract §19).
 * Matches recorded before games were tracked only have a score: their
 * finished games are known to exist but not who won which.
 */
export function seriesWinners(match: SeriesMatch | null | undefined): Array<"a" | "b" | null> {
  const games = match?.games ?? [];
  if (games.length === 0) {
    const played = (match?.score_a ?? 0) + (match?.score_b ?? 0);
    return Array.from({ length: played }, () => null);
  }
  return games
    .filter((game) => game?.status === "completed")
    .sort((x, y) => x.game_number - y.game_number)
    .map((game) =>
      game.winner_team_id === match?.team_a?.id ? "a" : game.winner_team_id === match?.team_b?.id ? "b" : null,
    );
}
