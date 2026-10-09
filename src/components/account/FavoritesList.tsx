"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { PlayerTile } from "@/components/cards/PlayerTile";
import { TeamTile } from "@/components/cards/TeamTile";
import { useToast } from "@/components/ui/Toast";
import { fetchMyFavorites, queryKeys, removeFavorite } from "@/lib/api/endpoints";
import type { Favorite, PlayerSummary, TeamSummary } from "@/lib/api/types";
import { useSupabaseSession } from "@/lib/supabase/useSession";

const entityName = (favorite: Favorite) =>
  favorite.entity_type === "team"
    ? (favorite.entity as TeamSummary)?.name
    : (favorite.entity as PlayerSummary)?.nickname;

const unfollowClass =
  "min-h-11 shrink-0 rounded-lg px-3 text-body-sm font-semibold text-pencil transition-colors hover:bg-cream hover:text-deep-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

export function FavoritesList() {
  const { session, ready } = useSupabaseSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const favorites = useQuery({
    queryKey: queryKeys.myFavorites(),
    queryFn: () => fetchMyFavorites(session!.token),
    enabled: Boolean(session),
  });

  // Optimistic: the row disappears at once and comes back if the API refuses.
  const unfollow = useMutation({
    mutationFn: (favorite: Favorite) => removeFavorite(favorite.entity_type, favorite.entity_id, session!.token),
    onMutate: async (favorite) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.myFavorites() });
      const previous = queryClient.getQueryData<Favorite[]>(queryKeys.myFavorites());
      queryClient.setQueryData<Favorite[]>(queryKeys.myFavorites(), (rows) =>
        (rows ?? []).filter((row) => row.entity_id !== favorite.entity_id),
      );
      return { previous };
    },
    onError: (_error, _favorite, context) => {
      queryClient.setQueryData(queryKeys.myFavorites(), context?.previous);
      toast("Could not unfollow. Please try again.");
    },
  });

  if (!ready || favorites.isLoading) {
    return <div className="h-40 rounded-image bg-stone/30 motion-safe:animate-pulse" aria-hidden="true" />;
  }
  if (favorites.isError) {
    return <p role="alert" className="text-body text-pencil">We could not load your favorites. Refresh to try again.</p>;
  }
  const rows = favorites.data ?? [];
  if (rows.length === 0) {
    return (
      <p className="text-body text-pencil">
        You are not following anyone yet. Follow teams and players from their pages, for example{" "}
        <Link href="/teams" className="font-semibold text-cobalt-link hover:underline">
          all teams
        </Link>
        .
      </p>
    );
  }

  const sections: Array<{ title: string; items: Favorite[] }> = [
    { title: "Teams", items: rows.filter((row) => row?.entity_type === "team") },
    { title: "Players", items: rows.filter((row) => row?.entity_type === "player") },
  ];

  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) =>
        section.items.length === 0 ? null : (
          <section key={section.title} aria-labelledby={`fav-${section.title}`} className="flex flex-col gap-4">
            <h2 id={`fav-${section.title}`} className="font-graphik text-body-lg font-bold text-ink">
              {section.title} <span className="font-normal text-pencil">({section.items.length})</span>
            </h2>
            <ul className="grid gap-3 min-[761px]:grid-cols-2">
              {section.items.map((favorite) => (
                <li key={favorite.entity_id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    {favorite.entity_type === "team" ? (
                      <TeamTile team={favorite.entity as TeamSummary} />
                    ) : (
                      <PlayerTile player={favorite.entity as PlayerSummary} />
                    )}
                  </div>
                  <button
                    type="button"
                    className={unfollowClass}
                    onClick={() => unfollow.mutate(favorite)}
                    aria-label={`Unfollow ${entityName(favorite) ?? ""}`}
                  >
                    Unfollow
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}
