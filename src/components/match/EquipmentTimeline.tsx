"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useMatchEquipment, usePlayers } from "@/lib/api/endpoints";
import type { ItemPurchase, PlayerSummary, TeamSummary } from "@/lib/api/types";
import { formatTime } from "@/lib/utils/format";
import { ROLE_ORDER, roleLabel } from "@/lib/utils/live";

import { EmptyState } from "../ui/EmptyState";
import { Skeleton } from "../ui/Skeleton";

const EMPHASIS_MS = 6_000;

interface EquipmentTimelineProps {
  matchId: string;
  live: boolean;
  teamA?: TeamSummary | null;
  teamB?: TeamSummary | null;
  className?: string;
}

function purchaseKey(purchase: ItemPurchase): string {
  return `${purchase?.player_id}|${purchase?.item_name}|${purchase?.purchased_at}`;
}

function ItemChip({
  purchase,
  phase,
  emphasized,
}: {
  purchase: ItemPurchase;
  phase: "phase2" | "phase3";
  emphasized: boolean;
}) {
  const base =
    phase === "phase3"
      ? "border-text-secondary/40 bg-page-dark-border/60 text-text-primary"
      : "border-page-dark-border text-text-secondary";
  return (
    <span
      className={`inline-flex items-baseline gap-1.5 rounded border px-2 py-1 font-mono text-[11px] transition-colors ${base} ${
        emphasized ? "border-success/60 bg-success/10 text-text-primary" : ""
      }`}
    >
      <span>{purchase?.item_name ?? "Item"}</span>
      <span className="text-[9px] tabular-nums text-text-secondary">
        {formatTime(purchase?.purchased_at ?? "")}
      </span>
    </span>
  );
}

function PlayerRow({
  player,
  purchases,
  recent,
}: {
  player?: PlayerSummary | null;
  purchases: ItemPurchase[];
  recent: Set<string>;
}) {
  const phase2 = purchases.filter((p) => p?.phase === "phase2");
  const phase3 = purchases.filter((p) => p?.phase === "phase3");
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-page-dark-border py-2.5 last:border-b-0">
      <span className="w-12 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-text-secondary">
        {player?.role ? roleLabel(player.role) : "—"}
      </span>
      <span className="w-28 shrink-0 truncate text-sm font-medium">
        {player?.nickname ?? "Unknown"}
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
        {phase2.map((purchase) => (
          <ItemChip
            key={purchaseKey(purchase)}
            purchase={purchase}
            phase="phase2"
            emphasized={recent.has(purchaseKey(purchase))}
          />
        ))}
      </span>
      <span aria-hidden="true" className="shrink-0 text-text-secondary">
        →
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
        {phase3.length > 0 ? (
          phase3.map((purchase) => (
            <ItemChip
              key={purchaseKey(purchase)}
              purchase={purchase}
              phase="phase3"
              emphasized={recent.has(purchaseKey(purchase))}
            />
          ))
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
            —
          </span>
        )}
      </span>
    </div>
  );
}

function TeamBlock({
  team,
  players,
  purchasesByPlayer,
  recent,
}: {
  team?: TeamSummary | null;
  players: PlayerSummary[];
  purchasesByPlayer: Map<string, ItemPurchase[]>;
  recent: Set<string>;
}) {
  const sorted = [...players].sort(
    (a, b) => ROLE_ORDER.indexOf(a?.role ?? "flex") - ROLE_ORDER.indexOf(b?.role ?? "flex"),
  );
  return (
    <div className="flex flex-col">
      <p className="mb-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
        {team?.color_primary ? (
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{ backgroundColor: team.color_primary }}
          />
        ) : null}
        {team?.name ?? "Team"}
      </p>
      {sorted.map((player) => (
        <PlayerRow
          key={player?.id}
          player={player}
          purchases={purchasesByPlayer.get(player?.id ?? "") ?? []}
          recent={recent}
        />
      ))}
    </div>
  );
}

export function EquipmentTimeline({
  matchId,
  live,
  teamA,
  teamB,
  className = "",
}: EquipmentTimelineProps) {
  const playersA = usePlayers({ team_id: teamA?.id ?? "" });
  const playersB = usePlayers({ team_id: teamB?.id ?? "" });
  const equipment = useMatchEquipment(matchId, live);

  const seen = useRef<Set<string> | null>(null);
  const [recent, setRecent] = useState<Set<string>>(new Set());

  const purchases = useMemo(() => equipment.data ?? [], [equipment.data]);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(purchases.map(purchaseKey));
      return;
    }
    const fresh = purchases
      .map(purchaseKey)
      .filter((key) => !(seen.current?.has(key) ?? false));
    if (fresh.length === 0) return;
    for (const key of fresh) seen.current?.add(key);
    setRecent((previous) => new Set([...previous, ...fresh]));
    const timer = setTimeout(() => {
      setRecent((previous) => {
        const next = new Set(previous);
        for (const key of fresh) next.delete(key);
        return next;
      });
    }, EMPHASIS_MS);
    return () => clearTimeout(timer);
  }, [purchases]);

  const purchasesByPlayer = useMemo(() => {
    const map = new Map<string, ItemPurchase[]>();
    for (const purchase of purchases) {
      const playerId = purchase?.player_id;
      if (!playerId) continue;
      const list = map.get(playerId) ?? [];
      list.push(purchase);
      map.set(playerId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a?.purchased_at ?? "").localeCompare(b?.purchased_at ?? ""));
    }
    return map;
  }, [purchases]);

  const loading = equipment.isLoading || playersA.isLoading || playersB.isLoading;
  const empty = !loading && purchases.length === 0;

  return (
    <section
      className={`flex flex-col gap-4 rounded-xl border border-page-dark-border bg-page-dark-surface p-4 sm:p-5 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          Equipment timeline
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">
          Phase 2 → Phase 3
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      ) : empty ? (
        <EmptyState
          title="No build data yet"
          description="Item purchases appear here as the match progresses."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2 xl:gap-8">
          <TeamBlock
            team={teamA}
            players={playersA.data?.data ?? []}
            purchasesByPlayer={purchasesByPlayer}
            recent={recent}
          />
          <TeamBlock
            team={teamB}
            players={playersB.data?.data ?? []}
            purchasesByPlayer={purchasesByPlayer}
            recent={recent}
          />
        </div>
      )}

      {equipment.isError && purchases.length > 0 ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-warning">
          Reconnecting…
        </p>
      ) : null}
    </section>
  );
}
