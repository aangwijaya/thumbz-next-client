import { describe, expect, it } from "vitest";

import { DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR, teamColors, tint } from "./team-colors";

describe("teamColors", () => {
  it("uses each team's primary color", () => {
    expect(
      teamColors({ team_a: { color_primary: "#111111" }, team_b: { color_primary: "#222222" } }),
    ).toEqual(["#111111", "#222222"]);
  });

  it("falls back per side when a color is missing or empty", () => {
    expect(teamColors({ team_a: { color_primary: "" }, team_b: null })).toEqual([
      DEFAULT_TEAM_A_COLOR,
      DEFAULT_TEAM_B_COLOR,
    ]);
    expect(teamColors(undefined)).toEqual([DEFAULT_TEAM_A_COLOR, DEFAULT_TEAM_B_COLOR]);
  });
});

describe("tint", () => {
  it("mixes the color into paper", () => {
    expect(tint("#123456", 22)).toBe("color-mix(in oklab, #123456 22%, var(--color-paper))");
  });
});
