"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/Badge";
import { LiveDot } from "@/components/ui/LiveDot";
import { LogoMark } from "@/components/ui/LogoMark";
import type { MatchSummary, TicketAvailability } from "@/lib/api/types";
import { dateKey, useTimeZone } from "@/lib/hooks/useTimeZone";
import { shortTeamName } from "@/lib/utils/format";
import { teamColors } from "@/lib/utils/team-colors";

interface ScheduleRundownProps {
  live: MatchSummary[];
  upcoming: Array<MatchSummary & { ticket?: TicketAvailability | null }>;
}

const HOUR = 3_600_000;
const LANE_PX = 86;
const TOP_PX = 36;
// The current minute, ticking. Null on the server: the timeline depends on
// the visitor's clock and zone, so it renders after hydration only.
function subscribeMinute(callback: () => void) {
  const timer = setInterval(callback, 30_000);
  return () => clearInterval(timer);
}
function useNow(): number | null {
  return useSyncExternalStore(subscribeMinute, () => Math.floor(Date.now() / 60_000) * 60_000, () => null);
}

/** A best-of-N takes about 40 minutes a game on the timeline. */
const blockMs = (match: MatchSummary) => (match?.best_of ?? 1) * 40 * 60_000;
const startOf = (match: MatchSummary) => Date.parse(match?.started_at ?? match?.scheduled_at ?? "");

interface Block {
  match: MatchSummary & { ticket?: TicketAvailability | null };
  start: number;
  end: number;
  live: boolean;
  day: number;
  lane: number;
}

interface Day {
  key: string;
  from: number;
  to: number;
}

function clock(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(ms);
}

function dayTitle(key: string, timeZone: string, now: number): string {
  if (key === dateKey(new Date(now), timeZone)) return "Today";
  if (key === dateKey(new Date(now + 24 * HOUR), timeZone)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));
}

