import { describe, expect, it } from "vitest";

import type { ItemPurchase } from "@/lib/api/types";

import { inventoryOf, minuteTicks, timelineOf } from "./builds";

const start = Date.parse("2026-10-09T10:00:00Z");
const buy = (item: string, second: number, tier: number | null): ItemPurchase => ({
  player_id: "p",
  team_id: "t",
  item_id: item,
  item_name: item,
  phase: tier === 3 ? "phase3" : "phase2",
  slot: null,
  tier,
  icon_url: null,
  purchased_at: new Date(start + second * 1000).toISOString(),
});

describe("inventoryOf", () => {
  it("keeps finished items first, then the latest components, six at most", () => {
    const items = inventoryOf([
      buy("Knife", 4, 1),
      buy("Boots", 30, 1),
      buy("Blade", 400, 3),
      buy("Dagger", 420, 1),
      buy("Axe", 500, 2),
      buy("Hammer", 600, 2),
      buy("Wings", 700, 2),
      buy("Malefic", 800, 3),
    ]);
    expect(items.map((item) => item.name)).toEqual(["Blade", "Malefic", "Dagger", "Axe", "Hammer", "Wings"]);
  });

  it("is empty before any purchase", () => {
    expect(inventoryOf([])).toEqual([]);
  });
});

describe("timelineOf", () => {
  it("places purchases by second and stacks close ones in lanes", () => {
    const marks = timelineOf([buy("B", 10, 1), buy("A", 0, 1), buy("C", 300, 3)], start, 600);
    expect(marks.map((m) => [m.name, m.second, m.left, m.lane])).toEqual([
      ["A", 0, 0, 0],
      ["B", 10, (10 / 600) * 100, 1],
      ["C", 300, 50, 0],
    ]);
  });

  it("never uses more lanes than allowed", () => {
    const marks = timelineOf(
      Array.from({ length: 6 }, (_, i) => buy(`I${i}`, i, 1)),
      start,
      600,
      3.2,
      2,
    );
    expect(Math.max(...marks.map((m) => m.lane))).toBe(1);
  });
});

describe("minuteTicks", () => {
  it("marks every 2 minutes, every 5 in long games", () => {
    expect(minuteTicks(17 * 60 + 45)).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16]);
    expect(minuteTicks(31 * 60)).toEqual([0, 5, 10, 15, 20, 25, 30]);
  });
});
