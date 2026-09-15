import Link from "next/link";

import type { MatchSummary } from "@/lib/api/types";
import { formatDate, formatStage, formatTime } from "@/lib/utils/format";

import { TeamLogo } from "../cards/TeamLogo";

interface UpcomingScheduleProps {
  matches: MatchSummary[];
}

function ScheduleRow({ match }: { match: MatchSummary }) {
  const teamA = match?.team_a?.name ?? "TBD";
  const teamB = match?.team_b?.name ?? "TBD";
  const meta = [match?.tournament?.name, match?.stage ? formatStage(match.stage) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/matches/${match?.id ?? ""}`}
      className="group flex items-center gap-4 border-b border-page-dark-border px-1 py-4 transition-colors hover:bg-white/[0.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
    >
      <span className="w-14 shrink-0 font-mono text-sm tabular-nums text-text-secondary">
        {formatTime(match?.scheduled_at ?? "")}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <TeamLogo team={match?.team_a} size={24} />
        <span className="truncate text-sm font-medium sm:text-base">{teamA}</span>
        <span className="shrink-0 font-mono text-xs uppercase tracking-widest text-text-secondary">
          vs
        </span>
        <TeamLogo team={match?.team_b} size={24} />
        <span className="truncate text-sm font-medium sm:text-base">{teamB}</span>
      </span>
      <span className="hidden truncate font-mono text-xs uppercase tracking-wider text-text-secondary lg:block lg:max-w-56">
        {meta}
      </span>
      <span className="shrink-0 font-mono text-xs tabular-nums text-text-secondary">
        BO{match?.best_of ?? "?"}
      </span>
      <span
        aria-hidden="true"
        className="shrink-0 text-text-secondary transition-transform motion-safe:group-hover:translate-x-0.5"
      >
        →
      </span>
    </Link>
  );
}

export function UpcomingSchedule({ matches }: UpcomingScheduleProps) {
  const groups = new Map<string, MatchSummary[]>();
  for (const match of matches) {
    const date = formatDate(match?.scheduled_at ?? "");
    if (!date) continue;
    const list = groups.get(date) ?? [];
    list.push(match);
    groups.set(date, list);
  }

  return (
    <div className="flex flex-col gap-10">
      {Array.from(groups.entries()).map(([date, items]) => (
        <div key={date}>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            {date}
          </p>
          <div className="border-t border-page-dark-border">
            {items.map((match, index) => (
              <ScheduleRow key={match?.id ?? index} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
