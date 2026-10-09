"use client";

import { useEffect, useState } from "react";

import { clock, holdBackMs } from "@/components/match/GoldLead";
import { GameIcon } from "@/components/match/GameIcon";
import { ItemTimeline } from "@/components/match/ItemTimeline";
import { RevealButton } from "@/components/spoiler/Spoiler";
import { useSpoilers } from "@/components/spoiler/SpoilerProvider";
import { Container } from "@/components/ui/Container";
import { LiveDot } from "@/components/ui/LiveDot";
import { LogoMark } from "@/components/ui/LogoMark";
import {
  useMatchEquipment,
  useMatchEvents,
  useMatchLiveStats,
  useMatchStatistics,
} from "@/lib/api/endpoints";
import type { GameAsset, MatchDetail, PlayerRole, PlayerSnapshot, TeamSummary } from "@/lib/api/types";
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
              className="grid grid-cols-[36px_minmax(0,1fr)_58px_46px] items-center gap-x-2.5 gap-y-1.5 border-b border-stone/50 px-3.5 py-2.5 text-sm last:border-b-0 min-[641px]:grid-cols-[44px_36px_minmax(0,1fr)_64px_50px] min-[641px]:px-4"
            >
              <span className="text-[11px] font-bold tracking-[0.04em] text-pencil max-[640px]:hidden">
                {line.role ? ROLE_LABELS[line.role] : ""}
              </span>
              <span className="relative">
                <GameIcon src={line.heroIcon} name={line.hero ?? "?"} size={36} className="rounded-lg" tint={tint(color, 22)} />
                {line.emblem ? (
                  <GameIcon
                    src={line.emblem.icon_url}
                    name={line.emblem.name}
                    size={16}
                    className="absolute -right-1 -bottom-1 rounded-full border border-paper"
                  />
                ) : null}
              </span>
              <p className="min-w-0">
                <b className="flex items-center gap-1.5 truncate font-semibold">
                  {line.nickname}
                  {line.mvp ? (
                    <span className="rounded bg-deep-ember px-1 text-[10px] font-bold text-white">MVP</span>
                  ) : null}
                </b>
                <small className="block truncate text-caption text-pencil">
                  {[
                    line.hero,
                    line.level != null ? `Lv ${line.level}` : null,
                    line.damage != null ? `${formatViewerCount(line.damage)} dmg` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </p>
              <span className="text-right font-semibold tabular-nums" aria-label={`${line.kills} kills, ${line.deaths} deaths, ${line.assists} assists`}>
                {line.kills}/{line.deaths}/{line.assists}
              </span>
              <span className="text-right tabular-nums text-charcoal">{formatViewerCount(line.gold)}</span>
              <span className="col-start-2 col-end-[-1] flex flex-wrap items-center gap-[3px] min-[641px]:col-start-3">
                <span
                  className="flex gap-[3px]"
                  role="img"
                  aria-label={line.items.length > 0 ? `Items: ${line.items.map((item) => item.name).join(", ")}` : "No items yet"}
                >
                  {Array.from({ length: SLOTS }, (_, index) => {
                    const item = line.items[index];
                    return item ? (
                      <GameIcon key={index} src={item.icon_url} name={item.name} size={20} className="rounded" tint={tint(color, 30)} />
                    ) : (
                      <i key={index} aria-hidden="true" className="size-5 rounded border border-dashed border-stone" />
                    );
                  })}
                </span>
                {line.talents.length > 0 ? (
                  <span
                    className="ml-1.5 flex gap-[3px]"
                    role="img"
                    aria-label={`Emblem: ${line.emblem?.name ?? "unknown"}; talents: ${line.talents.map((t) => t.name).join(", ")}`}
                  >
                    {line.talents.map((talent) => (
                      <GameIcon key={talent.id} src={talent.icon_url} name={talent.name} size={16} className="rounded-full" />
                    ))}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Game 1 · Game 2 · …: one tab per game of the series (WAI-ARIA tabs). */
function GameTabs({
  games,
  selected,
  liveGame,
  onSelect,
}: {
  games: number[];
  selected: number;
  liveGame: number | null;
  onSelect: (game: number) => void;
}) {
  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const index = games.indexOf(selected);
    const next =
      event.key === "ArrowRight"
        ? games[(index + 1) % games.length]
        : event.key === "ArrowLeft"
          ? games[(index - 1 + games.length) % games.length]
          : event.key === "Home"
            ? games[0]
            : event.key === "End"
              ? games[games.length - 1]
              : null;
    if (next == null) return;
    event.preventDefault();
    onSelect(next);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]")[games.indexOf(next)]?.focus();
  }
  return (
    <div role="tablist" aria-label="Games" className="mb-4 flex gap-1.5">
      {games.map((game) => (
        <button
          key={game}
          type="button"
          role="tab"
          id={`game-tab-${game}`}
          aria-selected={game === selected}
          aria-controls="game-panel"
          tabIndex={game === selected ? 0 : -1}
          onClick={() => onSelect(game)}
          onKeyDown={onKeyDown}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-stone px-4 font-graphik text-sm font-bold text-pencil transition-colors hover:text-ink aria-selected:border-ink aria-selected:bg-ink aria-selected:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
        >
          Game {game}
          {game === liveGame ? (
            <>
              <LiveDot />
              <span className="sr-only">(live)</span>
            </>
          ) : null}
        </button>
      ))}
    </div>
  );
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
            <h2 id="live-stats-title" className="font-graphik text-[21px] font-bold leading-[1.3] text-ink">
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
            {games.length > 1 && selected != null ? (
              <GameTabs games={games.map((row) => row.game_number)} selected={selected} liveGame={liveGame} onSelect={setPicked} />
            ) : null}
            <div
              id="game-panel"
              {...(games.length > 1 && selected != null
                ? { role: "tabpanel", "aria-labelledby": `game-tab-${selected}` }
                : {})}
              className="flex flex-col gap-4"
            >
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

              {startedAt != null && purchases.length > 0 ? (
                <section aria-labelledby="item-sequence-title">
                  <h3 id="item-sequence-title" className="mb-2.5 font-graphik text-base font-bold text-ink">
                    Item sequence
                  </h3>
                  <ItemTimeline
                    players={[...linesA.map((line) => ({ line, color: colorA })), ...linesB.map((line) => ({ line, color: colorB }))].map(
                      ({ line, color }) => ({
                        id: line.id,
                        nickname: line.nickname,
                        hero: line.hero,
                        heroIcon: line.heroIcon,
                        color: tint(color, 22),
                      }),
                    )}
                    purchases={purchases}
                    startedAt={startedAt}
                    axisSeconds={axisSeconds}
                  />
                </section>
              ) : null}
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
