"use client";

import { useEffect, useId, useRef, useState } from "react";

import { useMatchLanguage } from "@/components/home/MatchLanguage";
import { HiddenValue, RevealButton } from "@/components/spoiler/Spoiler";
import { useSpoilers } from "@/components/spoiler/SpoilerProvider";
import { LogoMark } from "@/components/ui/LogoMark";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useMatchEconomy, useMatchEvents } from "@/lib/api/endpoints";
import type { MatchSummary } from "@/lib/api/types";
import { formatBroadcastLanguage, formatViewerCount, shortTeamName } from "@/lib/utils/format";
import { seriesInfo } from "@/lib/utils/series";

// Data newer than this is held back so the panel never runs ahead of the
// stream. The real delay is not in the API yet, so this is an assumption.
const HOLD_BACK_MS = 30_000;
const TICK_MS = 5_000;

interface LeadPoint {
  seconds: number;
  lead: number;
}

// Match clock: time since the first recorded snapshot or event.
function clock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function goldLabel(lead: number): string {
  return `+${formatViewerCount(Math.abs(lead))}`;
}

interface ChartProps {
  points: LeadPoint[];
  nameA: string;
  nameB: string;
}

const HEIGHT = 150;
const PAD_TOP = 8;
const PAD_BOTTOM = 22;

function GoldLeadChart({ points, nameA, nameB }: ChartProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId().replace(/:/g, "");

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width) || 600);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const last = points[points.length - 1];
  const maxSeconds = Math.max(last?.seconds ?? 0, 60);
  const maxAbs = Math.max(...points.map((point) => Math.abs(point.lead)), 0);
  const yMax = Math.max(2000, Math.ceil((maxAbs * 1.15) / 1000) * 1000);

  const x = (seconds: number) => (seconds / maxSeconds) * width;
  const y = (lead: number) =>
    PAD_TOP + (1 - (lead + yMax) / (2 * yMax)) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
  const zero = y(0);

  const line = points
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${x(point.seconds).toFixed(1)} ${y(point.lead).toFixed(1)}`,
    )
    .join("");
  const area = `${line}L${x(last?.seconds ?? 0).toFixed(1)} ${zero}L0 ${zero}Z`;

  const ticks = [0, 1 / 3, 2 / 3, 1].map((share) => share * maxSeconds);
  const active = hover != null ? points[hover] : null;

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const seconds = ((event.clientX - rect.left) / rect.width) * maxSeconds;
    let nearest = 0;
    points.forEach((point, index) => {
      if (Math.abs(point.seconds - seconds) < Math.abs((points[nearest]?.seconds ?? 0) - seconds)) {
        nearest = index;
      }
    });
    setHover(nearest);
  }

  const leader = (lead: number) => (lead >= 0 ? nameA : nameB);

  return (
    <div ref={boxRef} className="relative">
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`Gold difference over the match. ${leader(last?.lead ?? 0)} leads by ${Math.abs(last?.lead ?? 0).toLocaleString("en-US")} gold at ${clock(last?.seconds ?? 0)}.`}
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
        className="block h-[150px] w-full touch-pan-y"
      >
        <defs>
          <clipPath id={`${clipId}-above`}>
            <rect x="0" y="0" width={width} height={zero} />
          </clipPath>
          <clipPath id={`${clipId}-below`}>
            <rect x="0" y={zero} width={width} height={HEIGHT - zero} />
          </clipPath>
        </defs>
        <line x1="0" x2={width} y1={zero} y2={zero} stroke="var(--color-stone)" strokeWidth="1" />
        <path d={area} fill="#fde2d6" clipPath={`url(#${clipId}-above)`} />
        <path d={area} fill="var(--color-sky-wash)" clipPath={`url(#${clipId}-below)`} />
        <path
          d={line}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text x="4" y={PAD_TOP + 10} className="fill-pencil text-[11px]">
          {nameA} ahead
        </text>
        <text x="4" y={HEIGHT - PAD_BOTTOM - 4} className="fill-pencil text-[11px]">
          {nameB} ahead
        </text>
        {ticks.map((seconds, index) => (
          <text
            key={seconds}
            x={index === ticks.length - 1 ? width : x(seconds)}
            y={HEIGHT - 4}
            textAnchor={index === ticks.length - 1 ? "end" : "start"}
            className="fill-pencil text-[11px]"
          >
            {clock(seconds)}
          </text>
        ))}
        {last ? (
          <circle
            cx={x(last.seconds)}
            cy={y(last.lead)}
            r="4"
            fill="var(--color-ink)"
            stroke="var(--color-paper)"
            strokeWidth="2"
          />
        ) : null}
        {active ? (
          <line
            x1={x(active.seconds)}
            x2={x(active.seconds)}
            y1={PAD_TOP}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="var(--color-graphite)"
            strokeWidth="1"
          />
        ) : null}
      </svg>
      {active ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2 py-1.5 text-caption text-paper"
          style={{
            left: Math.min(width - 80, Math.max(80, x(active.seconds))),
            top: y(active.lead) - 10,
          }}
        >
          {clock(active.seconds)} ·{" "}
          {active.lead === 0 ? "even" : `${leader(active.lead)} ${goldLabel(active.lead)} gold`}
        </div>
      ) : null}
    </div>
  );
}

