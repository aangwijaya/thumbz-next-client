import { describe, expect, it } from "vitest";

import { parseVital, routeOf } from "./vitals";

describe("routeOf", () => {
  it("collapses ids so reports group per page type", () => {
    expect(routeOf("/matches/0819638a-f2b8-4bdd-98c7-b078478b1b04")).toBe("/matches/:id");
    expect(routeOf("/videos")).toBe("/videos");
  });
});

describe("parseVital", () => {
  const ok = { name: "LCP", value: 1234.5678, rating: "good", route: "/" };

  it("accepts a core web vital and rounds its value", () => {
    expect(parseVital(ok)).toEqual({ ...ok, value: 1234.568, navigationType: undefined });
  });

  it.each([
    ["unknown metric", { ...ok, name: "FID" }],
    ["non-numeric value", { ...ok, value: "1" }],
    ["negative value", { ...ok, value: -1 }],
    ["bad rating", { ...ok, rating: "great" }],
    ["absolute URL as route", { ...ok, route: "https://evil.example/" }],
    ["not an object", "LCP"],
  ])("rejects %s", (_label, body) => {
    expect(parseVital(body)).toBeNull();
  });
});
