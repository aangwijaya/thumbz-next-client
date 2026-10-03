"use client";

import { useEffect, useState } from "react";

import { clock, holdBackMs } from "@/components/match/GoldLead";
import { RevealButton } from "@/components/spoiler/Spoiler";
import { useSpoilers } from "@/components/spoiler/SpoilerProvider";
import { Container } from "@/components/ui/Container";
import { LogoMark } from "@/components/ui/LogoMark";
import {
  useMatchEquipment,
  useMatchEvents,
  useMatchLiveStats,
  useMatchStatistics,
} from "@/lib/api/endpoints";
import type { MatchSummary, PlayerRole, PlayerSnapshot, TeamSummary } from "@/lib/api/types";
import {
  dummyEquipment,
  dummyEvents,
  dummySnapshots,
  dummyStatistics,
  orDummy,
} from "@/lib/dummy/match";
import { formatViewerCount, initialsOf, shortTeamName } from "@/lib/utils/format";

const TICK_MS = 5_000;
const SLOTS = 6;

const ROLE_LABELS: Record<PlayerRole, string> = {
  exp: "EXP",
  jungle: "JGL",
  mid: "MID",
  gold: "GOLD",
  roam: "ROAM",
  flex: "FLEX",
  coach: "COACH",
};
const ROLE_ORDER: PlayerRole[] = ["exp", "jungle", "mid", "gold", "roam", "flex", "coach"];

interface Line {
  id: string;
  nickname: string;
  role: PlayerRole | null;
  hero: string | null;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  level: number | null;
  items: string[];
}

const tint = (color: string, share: number) =>
  `color-mix(in oklab, ${color} ${share}%, var(--color-paper))`;

function Objective({
  label,
  a,
  b,
  format = String,
}: {
  label: string;
  a: number;
  b: number;
  format?: (value: number) => string;
}) {
  return (
    <div className="border-b border-stone/50 py-2.5 last:border-b-0 min-[641px]:max-[1180px]:border-b-0">
      <div className="grid grid-cols-[52px_minmax(0,1fr)_52px] items-center gap-2.5 font-graphik text-base font-extrabold">
        <span>{format(a)}</span>
        <span className="flex h-1.5 gap-[3px]" aria-hidden="true">
          <i className="rounded-full bg-[var(--a)]" style={{ flex: a || 0.0001 }} />
          <i className="rounded-full bg-[var(--b)]" style={{ flex: b || 0.0001 }} />
        </span>
        <span className="text-right">{format(b)}</span>
      </div>
      <p className="text-center text-caption font-medium text-pencil">{label}</p>
    </div>
  );
}

