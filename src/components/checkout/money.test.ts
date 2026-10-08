import { describe, expect, it } from "vitest";

import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("formats rupiah without decimals", () => {
    expect(formatMoney(400000, "IDR").replace(/\s/g, "")).toBe("Rp400.000");
  });

  it("formats dollars with cents", () => {
    expect(formatMoney(25, "USD")).toBe("$25.00");
  });
});
