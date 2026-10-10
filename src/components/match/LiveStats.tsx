"use client";

import { useEffect, useState } from "react";

import { clock, holdBackMs, leadPoints } from "@/components/match/GoldLead";
import { GameIcon } from "@/components/match/GameIcon";
import { GoldSpark } from "@/components/match/GoldSpark";
import { ItemSequence, type SequencePlayer } from "@/components/match/ItemSequence";
import { Badge } from "@/components/ui/Badge";
import { RevealButton } from "@/components/spoiler/Spoiler";
import { useSpoilers } from "@/components/spoiler/SpoilerProvider";
import { Container } from "@/components/ui/Container";
import { LiveDot } from "@/components/ui/LiveDot";
import { LogoMark } from "@/components/ui/LogoMark";
import {
  useMatchEconomy,
  useMatchEquipment,
  useMatchEvents,
  useMatchLiveStats,
  useMatchStatistics,
} from "@/lib/api/endpoints";
import type { GameAsset, MatchDetail, MatchGame, PlayerRole, PlayerSnapshot, TeamSummary } from "@/lib/api/types";
import { inventoryOf, SLOTS, type OwnedItem } from "@/lib/utils/builds";
import { formatViewerCount, shortTeamName } from "@/lib/utils/format";
import { ROLE_ORDER } from "@/lib/utils/live";
import { teamColors, tint } from "@/lib/utils/team-colors";
import { useLiveMatch } from "@/components/match/LiveMatchProvider";

const TICK_MS = 5_000;

const ROLE_LABELS: Record<PlayerRole, string> = {
  exp: "EXP",
  jungle: "JGL",
  mid: "MID",
  gold: "GOLD",
  roam: "ROAM",
  flex: "FLEX",
  coach: "COACH",
};

interface Line {
  id: string;
  nickname: string;
  role: PlayerRole | null;
  hero: string | null;
  heroIcon: string | null;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  level: number | null;
  damage: number | null;
  emblem: GameAsset | null;
  talents: GameAsset[];
  items: OwnedItem[];
  mvp: boolean;
}

const LANE_NAMES: Partial<Record<PlayerRole, string>> = {
  exp: "EXP lane",
  jungle: "Jungle",
  mid: "Mid lane",
  gold: "Gold lane",
  roam: "Roam",
};

interface TeamTotal {
  label: string;
  a: number;
  b: number;
  format?: (value: number) => string;
  /** "APBR +3.2K" on the gold cell. */
  badge?: string;
}