function Roster({ team, lines, color }: { team?: TeamSummary | null; lines: Line[]; color: string }) {
  const totalGold = lines.reduce((sum, line) => sum + line.gold, 0);
  return (
    <div className="overflow-hidden rounded-xl border border-stone bg-paper shadow-subtle">
      <div className="flex items-center gap-2.5 border-b border-stone/50 px-4 py-3.5">
        <LogoMark source={team} size="sm" />
        <b className="font-graphik text-[15px]">{team?.name ?? "TBD"}</b>
        <span className="ml-auto text-[13px] text-pencil">{formatViewerCount(totalGold)} gold</span>
      </div>
      {lines.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-pencil">No player stats yet.</p>
      ) : (
        <ul>
          {lines.map((line) => (
            <li
              key={line.id}
              className="grid grid-cols-[32px_minmax(0,1fr)_58px_46px] items-center gap-x-2.5 gap-y-1.5 border-b border-stone/50 px-3.5 py-2.5 text-sm last:border-b-0 min-[641px]:grid-cols-[44px_32px_minmax(0,1fr)_64px_50px_auto] min-[641px]:px-4"
            >
              <span className="text-[11px] font-bold tracking-[0.04em] text-pencil max-[640px]:hidden">
                {line.role ? ROLE_LABELS[line.role] : ""}
              </span>
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-lg font-graphik text-[10px] font-extrabold text-ink"
                style={{ background: tint(color, 22) }}
              >
                {line.hero ? initialsOf(line.hero) : "?"}
              </span>
              <p className="min-w-0">
                <b className="block truncate font-semibold">{line.nickname}</b>
                <small className="text-caption text-pencil">
                  {[line.hero, line.level != null ? `Lv ${line.level}` : null].filter(Boolean).join(" · ")}
                </small>
              </p>
              <span className="text-right font-semibold tabular-nums" aria-label={`${line.kills} kills, ${line.deaths} deaths, ${line.assists} assists`}>
                {line.kills}/{line.deaths}/{line.assists}
              </span>
              <span className="text-right tabular-nums text-charcoal">{formatViewerCount(line.gold)}</span>
              <span
                className="flex gap-[3px] max-[640px]:col-start-2 max-[640px]:col-end-[-1]"
                aria-label={line.items.length > 0 ? `Items: ${line.items.join(", ")}` : "No items yet"}
              >
                {Array.from({ length: SLOTS }, (_, index) => {
                  const item = line.items[index];
                  return (
                    <i
                      key={index}
                      title={item}
                      className={`size-4 rounded ${item ? "" : "border border-dashed border-stone"}`}
                      style={item ? { background: tint(color, 30 + (index % 2) * 14) } : undefined}
                    />
                  );
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LiveStats({ match }: { match: MatchSummary }) {
  const id = match?.id ?? "";
  const live = match?.status === "live";
  const { isVisible } = useSpoilers();
  const statistics = useMatchStatistics(id);
  const snapshots = useMatchLiveStats(id, live);
  const equipment = useMatchEquipment(id, live);
  const events = useMatchEvents(id, live);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [live]);

  const colorA = match?.team_a?.color_primary || "#e34432";
  const colorB = match?.team_b?.color_primary || "#0f66ae";
  const cutoff = live ? now - holdBackMs(match) : Number.POSITIVE_INFINITY;
  const shown = (iso: string) => Date.parse(iso) <= cutoff;

  const players = orDummy(statistics.data?.players, () => dummyStatistics(match).players);
  const allSnapshots = orDummy(snapshots.data, () => dummySnapshots(match)).filter((s) => shown(s.recorded_at));
  const purchases = orDummy(equipment.data, () => dummyEquipment(match)).filter((p) => shown(p.purchased_at));
  const moments = orDummy(events.data, () => dummyEvents(match)).filter((e) => shown(e.occurred_at));

  // Latest snapshot per player (the endpoint is an ordered series).
  const latest = new Map<string, PlayerSnapshot>();
  for (const snapshot of allSnapshots) latest.set(snapshot.player_id, snapshot);
  const lastAt = allSnapshots.length > 0 ? allSnapshots[allSnapshots.length - 1].recorded_at : null;
  const firstEvent = moments.length > 0 ? Math.min(...moments.map((e) => Date.parse(e.occurred_at))) : null;

  const linesFor = (teamId?: string): Line[] =>
    players
      .filter((row) => row.team_id === teamId)
      .map((row) => {
        const snap = latest.get(row.player_id);
        return {
          id: row.player_id,
          nickname: row.player?.nickname ?? "Player",
          role: row.player?.role ?? null,
          hero: row.hero_picked || null,
          kills: snap?.kills ?? row.kills ?? 0,
          deaths: snap?.deaths ?? row.deaths ?? 0,
          assists: snap?.assists ?? row.assists ?? 0,
          gold: snap?.gold ?? row.gold ?? 0,
          level: snap?.level ?? null,
          items: purchases.filter((p) => p.player_id === row.player_id).map((p) => p.item_name).slice(-SLOTS),
        };
      })
      .sort((a, b) => ROLE_ORDER.indexOf(a.role ?? "flex") - ROLE_ORDER.indexOf(b.role ?? "flex"));

  const linesA = linesFor(match?.team_a?.id);
  const linesB = linesFor(match?.team_b?.id);
  const sum = (lines: Line[], key: "kills" | "gold") => lines.reduce((total, line) => total + line[key], 0);
  const count = (teamId: string | undefined, type: string) =>
    moments.filter((event) => event.team_id === teamId && event.event_type === type).length;

  const nameA = shortTeamName(match?.team_a);
  const nameB = shortTeamName(match?.team_b);
  const heading =
    match?.status === "scheduled"
      ? "Stats appear when the match starts"
      : live
        ? `Game ${match?.game_number ?? (match?.score_a ?? 0) + (match?.score_b ?? 0) + 1}${
            lastAt && firstEvent ? `, at ${clock((Date.parse(lastAt) - firstEvent) / 1000)}` : ""
          }`
        : "Final game";

  return (
    <section aria-labelledby="live-stats-title" className="pt-5 min-[901px]:pt-12">
      <Container size="watch">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div>
            <p className="text-caption font-semibold text-deep-ember">{live ? "Live stats" : "Stats"}</p>
            <h2 id="live-stats-title" className="font-graphik text-[21px] font-bold leading-[1.3] text-ink">
              {live && !isVisible(id) ? "This game" : heading}
            </h2>
          </div>
          {live ? <p className="text-[13px] text-pencil">Held back {Math.round(holdBackMs(match) / 1000)} seconds to match the stream</p> : null}
        </div>

        {match?.status === "scheduled" ? null : !isVisible(id) ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-xl border border-stone bg-paper p-6 text-center text-[13px] text-pencil">
            <b className="font-graphik text-base text-ink">Live stats are hidden</b>
            <span>Gold, kills and objectives would give away how the game is going.</span>
            <RevealButton matchId={id}>Show for this match</RevealButton>
          </div>
        ) : (
          <div
            className="grid gap-4 min-[641px]:grid-cols-2 min-[1181px]:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)]"
            style={{ ["--a" as string]: colorA, ["--b" as string]: colorB }}
          >
            <div className="rounded-xl border border-stone bg-paper px-5 py-4 shadow-subtle min-[641px]:max-[1180px]:col-span-2">
              <div className="mb-1.5 flex items-center justify-between font-graphik text-sm font-bold">
                <span className="flex items-center gap-2">
                  <LogoMark source={match?.team_a} size="xs" />
                  {nameA}
                </span>
                <span className="flex items-center gap-2">
                  {nameB}
                  <LogoMark source={match?.team_b} size="xs" />
                </span>
              </div>
              <div className="min-[641px]:max-[1180px]:grid min-[641px]:max-[1180px]:grid-cols-5 min-[641px]:max-[1180px]:gap-x-5">
                <Objective label="Gold" a={sum(linesA, "gold")} b={sum(linesB, "gold")} format={formatViewerCount} />
                <Objective label="Kills" a={sum(linesA, "kills")} b={sum(linesB, "kills")} />
                <Objective label="Towers" a={count(match?.team_a?.id, "tower")} b={count(match?.team_b?.id, "tower")} />
                <Objective label="Turtles" a={count(match?.team_a?.id, "turtle")} b={count(match?.team_b?.id, "turtle")} />
                <Objective label="Lords" a={count(match?.team_a?.id, "lord")} b={count(match?.team_b?.id, "lord")} />
              </div>
            </div>
            <Roster team={match?.team_a} lines={linesA} color={colorA} />
            <Roster team={match?.team_b} lines={linesB} color={colorB} />
          </div>
        )}
      </Container>
    </section>
  );
}
