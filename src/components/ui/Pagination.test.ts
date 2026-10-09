import { describe, expect, it } from "vitest";

import { pageSlots } from "./Pagination";

describe("pageSlots", () => {
  it("lists every page when there are few", () => {
    expect(pageSlots(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("collapses distant pages into gaps", () => {
    expect(pageSlots(10, 20)).toEqual([1, "gap", 8, 9, 10, 11, 12, "gap", 20]);
  });

  it("does not emit a gap next to the edges", () => {
    expect(pageSlots(1, 20)).toEqual([1, 2, 3, "gap", 20]);
    expect(pageSlots(20, 20)).toEqual([1, "gap", 18, 19, 20]);
  });
});
