import { describe, expect, it } from "vitest";

import type { MatchComment } from "@/lib/api/types";

import { appendOlder, MAX_COMMENTS, mergeNewer, visibleComments } from "./comment-list";

const c = (id: string, createdAt = "2026-01-01T00:00:00Z"): MatchComment =>
  ({ id, match_id: "m", user_id: "u", author_name: "A", body: id, created_at: createdAt }) as MatchComment;

describe("comment list merging", () => {
  it("prepends only unseen newer comments", () => {
    expect(mergeNewer([c("3"), c("2")], [c("2"), c("1")]).map((x) => x.id)).toEqual(["3", "2", "1"]);
  });

  it("keeps the same array when nothing is new (no re-render)", () => {
    const previous = [c("1")];
    expect(mergeNewer([c("1")], previous)).toBe(previous);
  });

  it("appends older comments at the end without duplicates", () => {
    expect(appendOlder([c("2"), c("1")], [c("3"), c("2")]).map((x) => x.id)).toEqual(["3", "2", "1"]);
  });

  it("caps memory for newest-first merges", () => {
    const many = Array.from({ length: MAX_COMMENTS + 10 }, (_, i) => c(String(i)));
    expect(mergeNewer(many, [])).toHaveLength(MAX_COMMENTS);
  });
});

describe("visibleComments (stream delay)", () => {
  const now = Date.parse("2026-01-01T00:01:00Z");
  const cutoff = now - 30_000;

  it("hides other people's comments that are still inside the delay", () => {
    const shown = visibleComments(
      [c("fresh", "2026-01-01T00:00:45Z"), c("old", "2026-01-01T00:00:20Z")],
      cutoff,
    );
    expect(shown.map((comment) => comment.id)).toEqual(["old"]);
  });

  it("always shows the visitor's own comment", () => {
    const own = c("mine", "2026-01-01T00:00:55Z");
    const shown = visibleComments([own], cutoff, new Set([own.id]));
    expect(shown.map((comment) => comment.id)).toEqual(["mine"]);
  });

  it("hides comments with an unreadable timestamp", () => {
    const shown = visibleComments([c("bad", "not-a-date")], cutoff);
    expect(shown).toEqual([]);
  });
});
