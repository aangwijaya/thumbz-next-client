import { describe, expect, it } from "vitest";

import { formatViewerCount } from "./format";

describe("formatViewerCount", () => {
  it("keeps small counts exact", () => {
    expect(formatViewerCount(0)).toBe("0");
    expect(formatViewerCount(999)).toBe("999");
    expect(formatViewerCount(1500)).toBe("1.5K");
  });

  it("promotes a rounded 1000 of a unit to the next one", () => {
    expect(formatViewerCount(999_950)).toBe("1M");
    expect(formatViewerCount(999_960_000)).toBe("1B");
  });

  it("formats millions and billions instead of overflowing the M tier", () => {
    expect(formatViewerCount(1_500_000)).toBe("1.5M");
    expect(formatViewerCount(2_124_941_471)).toBe("2.1B");
    expect(formatViewerCount(6_406_300_000)).toBe("6.4B");
    expect(formatViewerCount(1_200_000_000_000)).toBe("1.2T");
  });

  it("falls back safely for unreadable values", () => {
    expect(formatViewerCount(Number.NaN)).toBe("0");
    expect(formatViewerCount(-10)).toBe("0");
  });
});