export function MatchCenterPanel({ match }: { match: MatchSummary }) {
  const matchId = match?.id ?? "";
  const nameA = match?.team_a?.name ?? "TBD";
  const nameB = match?.team_b?.name ?? "TBD";
  const shortA = shortTeamName(nameA);
  const shortB = shortTeamName(nameB);
  // Full names from 641px up, short ones on phones where the line is tight.
  const teamName = (full: string, brief: string) => (
    <>
      <span className="min-[641px]:hidden">{brief}</span>
      <span className="max-[640px]:hidden">{full}</span>
    </>
  );

  const { isVisible } = useSpoilers();
  const visible = isVisible(matchId);
  const toast = useToast();
  const { language, setLanguage } = useMatchLanguage();
  const economy = useMatchEconomy(matchId, true);
  const events = useMatchEvents(matchId, true);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const cutoff = now - HOLD_BACK_MS;
  const snapshots = (economy.data ?? []).filter(
    (snapshot) => Date.parse(snapshot?.recorded_at ?? "") <= cutoff,
  );
  const moments = (events.data ?? []).filter(
    (event) => Date.parse(event?.occurred_at ?? "") <= cutoff,
  );

  const times = [
    ...snapshots.map((snapshot) => Date.parse(snapshot.recorded_at)),
    ...moments.map((event) => Date.parse(event.occurred_at)),
  ].filter(Number.isFinite);
  const origin = times.length > 0 ? Math.min(...times) : 0;

  // Gold lead of team A over team B at each snapshot time.
  const goldByTime = new Map<number, { a?: number; b?: number }>();
  for (const snapshot of snapshots) {
    const time = Date.parse(snapshot.recorded_at);
    const entry = goldByTime.get(time) ?? {};
    if (snapshot.team_id === match?.team_a?.id) entry.a = snapshot.gold;
    if (snapshot.team_id === match?.team_b?.id) entry.b = snapshot.gold;
    goldByTime.set(time, entry);
  }
  const points: LeadPoint[] = [];
  let lastA: number | undefined;
  let lastB: number | undefined;
  for (const time of [...goldByTime.keys()].sort((a, b) => a - b)) {
    const entry = goldByTime.get(time);
    lastA = entry?.a ?? lastA;
    lastB = entry?.b ?? lastB;
    if (lastA != null && lastB != null) {
      points.push({ seconds: (time - origin) / 1000, lead: lastA - lastB });
    }
  }
  const latest = points[points.length - 1];

  const keyMoments = [...moments]
    .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))
    .slice(0, 3);

  const game = match?.game_number ?? seriesInfo(match)?.game;
  const hasScore = match?.score_a != null && match?.score_b != null;
  const broadcasts = match?.broadcasts ?? [];
  const totalViewers = broadcasts.reduce((sum, item) => sum + (item?.viewer_count ?? 0), 0);
  const loading = economy.isLoading || events.isLoading;

  return (
    <div className="rounded-lg border border-stone bg-paper p-4 shadow-subtle min-[641px]:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-stone/50 pb-4">
        <div className="flex items-center gap-2.5 whitespace-nowrap font-graphik text-[17px] font-bold">
          <LogoMark source={match?.team_a} size="sm" />
          {teamName(nameA, shortA)}
          {hasScore ? (
            <span className="px-1 tabular-nums">
              {visible ? `${match.score_a}–${match.score_b}` : <HiddenValue>0–0</HiddenValue>}
            </span>
          ) : (
            <span className="px-1 text-pencil">vs</span>
          )}
          {teamName(nameB, shortB)}
          <LogoMark source={match?.team_b} size="sm" />
        </div>
        <span className="text-[13px] text-pencil">
          {visible && game ? `Game ${game} · ` : ""}
          {latest ? `${clock(latest.seconds)} · ` : ""}Synced to stream
        </span>
      </div>

      {visible ? (
        <div className="pt-[18px]">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">Gold lead{game ? `, Game ${game}` : ""}</h3>
            {latest ? (
              <span className="font-graphik text-[21px] font-bold">
                {latest.lead === 0
                  ? "Even"
                  : `${latest.lead > 0 ? shortA : shortB} ${goldLabel(latest.lead)}`}
                <small className="ml-1.5 font-body text-[13px] font-medium text-pencil">
                  at {clock(latest.seconds)}
                </small>
              </span>
            ) : null}
          </div>
          {loading ? (
            <Skeleton bg="bg-stone/40" className="h-[150px] w-full" />
          ) : points.length > 1 ? (
            <GoldLeadChart points={points} nameA={nameA} nameB={nameB} />
          ) : (
            <p className="grid h-[150px] place-items-center rounded-lg bg-ink/[0.03] px-4 text-center text-sm text-pencil">
              The gold lead appears once snapshots are recorded.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 flex min-h-[150px] flex-col items-center justify-center gap-2.5 rounded-lg bg-ink/[0.03] p-4 text-center text-sm text-pencil">
          <b className="font-graphik text-[17px] text-ink">Scores and events are hidden</b>
          <span>The gold lead and key moments would give away how the game is going.</span>
          <RevealButton matchId={matchId} size="md">
            Show for this match
          </RevealButton>
        </div>
      )}

      {visible || broadcasts.length > 0 ? (
        <div
          className={`mt-5 grid gap-5 border-t border-stone/50 pt-5 min-[641px]:gap-6 ${
            visible && broadcasts.length > 0
              ? "min-[641px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
              : ""
          }`}
        >
          {visible ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Key moments</h3>
              {keyMoments.length > 0 ? (
                <ol className="flex flex-col">
                  {keyMoments.map((event) => (
                    <li
                      key={event.id}
                      className="grid grid-cols-[48px_1fr] gap-2 border-b border-stone/50 py-[9px] text-sm last:border-b-0"
                    >
                      <time className="text-[13px] text-pencil">
                        {clock((Date.parse(event.occurred_at) - origin) / 1000)}
                      </time>
                      <span>{event.title}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-pencil">Key moments appear here as the match goes on.</p>
              )}
            </div>
          ) : null}

          {broadcasts.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Commentary</h3>
              <div
                role="group"
                aria-label="Commentary language"
                className="flex gap-2 overflow-x-auto [scrollbar-width:none] max-[640px]:-mx-4 max-[640px]:px-4 min-[641px]:flex-col"
              >
                {broadcasts.map((item) => {
                  const share = totalViewers > 0 ? (item.viewer_count / totalViewers) * 100 : 0;
                  const label = formatBroadcastLanguage(item.language);
                  return (
                    <button
                      key={item.language}
                      type="button"
                      aria-pressed={language === item.language}
                      onClick={() => {
                        setLanguage(item.language);
                        toast(`Switched commentary to ${label}.`);
                      }}
                      className="grid shrink-0 grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1.5 rounded-lg border border-stone px-3 py-[9px] text-left text-sm transition-colors hover:border-charcoal aria-pressed:border-ink aria-pressed:shadow-[inset_0_0_0_1px_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
                    >
                      <span className="font-medium">{label}</span>
                      <small className="text-xs text-pencil">
                        {formatViewerCount(item.viewer_count)}
                      </small>
                      <span
                        aria-hidden="true"
                        className="relative col-span-2 h-[3px] overflow-hidden rounded-full bg-stone/50 max-[640px]:hidden"
                      >
                        <span
                          className="absolute inset-y-0 left-0 rounded-full bg-charcoal"
                          style={{ width: `${share}%` }}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
