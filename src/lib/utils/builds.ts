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

/** Minute marks for an axis: every 2 minutes (every 5 past 25 minutes). */
export function minuteTicks(axisSeconds: number): number[] {
  const step = axisSeconds > 25 * 60 ? 5 : 2;
  const ticks: number[] = [];
  for (let minute = 0; minute * 60 <= axisSeconds; minute += step) ticks.push(minute);
  return ticks;
}
