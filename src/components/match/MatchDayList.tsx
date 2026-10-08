"use client";

import type { MatchSummary } from "@/lib/api/types";
import { dateKey, useTimeZone } from "@/lib/hooks/useTimeZone";

import { MatchListItem } from "./MatchListItem";

function dayHeading(key: string, timeZone: string): string {
  const now = new Date();
  if (key === dateKey(now, timeZone)) return "Today";
  if (key === dateKey(new Date(now.getTime() - 86_400_000), timeZone)) return "Yesterday";
  if (key === dateKey(new Date(now.getTime() + 86_400_000), timeZone)) return "Tomorrow";
  // Noon UTC keeps the calendar day stable in every zone.
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${key}T12:00:00Z`));
}

/** Matches grouped by calendar day in the visitor's time zone. */
export function MatchDayList({ matches }: { matches: MatchSummary[] }) {
  const timeZone = useTimeZone();
  const days = new Map<string, MatchSummary[]>();
  for (const match of matches) {
    const date = new Date(match?.scheduled_at ?? "");
    if (Number.isNaN(date.getTime())) continue;
    const key = dateKey(date, timeZone);
    days.set(key, [...(days.get(key) ?? []), match]);
  }

  return (
    <div className="flex flex-col gap-8">
      {[...days.entries()].map(([key, dayMatches]) => (
        <section key={key} aria-labelledby={`day-${key}`}>
          <h2
            id={`day-${key}`}
            className="mb-2 border-b border-stone pb-2 font-graphik text-body-lg font-bold text-ink"
          >
            {dayHeading(key, timeZone)}
          </h2>
          <ul className="flex flex-col">
            {dayMatches.map((match) => (
              <MatchListItem key={match?.id} match={match} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
