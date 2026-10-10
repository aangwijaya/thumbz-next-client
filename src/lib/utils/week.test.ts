import { describe, expect, it } from "vitest";

import { dayBounds, dayParam, shiftDay, weekDays } from "./week";

describe("week helpers", () => {
  it("validates a day parameter", () => {
    expect(dayParam("2026-10-11")).toBe("2026-10-11");
    expect(dayParam("2026-13-40")).toBeNull();
    expect(dayParam("yesterday")).toBeNull();
    expect(dayParam(undefined)).toBeNull();
  });

  it("lists Monday to Sunday around a day", () => {
    expect(weekDays("2026-10-11")).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
    expect(weekDays("2026-10-12")[0]).toBe("2026-10-12");
  });

  it("moves by days and gives the day's bounds", () => {
    expect(shiftDay("2026-10-11", 7)).toBe("2026-10-18");
    expect(dayBounds("2026-10-11")).toEqual({ from: "2026-10-11T00:00:00.000Z", to: "2026-10-11T23:59:59.999Z" });
  });
});
