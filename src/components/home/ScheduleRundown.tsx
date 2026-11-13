"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { Badge } from "@/components/ui/Badge";
import { LiveDot } from "@/components/ui/LiveDot";
import { LogoMark } from "@/components/ui/LogoMark";
import type { MatchSummary } from "@/lib/api/types";
import { useTimeZone } from "@/lib/hooks/useTimeZone";
import { shortTeamName } from "@/lib/utils/format";
import { teamColors } from "@/lib/utils/team-colors";

import { buildRundown, clock, daySubtitle, dayTitle, startsIn, type RundownMatch } from "./schedule-rundown";

interface ScheduleRundownProps {
  live: MatchSummary[];
  upcoming: RundownMatch[];
}

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

  const { days, blocks, ticks, lanes, needle } = buildRundown(live, upcoming, now, timeZone);
  const nextUpcoming = blocks.find((block) => !block.live);
  // Phone order: live first, then the needle, then what is coming.
  const nowIndex = blocks.findIndex((block) => !block.live);

  if (days.length === 0) {
    return (
      <div className="rounded-lg border border-stone bg-paper px-6 py-10 text-center text-sm text-pencil shadow-subtle">
        No matches scheduled yet. The full schedule lists later match days.
      </div>
    );
  }

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
        className="relative flex flex-col gap-2.5 pt-2 min-[641px]:block min-[641px]:h-(--rundown-h) min-[641px]:pt-0"
        style={{ ["--rundown-h" as string]: `${TOP_PX + lanes * LANE_PX}px` }}
      >
        {/* Grid lines come from the same ticks as the labels, so they always line up. */}
        {ticks.map((tick) => (
          <li
            key={`grid-${tick.left}`}
            aria-hidden="true"
            className="absolute inset-y-0 border-l border-[#eeecea] max-[640px]:hidden"
            style={{ left: `${tick.left}%` }}
          />
        ))}
        {days.length > 1 ? (
          <li aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-stone max-[640px]:hidden" />
        ) : null}
        {blocks.map((block, index) => {
          const match = block.match;
          const [colorA, colorB] = teamColors(match);
          const ticket = match?.ticket?.on_sale ? match.ticket : null;
          const left = ticket?.quota_remaining ?? 0;
          const total = ticket?.quota_total ?? 0;
          const dayKey = days[block.day]?.key ?? "";
          const when = `${dayTitle(dayKey, timeZone, now)} ${clock(block.start, timeZone)}`;
          return (
            <WithNeedle
              key={match?.id ?? index}
              needle={needle !== null && index === nowIndex}
              now={now}
              left={needle?.left ?? 0}
              timeZone={timeZone}
            >
              <li
                className="relative min-[641px]:absolute min-[641px]:left-(--l) min-[641px]:top-(--t) min-[641px]:h-[76px] min-[641px]:w-(--w)"
                style={{
                  ["--l" as string]: `calc(${block.left}% + 3px)`,
                  ["--w" as string]: `max(176px, calc(${block.right - block.left}% - 6px))`,
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
                      <span className="min-[641px]:hidden">{dayTitle(dayKey, timeZone, now)} </span>
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
        {needle && nowIndex === -1 ? <Needle left={needle.left} label={`Now · ${clock(now, timeZone)}`} /> : null}
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
