"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { useMatchLiveStats, usePlayers } from "@/lib/api/endpoints";
import type { PlayerRole, PlayerSnapshot, PlayerSummary, TeamSummary } from "@/lib/api/types";
import { formatViewerCount } from "@/lib/utils/format";
import { latestSnapshots, ROLE_ORDER, roleLabel } from "@/lib/utils/live";

import { EmptyState } from "../ui/EmptyState";
import { Skeleton } from "../ui/Skeleton";

const ROTATION_MS = 5_000;

interface HeadToHeadPanelProps {
  matchId: string;
  live: boolean;
  teamA?: TeamSummary | null;
  teamB?: TeamSummary | null;
  className?: string;
}

function PlayerPhoto({ player, size = 44 }: { player?: PlayerSummary | null; size?: number }) {
  const nickname = player?.nickname ?? "?";
  if (player?.photo_url) {
    return (
      <Image
        src={player.photo_url}
        alt={nickname}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-page-dark font-mono text-sm text-text-secondary"
      style={{ width: size, height: size }}
    >
      {nickname.slice(0, 2).toUpperCase()}
    </span>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
        {label}
      </span>
      <span className="font-mono text-sm tabular-nums text-text-primary">{value}</span>
    </div>
  );
}

function PanelPlayer({
  player,
  snapshot,
  color,
}: {
  player?: PlayerSummary | null;
  snapshot?: PlayerSnapshot;
  color?: string;
}) {
  const kda = snapshot
    ? `${snapshot?.kills ?? 0}/${snapshot?.deaths ?? 0}/${snapshot?.assists ?? 0}`
    : "—";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <PlayerPhoto player={player} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{player?.nickname ?? "TBD"}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-secondary">
            {player?.role ? roleLabel(player.role) : "—"}
          </p>
        </div>
        {color ? (
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5">
        <MetricRow label="Level" value={snapshot?.level != null ? String(snapshot.level) : "—"} />
        <MetricRow label="K / D / A" value={kda} />
        <MetricRow
          label="Gold"
          value={snapshot ? formatViewerCount(snapshot?.gold ?? 0) : "—"}
        />
        <MetricRow
          label="Damage"
          value={snapshot ? formatViewerCount(snapshot?.damage ?? 0) : "—"}
        />
        <MetricRow
          label="Taken"
          value={snapshot ? formatViewerCount(snapshot?.damage_taken ?? 0) : "—"}
        />
      </div>
    </div>
  );
}

export function HeadToHeadPanel({
  matchId,
  live,
  teamA,
  teamB,
  className = "",
}: HeadToHeadPanelProps) {
  const playersA = usePlayers({ team_id: teamA?.id ?? "" });
  const playersB = usePlayers({ team_id: teamB?.id ?? "" });
  const liveStats = useMatchLiveStats(matchId, live);

  const roles = useMemo(() => {
    const rolesA = new Set((playersA.data?.data ?? []).map((p) => p?.role));
    const rolesB = new Set((playersB.data?.data ?? []).map((p) => p?.role));
    return ROLE_ORDER.filter((role) => rolesA.has(role) && rolesB.has(role));
  }, [playersA.data, playersB.data]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (roles.length < 2) return;
    const timer = setInterval(() => {
      setIndex((value) => value + 1);
    }, ROTATION_MS);
    return () => clearInterval(timer);
  }, [roles.length]);

  const role: PlayerRole | undefined = roles[index % Math.max(roles.length, 1)];
  const latest = useMemo(() => latestSnapshots(liveStats.data), [liveStats.data]);

  const listA = playersA.data?.data ?? [];
  const listB = playersB.data?.data ?? [];
  const playerA = listA.find((p) => p?.role === role) ?? null;
  const playerB = listB.find((p) => p?.role === role) ?? null;

  const loading = playersA.isLoading || playersB.isLoading;
  const empty = !loading && (listA.length === 0 || listB.length === 0);

  return (
    <aside
      className={`flex flex-col gap-4 rounded-xl border border-page-dark-border bg-page-dark-surface p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          Head-to-head
        </p>
        {roles.length > 1 ? (
          <span className="flex items-center gap-1.5" aria-label={`Showing ${roleLabel(role ?? "")}`}>
            {roles.map((item, itemIndex) => (
              <span
                key={item}
                aria-hidden="true"
                className={`size-1.5 rounded-full ${
                  itemIndex === index % roles.length ? "bg-live" : "bg-page-dark-border"
                }`}
              />
            ))}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : empty ? (
        <EmptyState
          title="No player data yet"
          description="Head-to-head stats appear once the match feed starts."
        />
      ) : (
        <div
          key={role ?? "none"}
          className="flex flex-col gap-4 motion-safe:animate-fade-in"
        >
          <p className="text-center font-mono text-xs uppercase tracking-[0.25em] text-text-primary">
            {roleLabel(role ?? "")}
          </p>
          <PanelPlayer
            player={playerA}
            snapshot={playerA ? latest.get(playerA.id) : undefined}
            color={teamA?.color_primary}
          />
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-text-secondary">
            vs
          </p>
          <PanelPlayer
            player={playerB}
            snapshot={playerB ? latest.get(playerB.id) : undefined}
            color={teamB?.color_primary}
          />
        </div>
      )}

      {liveStats.isError && latest.size > 0 ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-warning">
          Reconnecting…
        </p>
      ) : null}
    </aside>
  );
}
