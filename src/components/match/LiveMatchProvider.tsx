"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";

import { LiveDot } from "@/components/ui/LiveDot";
import { queryKeys } from "@/lib/api/endpoints";
import type { MatchDetail, MatchGame, MatchSummary } from "@/lib/api/types";
import { useRealtimeRoom, useRealtimeStatus } from "@/lib/realtime/hooks";

type MatchPatch = Partial<
  Pick<MatchSummary, "status" | "score_a" | "score_b" | "winner_team_id" | "viewer_count" | "started_at" | "ended_at"> &
    Pick<MatchDetail, "games" | "game_number">
> & { id: string };

interface LiveMatchValue {
  id: string;
  patch: MatchPatch | null;
  /** Viewers on THUMBZ right now (null until the first count arrives). */
  online: number | null;
}

const LiveMatchContext = createContext<LiveMatchValue | null>(null);

const LIVE_KINDS = {
  economy: queryKeys.matchEconomy,
  "live-stats": queryKeys.matchLiveStats,
  equipment: queryKeys.matchEquipment,
  events: queryKeys.matchEvents,
} as const;

/**
 * Keeps one match current over the realtime channel: score/status pushes are
 * applied in place, live-data notifications refetch just that resource, and
 * a detected gap (missed messages) resyncs everything from REST.
 */
export function LiveMatchProvider({ matchId, children }: { matchId: string; children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [patch, setPatch] = useState<MatchPatch | null>(null);
  const [online, setOnline] = useState<number | null>(null);

  useRealtimeRoom(
    `match:${matchId}`,
    {
      "match:update": (data) => {
        const next = data as MatchPatch;
        setPatch((previous) => {
          // A status change (e.g. live → completed) reshapes the page.
          if (previous?.status && next.status && previous.status !== next.status) router.refresh();
          // A new game starts: live data is per game, so fetch the new game's,
          // and reload the match for the game's start time (pushes omit it).
          if (next.game_number != null && previous?.game_number != null && next.game_number !== previous.game_number) {
            for (const key of Object.values(LIVE_KINDS)) void queryClient.invalidateQueries({ queryKey: key(matchId) });
            router.refresh();
          }
          return { ...previous, ...next };
        });
      },
      "match:live": (data) => {
        const kind = (data as { kind?: string })?.kind;
        if (kind && kind in LIVE_KINDS) {
          void queryClient.invalidateQueries({
            queryKey: LIVE_KINDS[kind as keyof typeof LIVE_KINDS](matchId),
          });
        } else if (kind === "broadcasts") {
          router.refresh();
        }
      },
      "tickets:changed": () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.matchTicket(matchId) });
      },
      "match:viewers": (data) => setOnline((data as { online?: number })?.online ?? null),
    },
    () => {
      void queryClient.invalidateQueries({ queryKey: ["matches", matchId] });
      router.refresh();
    },
  );

  return (
    <LiveMatchContext.Provider value={{ id: matchId, patch, online }}>{children}</LiveMatchContext.Provider>
  );
}

/** `match` with any realtime updates applied (unchanged outside a provider). */
export function useLiveMatch<T extends { id?: string } | null | undefined>(match: T): T {
  const live = useContext(LiveMatchContext);
  if (!match || !live?.patch || live.id !== match.id) return match;
  const known = (match as { games?: MatchGame[] }).games;
  const pushed = live.patch.games;
  // Pushed games carry status and winner only: keep the start/end times the
  // page already has for them (the item timeline and game clock need them).
  const games = pushed?.map((game) => ({
    ...known?.find((row) => row?.game_number === game?.game_number),
    ...game,
  }));
  return { ...match, ...live.patch, ...(games ? { games } : {}) };
}

/** "Live updates · 128 watching on THUMBZ", or the fallback state. */
export function LiveStatusLine() {
  const live = useContext(LiveMatchContext);
  const status = useRealtimeStatus();
  if (!live) return null;
  return (
    <p role="status" className="flex items-center gap-2 text-caption text-pencil">
      {status === "connected" ? (
        <>
          <LiveDot />
          <span>Live updates on</span>
          {live.online !== null ? (
            <span>
              · <b className="font-semibold tabular-nums text-ink">{live.online}</b> watching on THUMBZ
            </span>
          ) : null}
        </>
      ) : status === "idle" ? null : (
        <>
          <span aria-hidden="true" className="size-2 rounded-full bg-graphite" />
          <span>{status === "connecting" ? "Connecting…" : "Reconnecting… updates every 30 s meanwhile"}</span>
        </>
      )}
    </p>
  );
}
