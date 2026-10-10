import { describe, expect, it } from "vitest";

import type { MatchSummary } from "@/lib/api/types";

import { gameSlots } from "./series";

const match = (patch: Partial<MatchSummary> & { games?: unknown[] }) =>
  ({
    id: "m",
    best_of: 3,
    status: "live",
    score_a: 0,
    score_b: 0,
    team_a: { id: "A" },
    team_b: { id: "B" },
    ...patch,
  }) as unknown as MatchSummary;

describe("gameSlots", () => {
  it("uses the games of the series when the payload has them", () => {
    expect(
      gameSlots(
        match({
          score_a: 1,
          games: [
            { game_number: 2, status: "live", winner_team_id: null },
            { game_number: 1, status: "completed", winner_team_id: "A" },
          ],
        }) as never,
      ),
    ).toEqual(["a", "live", "next"]);
  });

  it("stands in from the series score on list payloads", () => {
    expect(gameSlots(match({ score_a: 1, score_b: 1 }))).toEqual(["a", "b", "live"]);
    expect(gameSlots(match({ score_a: 0, score_b: 0 }))).toEqual(["live", "next", "next"]);
    expect(gameSlots(match({ status: "completed", score_a: 2, score_b: 1 }))).toEqual(["a", "b", "a"]);
    expect(gameSlots(match({ status: "completed", score_a: 0, score_b: 2 }))).toEqual(["b", "b", "next"]);
  });
});