function daySubtitle(key: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${key}T12:00:00Z`),
  );
}

function startsIn(ms: number, now: number): string {
  const minutes = Math.max(0, Math.round((ms - now) / 60_000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `In ${hours}h ${String(minutes % 60).padStart(2, "0")}m` : `In ${minutes}m`;
}

/**
 * Today and the next match day as one time ruler, with a "now" needle: live
 * matches straddle it, upcoming ones wait to its right. Each day gets the
 * same width, from an hour before its first match to after its last. On
 * phones it reads top to bottom as a run sheet.
 */
export function ScheduleRundown({ live, upcoming }: ScheduleRundownProps) {
  const timeZone = useTimeZone();
  const minute = useNow();
  if (minute === null) {
    return <div aria-hidden="true" className="h-[300px] rounded-lg border border-stone bg-paper shadow-subtle" />;
  }
  const now = minute;

  const all = [
    ...live.map((match) => ({ match, live: true })),
    ...upcoming.map((match) => ({ match, live: false })),
  ]
    .map((item) => ({ ...item, start: startOf(item.match) }))
    .filter((item) => !Number.isNaN(item.start))
    .sort((a, b) => a.start - b.start);

  // A live series runs at least half an hour past now on the ruler.
  const endOf = (item: { match: MatchSummary; live: boolean; start: number }) =>
    Math.max(item.start + blockMs(item.match), item.live ? now + 30 * 60_000 : 0);

  // At most two match days: today (with whatever is live) and the next one.
  const dayKeys: string[] = [];
  for (const item of all) {
    const key = dateKey(new Date(item.start), timeZone);
    if (!dayKeys.includes(key)) dayKeys.push(key);
  }
  const shownKeys = dayKeys.slice(0, 2);
  const items = all.filter((item) => shownKeys.includes(dateKey(new Date(item.start), timeZone)));

  const days: Day[] = shownKeys.map((key) => {
    const inDay = items.filter((item) => dateKey(new Date(item.start), timeZone) === key);
    const first = Math.min(...inDay.map((item) => item.start));
    const last = Math.max(...inDay.map((item) => endOf(item)));
    const from = Math.floor((first - HOUR) / HOUR) * HOUR;
    // At least six hours wide, so a single match still reads as a block.
    const to = Math.max(Math.ceil((last + HOUR) / HOUR) * HOUR, from + 6 * HOUR);
    return { key, from, to };
  });

  // Overlapping matches go to the next lane down.
  const laneEnds: number[][] = days.map(() => []);
  const blocks: Block[] = items.map((item) => {
    const day = shownKeys.indexOf(dateKey(new Date(item.start), timeZone));
    const ends = laneEnds[day] ?? [];
    let lane = ends.findIndex((end) => end <= item.start);
    if (lane === -1) lane = ends.length;
    ends[lane] = endOf(item);
    return { match: item.match, start: item.start, end: endOf(item), live: item.live, day, lane };
  });
  const lanes = Math.max(1, ...blocks.map((block) => block.lane + 1));
  const share = 100 / Math.max(1, days.length);
  const x = (day: number, ms: number) => {
    const d = days[day];
    if (!d) return 0;
    return day * share + ((ms - d.from) / (d.to - d.from)) * share;
  };

  const ticks = days.flatMap((day, index) => {
    const out: Array<{ left: number; label: string }> = [];
    for (let t = day.from; t < day.to; t += 2 * HOUR) out.push({ left: x(index, t), label: clock(t, timeZone) });
    return out;
  });
  const today = days[0] && days[0].key === dateKey(new Date(now), timeZone) && now >= days[0].from && now <= days[0].to;
  const nextUpcoming = blocks.find((block) => !block.live);

  // Phone order: live first, then the needle, then what is coming.
  const nowIndex = blocks.findIndex((block) => !block.live);
  const showNeedle = today || blocks.some((block) => block.live);

  return (
    <div className="rounded-lg border border-stone bg-paper px-6 pb-6 pt-5 shadow-subtle max-[640px]:px-4 max-[640px]:pb-4 max-[640px]:pt-2">
      <div className="mb-1.5 grid max-[640px]:hidden" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((day, index) => (
          <p key={day.key} className={`flex items-baseline gap-2.5 pb-2 ${index > 0 ? "pl-4" : ""}`}>
            <b className="font-graphik text-[19px] font-bold leading-snug text-ink">{dayTitle(day.key, timeZone, now)}</b>
            <span className="text-[13px] text-pencil">{daySubtitle(day.key)}</span>
          </p>
        ))}
      </div>
      <div aria-hidden="true" className="relative h-[22px] border-b border-stone text-[11px] text-pencil max-[640px]:hidden">
        {ticks.map((tick) => (
          <span key={`${tick.left}`} className="absolute top-0 border-l border-stone pl-[5px] leading-5" style={{ left: `${tick.left}%` }}>
            {tick.label}
          </span>
        ))}
      </div>

      <ol
        aria-label="Live and upcoming matches"
        className="relative flex flex-col gap-2.5 pt-2 min-[641px]:block min-[641px]:h-(--rundown-h) min-[641px]:pt-0 min-[641px]:[background-image:linear-gradient(to_right,#eeecea_1px,transparent_1px)] min-[641px]:[background-size:calc(100%/6)_100%]"
        style={{ ["--rundown-h" as string]: `${TOP_PX + lanes * LANE_PX}px` }}
      >
        {days.length > 1 ? (
          <li aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-stone max-[640px]:hidden" />
        ) : null}
        {blocks.map((block, index) => {
          const match = block.match;
          const [colorA, colorB] = teamColors(match);
          const ticket = match?.ticket?.on_sale ? match.ticket : null;
          const left = ticket?.quota_remaining ?? 0;
          const total = ticket?.quota_total ?? 0;
          const when = `${dayTitle(shownKeys[block.day] ?? "", timeZone, now)} ${clock(block.start, timeZone)}`;
          return (
            <WithNeedle key={match?.id ?? index} needle={showNeedle && index === nowIndex} now={now} left={x(0, now)} timeZone={timeZone}>
              <li
                className="relative min-[641px]:absolute min-[641px]:left-(--l) min-[641px]:top-(--t) min-[641px]:h-[76px] min-[641px]:w-(--w)"
                style={{
                  ["--l" as string]: `calc(${x(block.day, block.start)}% + 3px)`,
                  ["--w" as string]: `max(176px, calc(${x(block.day, block.end) - x(block.day, block.start)}% - 6px))`,
                  ["--t" as string]: `${TOP_PX + block.lane * LANE_PX}px`,
                }}
              >
                <div
                  className={`relative flex h-full flex-col justify-center gap-[5px] overflow-hidden rounded-lg border px-3 pb-[9px] pt-2.5 transition-[border-color,box-shadow] hover:border-charcoal hover:shadow-[0_10px_24px_-16px_rgb(37_34_30/0.4)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-deep-ember ${
                    block.live ? "border-[#f0c4b8] bg-cream" : "border-stone bg-paper"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{ background: `linear-gradient(90deg, ${colorA} 50%, ${colorB} 50%)` }}
                  />
                  <span className="flex items-center justify-between gap-2 text-caption text-pencil">
                    <span className="truncate">
                      <span className="min-[641px]:hidden">{dayTitle(shownKeys[block.day] ?? "", timeZone, now)} </span>
                      {clock(block.start, timeZone)} · Bo{match?.best_of ?? 1}
                    </span>
                    {block.live ? (
                      <Badge tone="ember" size="xs">
                        <LiveDot />
                        Live
                      </Badge>
                    ) : block === nextUpcoming ? (
                      <Badge tone="blue" size="xs">
                        {startsIn(block.start, now)}
                      </Badge>
                    ) : null}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap font-graphik text-sm font-bold text-ink">
                    <LogoMark source={match?.team_a} size="xs" />
                    <span className="min-w-0 truncate">
                      {shortTeamName(match?.team_a)}
                      <span className="px-1.5 font-body text-caption font-normal text-pencil">vs</span>
                      {shortTeamName(match?.team_b)}
                    </span>
                    <LogoMark source={match?.team_b} size="xs" />
                  </span>
                  {ticket ? (
                    <span className="flex items-center gap-2 text-[11px] text-charcoal">
                      <span aria-hidden="true" className="relative h-1 flex-1 overflow-hidden rounded-sm bg-[#f3ddd2]">
                        <span
                          className="absolute inset-y-0 left-0 rounded-sm bg-deep-ember"
                          style={{ width: `${total > 0 ? Math.round(((total - left) / total) * 100) : 0}%` }}
                        />
                      </span>
                      {left.toLocaleString("en-US")} seats left
                    </span>
                  ) : null}
                  <Link href={`/matches/${match?.id ?? ""}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                    <span className="sr-only">
                      {match?.team_a?.name ?? "TBD"} vs {match?.team_b?.name ?? "TBD"}, {when}
                      {block.live ? ", live now" : ""}
                    </span>
                  </Link>
                </div>
              </li>
            </WithNeedle>
          );
        })}
        {showNeedle && nowIndex === -1 ? <Needle left={x(0, now)} label={`Now · ${clock(now, timeZone)}`} /> : null}
      </ol>

      <p aria-hidden="true" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-pencil">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-[3px] bg-cream shadow-[inset_0_0_0_1px_#f0c4b8]" />
          On air now
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-[3px] bg-paper shadow-[inset_0_0_0_1px_var(--color-stone)]" />
          Coming up
        </span>
        <span>Top edge: team colours</span>
      </p>
    </div>
  );
}

function Needle({ left, label }: { left: number; label: string }) {
  return (
    <li
      aria-hidden="true"
      className="relative my-2 h-0.5 bg-ember-red min-[641px]:absolute min-[641px]:inset-y-0 min-[641px]:-bottom-2 min-[641px]:left-(--x) min-[641px]:z-[3] min-[641px]:my-0 min-[641px]:-ml-px min-[641px]:h-auto min-[641px]:w-0.5"
      style={{ ["--x" as string]: `${left}%` }}
    >
      <span className="absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-deep-ember px-2 py-0.5 text-[11px] font-semibold text-paper min-[641px]:-top-[30px] min-[641px]:left-1/2 min-[641px]:-translate-x-1/2 min-[641px]:translate-y-0">
        {label}
      </span>
    </li>
  );
}

// The needle sits before the first upcoming match, so phones read live → now → next.
function WithNeedle({
  needle,
  now,
  left,
  timeZone,
  children,
}: {
  needle: boolean;
  now: number;
  left: number;
  timeZone: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {needle ? <Needle left={left} label={`Now · ${clock(now, timeZone)}`} /> : null}
      {children}
    </>
  );
}
