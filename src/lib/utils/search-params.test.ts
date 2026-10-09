import { describe, expect, it } from "vitest";

import { enumParam, hrefWith, pageParam, param } from "./search-params";

describe("search param helpers", () => {
  it("reads the first trimmed value", () => {
    expect(param({ q: ["  onic ", "x"] }, "q")).toBe("onic");
    expect(param({ q: "   " }, "q")).toBeUndefined();
  });

  it.each([
    [{}, 1],
    [{ page: "3" }, 3],
    [{ page: "0" }, 1],
    [{ page: "-4" }, 1],
    [{ page: "abc" }, 1],
    [{ page: "9999" }, 500],
  ])("parses page from %p", (params, expected) => {
    expect(pageParam(params)).toBe(expected);
  });

  it("accepts only whitelisted enum values", () => {
    const statuses = ["live", "completed"] as const;
    expect(enumParam({ status: "live" }, "status", statuses)).toBe("live");
    expect(enumParam({ status: "<script>" }, "status", statuses)).toBeUndefined();
  });

  it("patches, removes and sorts params", () => {
    expect(hrefWith("/matches", { status: "live", page: "2" }, { page: null })).toBe(
      "/matches?status=live",
    );
    expect(hrefWith("/matches", { status: "live" }, { page: 3, a: "1" })).toBe(
      "/matches?a=1&page=3&status=live",
    );
    expect(hrefWith("/matches", {}, {})).toBe("/matches");
  });
});
