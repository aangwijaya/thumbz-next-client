import { describe, expect, it } from "vitest";

import type { MatchSummary } from "@/lib/api/types";

import { formByTeam } from "./RaceLadder";

const result = (a: string, b: string, winner: string) =>
  ({ team_a: { id: a }, team_b: { id: b }, winner_team_id: winner }) as unknown as MatchSummary;

describe("formByTeam", () => {
  it("lists each team's last results oldest first, from a newest-first list", () => {
    const form = formByTeam([result("A", "B", "A"), result("B", "C", "C"), result("A", "C", "C")]);
    expect(form.A).toEqual(["L", "W"]);
    expect(form.B).toEqual(["L", "L"]);
    expect(form.C).toEqual(["W", "W"]);
  });

  it("keeps only the latest N and skips matches without a winner", () => {
    const list = [result("A", "B", "A"), result("A", "B", "B"), result("A", "B", ""), result("A", "B", "A")];
    expect(formByTeam(list, 2).A).toEqual(["L", "W"]);
  });
});
