import type { PlayerRole, PlayerSnapshot } from "@/lib/api/types";

export const ROLE_ORDER: PlayerRole[] = [
  "exp",
  "jungle",
  "mid",
  "gold",
  "roam",
  "flex",
  "coach",
];

export function roleLabel(role: PlayerRole | string): string {
  return role.toUpperCase();
}

export function latestSnapshots(
  snapshots: PlayerSnapshot[] | undefined,
): Map<string, PlayerSnapshot> {
  const latest = new Map<string, PlayerSnapshot>();
  for (const snapshot of snapshots ?? []) {
    const playerId = snapshot?.player_id;
    if (!playerId) continue;
    const previous = latest.get(playerId);
    if (!previous || (snapshot?.recorded_at ?? "") >= (previous?.recorded_at ?? "")) {
      latest.set(playerId, snapshot);
    }
  }
  return latest;
}
