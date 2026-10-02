"use client";

import { createContext, useContext, useState } from "react";

import { useToast } from "@/components/ui/Toast";
import { addFavorite, removeFavorite } from "@/lib/api/endpoints";
import type { TeamSummary } from "@/lib/api/types";
import { useSupabaseSession } from "@/lib/supabase/useSession";

interface FollowValue {
  /** Signed in, as decided by the server. */
  signedIn: boolean;
  followed: TeamSummary[];
  isFollowing: (teamId: string) => boolean;
  toggle: (team: TeamSummary) => Promise<void>;
}

const FollowContext = createContext<FollowValue>({
  signedIn: false,
  followed: [],
  isFollowing: () => false,
  toggle: async () => {},
});

export function useFollow(): FollowValue {
  return useContext(FollowContext);
}

interface FollowProviderProps {
  signedIn: boolean;
  /** The visitor's favorite teams, newest first (empty for guests). */
  initialTeams: TeamSummary[];
  children: React.ReactNode;
}

// The visitor's followed teams, shared by the Follow buttons, the "Your teams"
// strip and the "Following" badges. Updates are optimistic.
export function FollowProvider({ signedIn, initialTeams, children }: FollowProviderProps) {
  const toast = useToast();
  const { session, ready } = useSupabaseSession();
  const [followed, setFollowed] = useState(initialTeams);

  const isFollowing = (teamId: string) => followed.some((team) => team?.id === teamId);

  async function toggle(team: TeamSummary) {
    if (!signedIn) {
      toast("Log in to follow teams.", { label: "Log in", href: "/login" });
      return;
    }
    if (!ready || !session) return;

    const wasFollowing = isFollowing(team.id);
    setFollowed((previous) =>
      wasFollowing ? previous.filter((item) => item?.id !== team.id) : [team, ...previous],
    );
    toast(
      wasFollowing
        ? `Unfollowed ${team.name}.`
        : `Following ${team.name}. Their matches now show first.`,
    );

    try {
      if (wasFollowing) await removeFavorite("team", team.id, session.token);
      else await addFavorite("team", team.id, session.token);
    } catch {
      setFollowed((previous) =>
        wasFollowing ? [team, ...previous] : previous.filter((item) => item?.id !== team.id),
      );
      toast("Could not update your teams. Try again.");
    }
  }

  return (
    <FollowContext.Provider value={{ signedIn, followed, isFollowing, toggle }}>
      {children}
    </FollowContext.Provider>
  );
}
