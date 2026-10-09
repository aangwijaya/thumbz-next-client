"use client";

import Link from "next/link";

import { FollowingBadge } from "@/components/home/FollowControls";
import { Badge } from "@/components/ui/Badge";
import { LogoMark } from "@/components/ui/LogoMark";
import type { MatchSummary, TicketAvailability } from "@/lib/api/types";
import { formatStage } from "@/lib/utils/format";
import { dateKey, useTimeZone } from "@/lib/hooks/useTimeZone";

interface SchedulePlannerProps {
  matches: MatchSummary[];
  /** On-sale venue tickets by match id. */
  tickets: Record<string, TicketAvailability>;
  /** "in 2h 14m" for the first match, worked out on the server; "" when it is not close. */
  startsIn: string;
}

interface Day {
  key: string;
  matches: MatchSummary[];
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

function groupByDay(matches: MatchSummary[], timeZone: string): Day[] {
  const days = new Map<string, Day>();
  for (const match of matches) {
    const date = new Date(match?.scheduled_at ?? "");
    if (Number.isNaN(date.getTime())) continue;
    const key = dateKey(date, timeZone);
    const day = days.get(key) ?? { key, matches: [] };
    day.matches.push(match);
    days.set(key, day);
  }
  return [...days.values()];
}

// "Today", "Tomorrow", else the weekday.
function dayTitle(key: string, timeZone: string): string {
  const now = new Date();
  if (key === dateKey(now, timeZone)) return "Today";
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (key === dateKey(tomorrow, timeZone)) return "Tomorrow";
  // Noon UTC, so the weekday is the same in every time zone.
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(
    new Date(`${key}T12:00:00Z`),
  );
}

function daySubtitle(key: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${key}T12:00:00Z`));
}

function TicketIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="size-4 text-deep-ember"
    >
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M14 6v12" strokeDasharray="2 2" />
    </svg>
  );
}

function TicketBox({ matchId, ticket }: { matchId: string; ticket: TicketAvailability }) {
  const total = ticket?.quota_total ?? 0;
  const left = ticket?.quota_remaining ?? 0;
  const percentLeft = total > 0 ? Math.round((left / total) * 100) : 0;
  const price = ticket?.price_usd ?? 0;
  const priceText = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);
  const venue = [ticket?.venue_name, ticket?.venue_city].filter(Boolean).join(", ");

  return (
    <div className="mt-2.5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1 rounded-lg bg-cream px-3 py-2.5 text-[13px] min-[641px]:grid-cols-[auto_minmax(0,1fr)_auto]">
      <TicketIcon />
      <span>
        {venue} · <b>{left.toLocaleString("en-US")}</b> of {total.toLocaleString("en-US")} seats
        left · from {priceText}
      </span>
      <span
        aria-hidden="true"
        className="relative col-start-2 h-1 overflow-hidden rounded-sm bg-[#f3ddd2]"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-sm bg-deep-ember"
          style={{ width: `${percentLeft}%` }}
        />
      </span>
      <Link
        href={`/matches/${matchId}#tickets`}
        className={`col-start-2 whitespace-nowrap min-[641px]:col-start-3 min-[641px]:row-span-2 min-[641px]:row-start-1 rounded-lg font-medium text-cobalt-link hover:underline hover:underline-offset-4 ${focusRing}`}
      >
        Get tickets →
      </Link>
    </div>
  );
}

function ScheduleRow({
  match,
  time,
  ticket,
  startsIn,
}: {
  match: MatchSummary;
  time: string;
  ticket?: TicketAvailability;
  startsIn: string;
}) {
  const id = match?.id ?? "";
  const event = [
    match?.tournament?.name,
    match?.stage ? formatStage(match.stage) : null,
    match?.round ? `Round ${match.round}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const nameLink = `rounded-lg transition-colors hover:text-deep-ember ${focusRing}`;

  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-3 border-b border-[#eeecea] py-[14px] last:border-b-0 min-[641px]:grid-cols-[52px_minmax(0,1fr)] min-[641px]:gap-[14px]">
      <div className="flex flex-col gap-0.5 pt-px">
        <time dateTime={match?.scheduled_at} className="text-body-sm font-medium text-ink">
          {time}
        </time>
        {match?.best_of ? <span className="text-caption text-pencil">BO{match.best_of}</span> : null}
      </div>

      <div className="min-w-0">
        <div className="flex flex-col items-start gap-1.5 text-[15px] font-semibold text-ink min-[641px]:flex-row min-[641px]:flex-wrap min-[641px]:items-center min-[641px]:gap-x-2">
          <span className="inline-flex min-w-0 items-center gap-2">
            <LogoMark source={match?.team_a} size="sm" />
            <Link href={`/matches/${id}`} className={nameLink}>
              {match?.team_a?.name ?? "TBD"}
            </Link>
          </span>
          <span className="text-[13px] font-normal text-pencil max-[640px]:hidden">vs</span>
          <span className="inline-flex min-w-0 items-center gap-2">
            <LogoMark source={match?.team_b} size="sm" />
            <Link href={`/matches/${id}`} className={nameLink}>
              {match?.team_b?.name ?? "TBD"}
            </Link>
          </span>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-pencil">
          {event ? <span>{event}</span> : null}
          {startsIn ? <Badge tone="blue">{startsIn}</Badge> : null}
          <FollowingBadge teamIds={[match?.team_a?.id, match?.team_b?.id]} />
        </p>
        {ticket ? <TicketBox matchId={id} ticket={ticket} /> : null}
      </div>
    </div>
  );
}

export function SchedulePlanner({ matches, tickets, startsIn }: SchedulePlannerProps) {
  const timeZone = useTimeZone();
  const days = groupByDay(matches, timeZone);
  const timeFormat = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  });
  const nextId = matches[0]?.id;

  return (
    <div className="rounded-lg border border-stone bg-paper px-4 pb-2 shadow-subtle min-[641px]:px-5 min-[641px]:pb-3 min-[641px]:pt-1">
      {days.map((day) => (
        <div key={day.key}>
          <h3 className="flex items-baseline gap-2.5 border-b border-stone pb-2.5 pt-4">
            <span className="font-graphik text-[19px] font-bold text-ink">
              {dayTitle(day.key, timeZone)}
            </span>
            <span className="text-[13px] font-normal text-pencil">{daySubtitle(day.key)}</span>
          </h3>
          {day.matches.map((match, index) => (
            <ScheduleRow
              key={match?.id ?? index}
              match={match}
              time={timeFormat.format(new Date(match?.scheduled_at ?? ""))}
              ticket={tickets[match?.id]}
              startsIn={match?.id === nextId ? startsIn : ""}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
