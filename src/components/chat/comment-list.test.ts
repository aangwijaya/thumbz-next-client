import { describe, expect, it } from "vitest";

import type { MatchComment } from "@/lib/api/types";

import { appendOlder, MAX_COMMENTS, mergeNewer } from "./comment-list";

const c = (id: string): MatchComment =>
  ({ id, match_id: "m", user_id: "u", author_name: "A", body: id, created_at: "2026-01-01T00:00:00Z" }) as MatchComment;

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
