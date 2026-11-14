import { describe, expect, it } from "vitest";

import type { MatchSummary } from "@/lib/api/types";

import { buildRundown, dayTitle } from "./schedule-rundown";

const TZ = "Asia/Jakarta";

function match(overrides: Partial<MatchSummary> & { id: string }): MatchSummary {
  return {
    tournament_id: null,
    tournament: null,
    stage: null,
    round: 1,
    group_name: null,
    best_of: 3,
    game_number: null,
    team_a: { id: "a", name: "Team A" } as MatchSummary["team_a"],
    team_b: { id: "b", name: "Team B" } as MatchSummary["team_b"],
    score_a: null,
    score_b: null,
    winner_team_id: null,
    status: "scheduled",
    scheduled_at: "",
    started_at: null,
    ended_at: null,
    thumbnail_url: null,
    viewer_count: 0,
    featured: false,
    ...overrides,
  };
}

const liveMatch = (id: string, startedAt: string) =>
  match({ id, status: "live", started_at: startedAt, scheduled_at: startedAt });

const scheduledMatch = (id: string, at: string) =>
  match({ id, status: "scheduled", scheduled_at: at });

// 01:59 WIB on 14 Nov 2026 = 18:59Z on 13 Nov.
const EARLY_MORNING = Date.parse("2026-11-13T18:59:00Z");

describe("buildRundown", () => {
  it("drops stale live rows instead of stretching a past day to now", () => {
    const rundown = buildRundown(
      [liveMatch("stale", "2026-10-10T17:08:51Z")],
      [scheduledMatch("a", "2026-11-14T08:00:00Z"), scheduledMatch("b", "2026-11-14T10:30:00Z")],
      EARLY_MORNING,
      TZ,
    );

    expect(rundown.days).toHaveLength(1);
    expect(rundown.days[0]?.key).toBe("2026-11-14");
    expect(rundown.blocks.every((block) => !block.live)).toBe(true);
    expect(rundown.ticks.length).toBeLessThanOrEqual(6);
    // The first match is 13 hours away, so "now" is not on the ruler.
    expect(rundown.needle).toBeNull();
  });

  it("shows today and the next day with a needle inside today", () => {
    // 17:00 WIB on 14 Nov 2026 = 10:00Z; the live series started an hour ago.
    const now = Date.parse("2026-11-14T10:00:00Z");
    const rundown = buildRundown(
      [liveMatch("live", "2026-11-14T09:00:00Z")],
      [scheduledMatch("a", "2026-11-14T12:00:00Z"), scheduledMatch("b", "2026-11-15T08:00:00Z")],
      now,
      TZ,
    );

    expect(rundown.days.map((day) => day.key)).toEqual(["2026-11-14", "2026-11-15"]);
    expect(rundown.needle?.day).toBe(0);
    expect(rundown.needle?.left).toBeGreaterThan(0);
    expect(rundown.needle?.left).toBeLessThan(50);

    const live = rundown.blocks.find((block) => block.live);
    expect(live?.end).toBeGreaterThanOrEqual(now + 30 * 60_000);

    for (const block of rundown.blocks) {
      const day = rundown.days[block.day];
      expect(day).toBeDefined();
      expect(block.start).toBeGreaterThanOrEqual(day!.from);
      expect(block.end).toBeLessThanOrEqual(day!.to);
    }
  });

  it("starts from the next match day when nothing is scheduled today", () => {
    const rundown = buildRundown([], [scheduledMatch("a", "2026-11-15T08:00:00Z")], EARLY_MORNING, TZ);

    expect(rundown.days).toHaveLength(1);
    expect(rundown.days[0]?.key).toBe("2026-11-15");
    expect(dayTitle(rundown.days[0]!.key, TZ, EARLY_MORNING)).toBe("Tomorrow");
    expect(rundown.needle).toBeNull();
  });

  it("ignores a live series that started before midnight in the visitor's zone", () => {
    // 00:30 WIB on 14 Nov; the series started at 23:30 WIB the night before.
    const now = Date.parse("2026-11-13T17:30:00Z");
    const rundown = buildRundown([liveMatch("late", "2026-11-13T16:30:00Z")], [], now, TZ);

    expect(rundown.days).toHaveLength(0);
    expect(rundown.blocks).toHaveLength(0);
    expect(rundown.needle).toBeNull();
  });

  it("filters invalid timestamps and returns an empty rundown", () => {
    const rundown = buildRundown(
      [match({ id: "bad", status: "live", started_at: "not-a-date" })],
      [match({ id: "bad2", scheduled_at: "" })],
      EARLY_MORNING,
      TZ,
    );

    expect(rundown.days).toHaveLength(0);
    expect(rundown.ticks).toHaveLength(0);
  });
});
