import { describe, expect, it } from "vitest";

import type { MatchDetail } from "@/lib/api/types";

import { seriesWinners } from "./games";

const teams = { team_a: { id: "A" }, team_b: { id: "B" } } as Pick<MatchDetail, "team_a" | "team_b">;

describe("seriesWinners", () => {
  it("lists finished games in order and ignores the live one", () => {
    expect(
      seriesWinners({
        ...teams,
        score_a: 1,
        score_b: 1,
        games: [
          { game_number: 3, status: "live", winner_team_id: null },
          { game_number: 2, status: "completed", winner_team_id: "B" },
          { game_number: 1, status: "completed", winner_team_id: "A" },
        ],
      }),
    ).toEqual(["a", "b"]);
  });

  it("falls back to unknown winners for series scored before games were tracked", () => {
    expect(seriesWinners({ ...teams, score_a: 2, score_b: 1 })).toEqual([null, null, null]);
    expect(seriesWinners(null)).toEqual([]);
  });
});
