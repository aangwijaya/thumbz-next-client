import type { MatchSummary, TicketAvailability } from "@/lib/api/types";
import { dateKey } from "@/lib/hooks/useTimeZone";

export const HOUR = 3_600_000;

const MINUTE = 60_000;
// A series that says "live" after this long is stale data; keep it out of the
// rundown rather than stretching a past day across the calendar.
const MAX_LIVE_AGE = 12 * HOUR;
const TICK_STEP = 2 * HOUR;
const MIN_WINDOW = 6 * HOUR;

export type RundownMatch = MatchSummary & { ticket?: TicketAvailability | null };

export interface Block {
  match: RundownMatch;
  start: number;
  end: number;
  /** Horizontal position of the block on the ruler, as a percentage. */
  left: number;
  right: number;
  live: boolean;
  day: number;
  lane: number;
}

export interface Day {
  key: string;
  from: number;
  to: number;
}

export interface Tick {
  left: number;
  label: string;
}

export interface Rundown {
  days: Day[];
  blocks: Block[];
  ticks: Tick[];
  lanes: number;
  /** The visitor's "now" on the ruler, or null when no shown day contains it. */
  needle: { day: number; left: number } | null;
}

interface Item {
  match: RundownMatch;
  live: boolean;
  start: number;
}

/** A best-of-N takes about 40 minutes a game on the timeline. */
export function blockMs(match: MatchSummary): number {
  return (match?.best_of ?? 1) * 40 * MINUTE;
}

export function startOf(match: MatchSummary): number {
  return Date.parse(match?.started_at ?? match?.scheduled_at ?? "");
}

export function clock(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone }).format(ms);
}

export function dayTitle(key: string, timeZone: string, now: number): string {
  if (key === dateKey(new Date(now), timeZone)) return "Today";
  if (key === dateKey(new Date(now + 24 * HOUR), timeZone)) return "Tomorrow";
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));
}

export function daySubtitle(key: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${key}T12:00:00Z`),
  );
}

export function startsIn(ms: number, now: number): string {
  const minutes = Math.max(0, Math.round((ms - now) / MINUTE));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `In ${hours}h ${String(minutes % 60).padStart(2, "0")}m` : `In ${minutes}m`;
}

/**
 * Today and the next match day as one ruler anchored to the visitor's clock.
 *
 * Live matches only join when they started today (within the last 12 hours):
 * an old row still marked live must not pull a past day into the rundown or
 * stretch its window to `now`. The needle exists only while `now` falls inside
 * one of the shown days.
 */
export function buildRundown(
  live: MatchSummary[],
  upcoming: RundownMatch[],
  now: number,
  timeZone: string,
): Rundown {
  const empty: Rundown = { days: [], blocks: [], ticks: [], lanes: 1, needle: null };
  if (!Number.isFinite(now)) return empty;

  const todayKey = dateKey(new Date(now), timeZone);

  const liveItems: Item[] = live
    .map((match) => ({ match, live: true, start: startOf(match) }))
    .filter((item) => Number.isFinite(item.start) && item.start <= now && now - item.start <= MAX_LIVE_AGE)
    .filter((item) => dateKey(new Date(item.start), timeZone) === todayKey);

  const upcomingItems: Item[] = upcoming
    .map((match) => ({ match, live: false, start: startOf(match) }))
    .filter((item) => Number.isFinite(item.start))
    .filter((item) => dateKey(new Date(item.start), timeZone) >= todayKey);

  const all = [...liveItems, ...upcomingItems].sort((a, b) => a.start - b.start);
  if (all.length === 0) return empty;

  // A live series runs at least half an hour past now so it straddles the needle.
  const endOf = (item: Item): number => {
    const base = item.start + blockMs(item.match);
    return item.live && now >= item.start ? Math.max(base, now + 30 * MINUTE) : base;
  };

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
    const last = Math.max(...inDay.map(endOf));
    const from = Math.floor((first - HOUR) / HOUR) * HOUR;
    // At least six hours wide, so a single match still reads as a block.
    const to = Math.max(Math.ceil((last + HOUR) / HOUR) * HOUR, from + MIN_WINDOW);
    return { key, from, to };
  });

  const share = 100 / Math.max(1, days.length);
  const x = (day: number, ms: number): number => {
    const d = days[day];
    if (!d) return 0;
    return day * share + ((ms - d.from) / (d.to - d.from)) * share;
  };

  // Overlapping matches go to the next lane down.
  const laneEnds: number[][] = days.map(() => []);
  const blocks: Block[] = items.map((item) => {
    const day = shownKeys.indexOf(dateKey(new Date(item.start), timeZone));
    const ends = laneEnds[day] ?? [];
    let lane = ends.findIndex((end) => end <= item.start);
    if (lane === -1) lane = ends.length;
    const end = endOf(item);
    ends[lane] = end;
    return {
      match: item.match,
      start: item.start,
      end,
      left: x(day, item.start),
      right: x(day, end),
      live: item.live,
      day,
      lane,
    };
  });

  const lanes = Math.max(1, ...blocks.map((block) => block.lane + 1));

  const ticks: Tick[] = days.flatMap((day, index) => {
    const out: Tick[] = [];
    for (let t = day.from; t < day.to; t += TICK_STEP) out.push({ left: x(index, t), label: clock(t, timeZone) });
    return out;
  });

  const needleDay = days.findIndex((day) => now >= day.from && now <= day.to);
  const needle = needleDay >= 0 ? { day: needleDay, left: x(needleDay, now) } : null;

  return { days, blocks, ticks, lanes, needle };
}
