import { describe, expect, it } from "vitest";

import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  it.each([
    ["/", "/"],
    ["/matches?status=live", "/matches?status=live"],
    ["/matches/abc#chat", "/matches/abc#chat"],
  ])("keeps same-origin path %s", (raw, expected) => {
    expect(safeNextPath(raw)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "",
    "https://evil.example",
    "//evil.example/path",
    "/\\evil.example",
    "javascript:alert(1)",
    "matches",
  ])("falls back for unsafe value %p", (raw) => {
    expect(safeNextPath(raw)).toBe("/");
  });

  it("uses the provided fallback", () => {
    expect(safeNextPath("//evil.example", "/login")).toBe("/login");
  });
});
