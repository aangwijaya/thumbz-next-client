import type { ItemPurchase } from "@/lib/api/types";

/** Inventory slots in Mobile Legends. */
export const SLOTS = 6;

export interface OwnedItem {
  id: string;
  name: string;
  icon_url: string | null;
}

/**
 * What a player is probably carrying, from their purchases so far: finished
 * items (tier 3) in the order bought, then the most recent components. The
 * real inventory is not published live (components merge into upgrades),
 * so this is the readable approximation; finished games show the real build.
 */
export function inventoryOf(purchases: ItemPurchase[]): OwnedItem[] {
  const ordered = [...purchases].sort((a, b) => Date.parse(a.purchased_at) - Date.parse(b.purchased_at));
  const toItem = (p: ItemPurchase): OwnedItem => ({ id: p.item_id, name: p.item_name, icon_url: p.icon_url ?? null });
  const finished = ordered.filter((p) => p.tier === 3).map(toItem);
  const parts = ordered
    .filter((p) => p.tier !== 3)
    .map(toItem)
    .reverse()
    .slice(0, Math.max(0, SLOTS - finished.length))
    .reverse();
  return [...finished, ...parts].slice(0, SLOTS);
}

export interface TimelineMark {
  key: string;
  name: string;
  icon_url: string | null;
  tier: number | null;
  /** Seconds after the game started. */
  second: number;
  /** Position along the axis, 0–100. */
  left: number;
  /** Row inside the track, so close purchases do not overlap. */
  lane: number;
}

/**
 * Places each purchase on a time axis of `axisSeconds`; purchases closer than
 * `minGap` percent go to the next lane (at most `maxLanes`).
 */
export function timelineOf(
  purchases: ItemPurchase[],
  startedAt: number,
  axisSeconds: number,
  minGap = 3.2,
  maxLanes = 3,
): TimelineMark[] {
  const laneEnds: number[] = [];
  return [...purchases]
    .sort((a, b) => Date.parse(a.purchased_at) - Date.parse(b.purchased_at))
    .map((purchase, index) => {
      const second = Math.max(0, Math.round((Date.parse(purchase.purchased_at) - startedAt) / 1000));
      const left = axisSeconds > 0 ? Math.min(100, (second / axisSeconds) * 100) : 0;
      let lane = laneEnds.findIndex((end) => left - end >= minGap);
      if (lane === -1) lane = laneEnds.length < maxLanes ? laneEnds.length : laneEnds.indexOf(Math.min(...laneEnds));
      laneEnds[lane] = left;
      return {
        key: `${purchase.item_id}-${purchase.purchased_at}-${index}`,
        name: purchase.item_name,
        icon_url: purchase.icon_url ?? null,
        tier: purchase.tier ?? null,
        second,
        left,
        lane,
      };
    });
}

/** Minute marks for an axis: every 2 minutes (every 5 past 25 minutes). */
export function minuteTicks(axisSeconds: number): number[] {
  const step = axisSeconds > 25 * 60 ? 5 : 2;
  const ticks: number[] = [];
  for (let minute = 0; minute * 60 <= axisSeconds; minute += step) ticks.push(minute);
  return ticks;
}
