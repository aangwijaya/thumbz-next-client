import { apiFetch } from "./client";
import type { ApiEnvelope, Favorite, TeamSummary } from "./types";

// The visitor's followed teams. The home page still renders without them.
export async function getFollowedTeams(token: string | null): Promise<TeamSummary[]> {
  if (!token) return [];
  try {
    const response = await apiFetch<ApiEnvelope<Favorite[]>>("/me/favorites", {
      token,
      cache: "no-store",
    });
    return (response?.data ?? [])
      .filter((favorite) => favorite?.entity_type === "team")
      .map((favorite) => favorite.entity as TeamSummary);
  } catch {
    return [];
  }
}
