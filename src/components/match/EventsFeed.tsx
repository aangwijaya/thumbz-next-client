"use client";

import { useMemo } from "react";

import { useMatchEconomy, useMatchEvents, useMatchLiveStats, usePlayers } from "@/lib/api/endpoints";
import type { TeamSummary } from "@/lib/api/types";
import { formatTime, formatViewerCount } from "@/lib/utils/format";
import { latestSnapshots } from "@/lib/utils/live";

import { EmptyState } from "../ui/EmptyState";
import { Skeleton } from "../ui/Skeleton";

interface EventsFeedProps {
  matchId: string;
  live: boolean;
  teamA?: TeamSummary | null;
  teamB?: TeamSummary | null;
  className?: string;
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-2 rounded-full border border-page-dark-border px-3 py-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
        {label}
      </span>
      <span className="font-mono text-xs tabular-nums text-text-primary">{value}</span>
    </span>
  );
}

export function EventsFeed({
  matchId,
  live,
  teamA,
  teamB,
  className = "",
}: EventsFeedProps) {
  const events = useMatchEvents(matchId, live);
  const liveStats = useMatchLiveStats(matchId, live);
  const economy = useMatchEconomy(matchId, live);
  const playersA = usePlayers({ team_id: teamA?.id ?? "" });
  const playersB = usePlayers({ team_id: teamB?.id ?? "" });

  const teamColors = useMemo(() => {
    const map = new Map<string, string | undefined>();
    if (teamA?.id) map.set(teamA.id, teamA?.color_primary);
    if (teamB?.id) map.set(teamB.id, teamB?.color_primary);
    return map;
  }, [teamA, teamB]);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const player of [...(playersA.data?.data ?? []), ...(playersB.data?.data ?? [])]) {
      if (player?.id) map.set(player.id, player?.nickname ?? "?");
    }
    return map;
  }, [playersA.data, playersB.data]);

  const teamNames = useMemo(() => {
    const map = new Map<string, string>();
    if (teamA?.id) map.set(teamA.id, teamA?.name ?? "Team A");
    if (teamB?.id) map.set(teamB.id, teamB?.name ?? "Team B");
    return map;
  }, [teamA, teamB]);

  const list = useMemo(() => {
    return [...(events.data ?? [])]
      .sort((a, b) => (b?.occurred_at ?? "").localeCompare(a?.occurred_at ?? ""))
      .slice(0, 8);
  }, [events.data]);

  const metrics = useMemo(() => {
    const chips: Array<{ label: string; value: string }> = [];
    const firstBlood = (events.data ?? []).find(
      (event) => event?.event_type === "first_blood",
    );
    if (firstBlood?.title) chips.push({ label: "First blood", value: firstBlood.title });

    const latest = Array.from(latestSnapshots(liveStats.data).values());
    const totalKills = latest.reduce((sum, s) => sum + (s?.kills ?? 0), 0);
    if (latest.length > 0) chips.push({ label: "Total kills", value: String(totalKills) });

    const damageLeader = latest
      .filter((s) => typeof s?.damage === "number")
      .sort((a, b) => (b?.damage ?? 0) - (a?.damage ?? 0))[0];
    if (damageLeader) {
      chips.push({
        label: "Damage leader",
        value: `${names.get(damageLeader?.player_id ?? "") ?? "—"} · ${formatViewerCount(damageLeader?.damage ?? 0)}`,
      });
    }

    const snapshots = economy.data ?? [];
    if (teamA?.id && teamB?.id && snapshots.length > 0) {
      const latestA = snapshots.filter((s) => s?.team_id === teamA.id).at(-1)?.gold;
      const latestB = snapshots.filter((s) => s?.team_id === teamB.id).at(-1)?.gold;
      if (latestA != null && latestB != null && latestA !== latestB) {
        const lead = latestA - latestB;
        chips.push({
          label: "Gold lead",
          value: `+${formatViewerCount(Math.abs(lead))} ${teamNames.get(lead > 0 ? teamA.id : teamB.id) ?? ""}`,
        });
      }
    }
    return chips;
  }, [events.data, liveStats.data, economy.data, names, teamNames, teamA, teamB]);

  const loading = events.isLoading;
  const empty = !loading && list.length === 0 && metrics.length === 0;

  return (
    <section
      className={`flex flex-col gap-4 rounded-xl border border-page-dark-border bg-page-dark-surface p-4 sm:p-5 ${className}`}
    >
      <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
        Live events
      </h2>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : empty ? (
        <EmptyState
          title="No events yet"
          description="Kills, objectives and key moments appear here live."
        />
      ) : (
        <>
          {metrics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {metrics.map((chip) => (
                <MetricChip key={chip.label} label={chip.label} value={chip.value} />
              ))}
            </div>
          ) : null}

          {list.length > 0 ? (
            <ol className="flex flex-col">
              {list.map((event, index) => (
                <li
                  key={`${event?.id ?? index}-${event?.occurred_at ?? ""}`}
                  className="flex items-baseline gap-3 border-b border-page-dark-border py-2.5 last:border-b-0"
                >
                  <span className="w-12 shrink-0 font-mono text-[11px] tabular-nums text-text-secondary">
                    {formatTime(event?.occurred_at ?? "")}
                  </span>
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 self-center rounded-full"
                    style={{
                      backgroundColor:
                        teamColors.get(event?.team_id ?? "") ?? "#797776",
                    }}
                  />
                  <span className="min-w-0 flex-1 text-sm">
                    {event?.title ?? "Event"}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-text-secondary">
                    {event?.event_type?.replace(/_/g, " ") ?? ""}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </>
      )}

      {events.isError && list.length > 0 ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-warning">
          Reconnecting…
        </p>
      ) : null}
    </section>
  );
}