// The broadcast scoreboard: team totals side by side, each with a split bar in team colours.
function Scoreboard({ totals }: { totals: TeamTotal[] }) {
  return (
    <ul
      aria-label="Team totals"
      className="grid overflow-hidden rounded-xl border border-stone bg-paper shadow-subtle max-[640px]:grid-cols-2 min-[641px]:grid-cols-[1.25fr_repeat(4,minmax(0,1fr))]"
    >
      {totals.map((total, index) => {
        const format = total.format ?? String;
        return (
          <li
            key={total.label}
            aria-label={`${total.label}: ${format(total.a)} to ${format(total.b)}`}
            className={`flex flex-col justify-center gap-[9px] px-[18px] py-4 max-[640px]:px-3.5 max-[640px]:py-3 ${
              index === 0 ? "bg-[#fffaf6] max-[640px]:col-span-full" : "border-[#eeecea] min-[641px]:border-l max-[640px]:border-t max-[640px]:even:border-r"
            }`}
          >
            <span className="flex items-center justify-between gap-2 text-caption font-semibold text-pencil">
              {total.label}
              {total.badge ? (
                <Badge tone="ember" size="xs">
                  {total.badge}
                </Badge>
              ) : null}
            </span>
            <span
              aria-hidden="true"
              className={`flex items-baseline justify-between font-graphik font-extrabold leading-none tracking-[-0.01em] tabular-nums ${
                index === 0 ? "text-[28px] max-[640px]:text-2xl" : "text-2xl max-[640px]:text-xl"
              }`}
            >
              <span className={total.a < total.b ? "text-graphite" : "text-ink"}>{format(total.a)}</span>
              <span className={total.b < total.a ? "text-graphite" : "text-ink"}>{format(total.b)}</span>
            </span>
            <span aria-hidden="true" className="flex h-1.5 gap-[3px]">
              <i className="min-w-[3px] rounded-full bg-(--a)" style={{ flex: total.a || 0.0001 }} />
              <i className="min-w-[3px] rounded-full bg-(--b)" style={{ flex: total.b || 0.0001 }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// One player's side of a lane: hero with level, name, KDA, gold and the build so far.
function LanePlayer({ line, color, side }: { line?: Line; color: string; side: "a" | "b" }) {
  if (!line) return <div />;
  const ratio = ((line.kills + line.assists) / Math.max(1, line.deaths)).toFixed(1);
  const right = side === "b";
  const detail = [line.hero, line.damage != null ? `${formatViewerCount(line.damage)} dmg` : null].filter(Boolean).join(" · ");
  return (
    <div
      className={`grid min-w-0 items-center gap-x-3 gap-y-1.5 max-[640px]:gap-x-2 ${
        right
          ? "grid-cols-[minmax(0,1fr)_32px] text-right min-[641px]:grid-cols-[52px_64px_minmax(0,1fr)_40px]"
          : "grid-cols-[32px_minmax(0,1fr)] min-[641px]:grid-cols-[40px_minmax(0,1fr)_64px_52px]"
      }`}
    >
      <span className={`relative row-span-2 min-[641px]:row-span-1 ${right ? "col-start-2 min-[641px]:col-start-4" : ""}`}>
        <GameIcon src={line.heroIcon} name={line.hero ?? "?"} size={40} className="size-8 rounded-[10px] min-[641px]:size-10" tint={tint(color, 22)} />
        {line.level != null ? (
          <small className="absolute -bottom-1.5 -right-1.5 min-w-[19px] rounded-[10px] border-2 border-paper bg-ink px-1 text-center text-[10px] font-bold leading-[15px] text-paper">
            {line.level}
          </small>
        ) : null}
      </span>
      <span className={`min-w-0 ${right ? "col-start-1 row-start-1 min-[641px]:col-start-3" : ""}`}>
        <b className={`flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-ink ${right ? "justify-end" : ""}`}>
          {line.mvp && right ? <span className="rounded bg-deep-ember px-1 text-[10px] font-bold text-white">MVP</span> : null}
          <span className="truncate">{line.nickname}</span>
          {line.mvp && !right ? <span className="rounded bg-deep-ember px-1 text-[10px] font-bold text-white">MVP</span> : null}
        </b>
        <span className="block truncate text-caption text-pencil">{detail}</span>
      </span>
      <span
        aria-label={`${line.kills} kills, ${line.deaths} deaths, ${line.assists} assists`}
        className={`whitespace-nowrap font-graphik text-[13px] font-bold tabular-nums text-ink min-[641px]:text-center min-[641px]:text-[15px] ${
          right ? "col-start-1 row-start-2 min-[641px]:col-start-2 min-[641px]:row-start-1" : "col-start-2 row-start-2 min-[641px]:col-start-3 min-[641px]:row-start-1"
        }`}
      >
        {line.kills}/{line.deaths}/{line.assists}
        <small className="block font-body text-[11px] font-medium text-pencil max-[640px]:hidden">KDA {ratio}</small>
      </span>
      <span className={`text-sm font-semibold tabular-nums max-[640px]:hidden ${right ? "col-start-1 row-start-1 text-left" : "col-start-4 text-right"}`}>
        {formatViewerCount(line.gold)}
      </span>
      <span
        role="img"
        aria-label={line.items.length > 0 ? `Items: ${line.items.map((item) => item.name).join(", ")}` : "No items yet"}
        className={`col-span-full flex gap-[3px] ${right ? "justify-end min-[641px]:col-start-1 min-[641px]:col-end-4" : "min-[641px]:col-start-2 min-[641px]:col-end-5"}`}
      >
        {Array.from({ length: SLOTS }, (_, index) => {
          const item = line.items[index];
          return item ? (
            <GameIcon key={index} src={item.icon_url} name={item.name} size={24} className="size-[18px] rounded min-[641px]:size-6" tint={tint(color, 30)} />
          ) : (
            <i key={index} aria-hidden="true" className="size-[18px] rounded border border-dashed border-stone min-[641px]:size-6" />
          );
        })}
      </span>
    </div>
  );
}

// Lane by lane: each role's two players face each other across the gold difference.
function Lanes({
  linesA,
  linesB,
  teams,
  colors,
}: {
  linesA: Line[];
  linesB: Line[];
  teams: [TeamSummary | null | undefined, TeamSummary | null | undefined];
  colors: [string, string];
}) {
  const count = Math.max(linesA.length, linesB.length);
  if (count === 0) {
    return <p className="rounded-xl border border-stone bg-paper px-4 py-6 text-center text-sm text-pencil">No player stats yet.</p>;
  }
  return (
    <section aria-label="Lane by lane" className="overflow-hidden rounded-xl border border-stone bg-paper shadow-subtle">
      <div className="grid grid-cols-2 items-center gap-4 border-b border-stone px-[18px] py-3 font-graphik text-[15px] font-bold text-ink max-[640px]:px-3.5 min-[641px]:grid-cols-[minmax(0,1fr)_200px_minmax(0,1fr)]">
        <span className="flex min-w-0 items-center gap-2">
          <LogoMark source={teams[0]} size="sm" />
          <span className="truncate">{teams[0]?.name ?? "TBD"}</span>
        </span>
        <span className="text-center font-body text-caption font-semibold text-pencil max-[640px]:hidden">Lane by lane · gold difference</span>
        <span className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate">{teams[1]?.name ?? "TBD"}</span>
          <LogoMark source={teams[1]} size="sm" />
        </span>
      </div>
      <ul>
        {Array.from({ length: count }, (_, index) => {
          const a = linesA[index];
          const b = linesB[index];
          const diff = (a?.gold ?? 0) - (b?.gold ?? 0);
          const width = Math.min(50, (Math.abs(diff) / 2000) * 50);
          const leader = diff >= 0 ? 0 : 1;
          const role = a?.role ?? b?.role ?? null;
          return (
            <li
              key={a?.id ?? b?.id ?? index}
              className="grid grid-cols-2 items-center gap-x-3 gap-y-2.5 border-b border-[#eeecea] px-[18px] py-3 transition-colors last:border-b-0 hover:bg-[#fdfaf7] max-[640px]:px-3.5 min-[641px]:grid-cols-[minmax(0,1fr)_200px_minmax(0,1fr)] min-[641px]:gap-x-4"
            >
              <div className="col-span-full flex items-center gap-2.5 min-[641px]:col-span-1 min-[641px]:col-start-2 min-[641px]:row-start-1 min-[641px]:flex-col min-[641px]:gap-1.5">
                <span className="text-[11px] font-bold tracking-[0.06em] text-pencil">
                  {(role ? (LANE_NAMES[role] ?? ROLE_LABELS[role]) : `Lane ${index + 1}`).toUpperCase()}
                </span>
                <span aria-hidden="true" className="relative h-2 flex-1 rounded bg-[#f4f2ef] before:absolute before:-inset-y-[3px] before:left-1/2 before:w-px before:bg-stone min-[641px]:w-full min-[641px]:flex-none">
                  <i
                    className={`absolute inset-y-0 rounded motion-safe:animate-grow ${leader === 0 ? "origin-right" : "origin-left"}`}
                    style={{ left: leader === 0 ? `${50 - width}%` : "50%", width: `${width}%`, background: colors[leader] }}
                  />
                </span>
                <span className="text-caption font-semibold" style={{ color: `color-mix(in oklab, ${colors[leader]} 60%, var(--color-ink))` }}>
                  {diff === 0 ? "Even" : `${shortTeamName(teams[leader])} +${formatViewerCount(Math.abs(diff))}`}
                </span>
              </div>
              <LanePlayer line={a} color={colors[0]} side="a" />
              <LanePlayer line={b} color={colors[1]} side="b" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// One cell per game of the series (WAI-ARIA tabs): who won, how long, and a small gold-lead line.
function GameCells({
  match,
  games,
  selected,
  liveGame,
  onSelect,
}: {
  match: MatchDetail;
  games: MatchGame[];
  selected: number;
  liveGame: number | null;
  onSelect: (game: number) => void;
}) {
  const numbers = games.map((game) => game.game_number);
  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const index = numbers.indexOf(selected);
    const next =
      event.key === "ArrowRight"
        ? numbers[(index + 1) % numbers.length]
        : event.key === "ArrowLeft"
          ? numbers[(index - 1 + numbers.length) % numbers.length]
          : event.key === "Home"
            ? numbers[0]
            : event.key === "End"
              ? numbers[numbers.length - 1]
              : null;
    if (next == null) return;
    event.preventDefault();
    onSelect(next);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]")[numbers.indexOf(next)]?.focus();
  }
  const bestOf = match?.best_of ?? 1;
  const notPlayed = Array.from({ length: Math.max(0, bestOf - games.length) }, (_, index) => games.length + index + 1);
  return (
    <div className="mb-4 grid grid-cols-3 gap-3 max-[640px]:gap-2" style={{ gridTemplateColumns: `repeat(${bestOf}, minmax(0, 1fr))` }}>
      <div role="tablist" aria-label="Games" className="contents">
        {games.map((game) => {
          const live = game.game_number === liveGame;
          const winner = game.winner_team_id === match?.team_a?.id ? match?.team_a : game.winner_team_id === match?.team_b?.id ? match?.team_b : null;
          return (
            <button
              key={game.game_number}
              type="button"
              role="tab"
              id={`game-tab-${game.game_number}`}
              aria-selected={game.game_number === selected}
              aria-controls="game-panel"
              tabIndex={game.game_number === selected ? 0 : -1}
              onClick={() => onSelect(game.game_number)}
              onKeyDown={onKeyDown}
              className={`flex flex-col gap-2.5 rounded-[10px] border p-3.5 text-left transition-[border-color,box-shadow] hover:border-charcoal aria-selected:border-ink aria-selected:shadow-[inset_0_0_0_1px_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember max-[640px]:p-2.5 ${
                live ? "border-[#f0c4b8] bg-cream" : "border-stone bg-paper"
              }`}
            >
              <span className="flex items-center justify-between gap-2 text-[13px] text-pencil max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-0.5">
                <b className="font-graphik text-[15px] font-bold text-ink">Game {game.game_number}</b>
                {live ? (
                  <span className="inline-flex items-center gap-1.5 text-deep-ember">
                    <LiveDot />
                    Live
                  </span>
                ) : game.duration_seconds ? (
                  clock(game.duration_seconds)
                ) : null}
              </span>
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink max-[640px]:text-caption">
                {winner ? (
                  <>
                    <LogoMark source={winner} size="xs" />
                    <span className="truncate">{shortTeamName(winner)} won</span>
                  </>
                ) : (
                  <span className="text-pencil">{live ? "In progress" : "—"}</span>
                )}
              </span>
              <GameSpark match={match} game={game.game_number} live={live} />
            </button>
          );
        })}
      </div>
      {notPlayed.map((number) => (
        <div
          key={number}
          aria-hidden="true"
          className="flex flex-col gap-2.5 rounded-[10px] border border-dashed border-stone p-3.5 text-[13px] text-pencil max-[640px]:p-2.5"
        >
          <b className="font-graphik text-[15px] font-bold text-charcoal">Game {number}</b>
          If needed
        </div>
      ))}
    </div>
  );
}

function GameSpark({ match, game, live }: { match: MatchDetail; game: number; live: boolean }) {
  const economy = useMatchEconomy(match?.id ?? "", live, game);
  const snapshots = (economy.data ?? []).filter((snapshot) => snapshot?.game_number == null || snapshot.game_number === game);
  const first = snapshots.length ? Math.min(...snapshots.map((snapshot) => Date.parse(snapshot.recorded_at))) : 0;
  const points = leadPoints(snapshots, match?.team_a?.id, match?.team_b?.id, first);
  return <GoldSpark points={points} label={`Game ${game} gold lead`} className="max-[640px]:h-8" />;
}

function toSequencePlayer(line: Line): SequencePlayer {
  return {
    id: line.id,
    nickname: line.nickname,
    hero: line.hero,
    heroIcon: line.heroIcon,
    lane: line.role ? (LANE_NAMES[line.role] ?? ROLE_LABELS[line.role]) : "Lane",
  };
}

export function LiveStats({ match: initial }: { match: MatchDetail }) {
  const match = useLiveMatch(initial);
  const id = match?.id ?? "";
  const live = match?.status === "live";
  const { isVisible } = useSpoilers();

  const games = [...(match?.games ?? [])].sort((a, b) => a.game_number - b.game_number);
  const liveGame = live ? (games.find((game) => game.status === "live")?.game_number ?? match?.game_number ?? null) : null;
  const [picked, setPicked] = useState<number | null>(null);
  // A picked game that no longer exists (the series restarted) falls back.
  const pickedGame = games.find((game) => game.game_number === picked);
  const selected = pickedGame?.game_number ?? liveGame ?? games.at(-1)?.game_number;
  const game = games.find((row) => row.game_number === selected);
  const playing = live && selected != null && selected === liveGame;

  // A game being played has live data; a finished one has its statistics.
  const statistics = useMatchStatistics(id, !playing && match?.status !== "scheduled", selected);
  const snapshots = useMatchLiveStats(id, playing, selected);
  const equipment = useMatchEquipment(id, playing, selected);
  const events = useMatchEvents(id, playing, selected);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [playing]);

  const [colorA, colorB] = teamColors(match);
  const cutoff = playing ? now - holdBackMs(match) : Number.POSITIVE_INFINITY;
  const shown = (iso: string) => Date.parse(iso) <= cutoff;

  const allSnapshots = (snapshots.data ?? []).filter((s) => shown(s.recorded_at));
  const purchases = (equipment.data ?? []).filter((p) => shown(p.purchased_at));
  const moments = (events.data ?? []).filter((e) => shown(e.occurred_at));

  // Latest snapshot per player (the endpoint is an ordered series).
  const latest = new Map<string, PlayerSnapshot>();
  for (const snapshot of allSnapshots) latest.set(snapshot.player_id, snapshot);

  // Finished games: their statistics (real final build, emblem, talents).
  // The game being played: snapshots carry the player and hero (§19).
  const statisticsPlayers = playing ? [] : (statistics.data?.players ?? []);
  const lines = (teamId?: string): Line[] => {
    const rows: Line[] =
      statisticsPlayers.length > 0
        ? statisticsPlayers
            .filter((row) => row.team_id === teamId)
            .map((row) => ({
              id: row.player_id,
              nickname: row.player?.nickname ?? "Player",
              role: row.player?.role ?? null,
              hero: row.hero_picked || null,
              heroIcon: row.hero_icon_url ?? null,
              kills: row.kills,
              deaths: row.deaths,
              assists: row.assists,
              gold: row.gold,
              level: latest.get(row.player_id)?.level ?? null,
              damage: row.damage ?? null,
              emblem: row.emblem ?? null,
              talents: row.talents ?? [],
              items:
                row.items && row.items.length > 0
                  ? row.items.map((item) => ({ id: item.id, name: item.name, icon_url: item.icon_url }))
                  : inventoryOf(purchases.filter((p) => p.player_id === row.player_id)),
              mvp: row.mvp,
            }))
        : [...latest.values()]
            .filter((snap) => snap.team_id === teamId)
            .map((snap) => ({
              id: snap.player_id,
              nickname: snap.player?.nickname ?? "Player",
              role: snap.player?.role ?? null,
              hero: snap.hero ?? null,
              heroIcon: snap.hero_icon_url ?? null,
              kills: snap.kills,
              deaths: snap.deaths,
              assists: snap.assists,
              gold: snap.gold,
              level: snap.level ?? null,
              damage: null,
              emblem: null,
              talents: [],
              items: inventoryOf(purchases.filter((p) => p.player_id === snap.player_id)),
              mvp: false,
            }));
    return rows.sort((a, b) => ROLE_ORDER.indexOf(a.role ?? "flex") - ROLE_ORDER.indexOf(b.role ?? "flex"));
  };

  const linesA = lines(match?.team_a?.id);
  const linesB = lines(match?.team_b?.id);
  const sum = (rows: Line[], key: "kills" | "gold") => rows.reduce((total, line) => total + line[key], 0);
  const count = (teamId: string | undefined, type: string) =>
    moments.filter((event) => event.team_id === teamId && event.event_type === type).length;

  const startedAt = game?.started_at ? Date.parse(game.started_at) : null;
  const elapsed = playing && startedAt ? Math.max(0, (cutoff - startedAt) / 1000) : null;
  const duration = game?.duration_seconds ?? statistics.data?.teams[0]?.game_duration_seconds ?? null;
  const axisSeconds = playing ? Math.max(60, elapsed ?? 0) : (duration ?? 0);

  const nameA = shortTeamName(match?.team_a);
  const nameB = shortTeamName(match?.team_b);
  const heading =
    match?.status === "scheduled"
      ? "Stats appear when the match starts"
      : selected == null
        ? live
          ? `Game ${(match?.score_a ?? 0) + (match?.score_b ?? 0) + 1}`
          : "Final game"
        : `Game ${selected}${
            playing ? (elapsed != null ? `, at ${clock(elapsed)}` : "") : duration ? `, ${clock(duration)}` : ""
          }`;

  return (
    <section aria-labelledby="live-stats-title" className="pt-5 min-[901px]:pt-12">
      <Container size="watch">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div>
            <p className="text-caption font-semibold text-deep-ember">{playing ? "Live stats" : "Stats"}</p>
            {/* The game clock ticks from the visitor's clock, a second apart from the server's. */}
            <h2 id="live-stats-title" suppressHydrationWarning className="font-graphik text-[21px] font-bold leading-[1.3] text-ink">
              {match?.status !== "scheduled" && !isVisible(id) ? "This game" : heading}
            </h2>
          </div>
          {playing ? <p className="text-[13px] text-pencil">Held back {Math.round(holdBackMs(match) / 1000)} seconds to match the stream</p> : null}
        </div>

        {match?.status === "scheduled" ? null : !isVisible(id) ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-xl border border-stone bg-paper p-6 text-center text-[13px] text-pencil">
            <b className="font-graphik text-base text-ink">{live ? "Live stats are hidden" : "Stats are hidden"}</b>
            <span>Gold, kills and objectives would give away how the game is going.</span>
            <RevealButton matchId={id}>Show for this match</RevealButton>
          </div>
        ) : (
          <>
            {games.length > 0 && selected != null ? (
              <GameCells match={match} games={games} selected={selected} liveGame={liveGame} onSelect={setPicked} />
            ) : null}
            <div
              id="game-panel"
              {...(games.length > 0 && selected != null
                ? { role: "tabpanel", "aria-labelledby": `game-tab-${selected}` }
                : {})}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-4" style={{ ["--a" as string]: colorA, ["--b" as string]: colorB }}>
                <Scoreboard
                  totals={[
                    {
                      label: "Gold",
                      a: sum(linesA, "gold"),
                      b: sum(linesB, "gold"),
                      format: formatViewerCount,
                      badge:
                        sum(linesA, "gold") === sum(linesB, "gold")
                          ? undefined
                          : `${sum(linesA, "gold") > sum(linesB, "gold") ? nameA : nameB} +${formatViewerCount(Math.abs(sum(linesA, "gold") - sum(linesB, "gold")))}`,
                    },
                    { label: "Kills", a: sum(linesA, "kills"), b: sum(linesB, "kills") },
                    { label: "Towers", a: count(match?.team_a?.id, "tower"), b: count(match?.team_b?.id, "tower") },
                    { label: "Turtles", a: count(match?.team_a?.id, "turtle"), b: count(match?.team_b?.id, "turtle") },
                    { label: "Lords", a: count(match?.team_a?.id, "lord"), b: count(match?.team_b?.id, "lord") },
                  ]}
                />
                <Lanes linesA={linesA} linesB={linesB} teams={[match?.team_a, match?.team_b]} colors={[colorA, colorB]} />
              </div>

              {startedAt != null && purchases.length > 0 ? (
                <ItemSequence
                  playersA={linesA.map(toSequencePlayer)}
                  playersB={linesB.map(toSequencePlayer)}
                  purchases={purchases}
                  events={moments}
                  startedAt={startedAt}
                  axisSeconds={axisSeconds}
                  colors={[colorA, colorB]}
                  teamIds={[match?.team_a?.id, match?.team_b?.id]}
                  names={[nameA, nameB]}
                />
              ) : null}
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
