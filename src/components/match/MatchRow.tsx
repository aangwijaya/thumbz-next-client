import Link from "next/link";

import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { MatchSummary } from "@/lib/api/types";
import { formatDate, formatTime } from "@/lib/utils/format";

import { TeamLogo } from "../cards/TeamLogo";

interface MatchRowProps {
  match: MatchSummary;
}

export function MatchRow({ match }: MatchRowProps) {
  const isLive = match?.status === "live";
  const isCompleted = match?.status === "completed";
  const showBadge = match?.status === "cancelled" || match?.status === "postponed";
  const dateLabel = [formatDate(match?.scheduled_at ?? ""), formatTime(match?.scheduled_at ?? "")]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/matches/${match?.id ?? ""}`}
      className="group flex items-center gap-4 border-b border-page-dark-border px-1 py-3.5 transition-colors hover:bg-white/[0.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
    >
      <span className="w-28 shrink-0 font-mono text-xs tabular-nums text-text-secondary">
        {dateLabel}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <TeamLogo team={match?.team_a} size={22} />
        <span className="truncate text-sm font-medium">
          {match?.team_a?.name ?? "TBD"}
        </span>
        <span className="shrink-0 font-mono text-xs uppercase tracking-widest text-text-secondary">
          vs
        </span>
        <TeamLogo team={match?.team_b} size={22} />
        <span className="truncate text-sm font-medium">
          {match?.team_b?.name ?? "TBD"}
        </span>
      </span>
      {isLive ? (
        <span className="flex shrink-0 items-center gap-2">
          <LiveIndicator />
          <ScoreDisplay
            scoreA={match?.score_a ?? null}
            scoreB={match?.score_b ?? null}
            colorA={match?.team_a?.color_primary}
            colorB={match?.team_b?.color_primary}
            className="text-sm"
          />
        </span>
      ) : isCompleted ? (
        <ScoreDisplay
          scoreA={match?.score_a ?? null}
          scoreB={match?.score_b ?? null}
          colorA={match?.team_a?.color_primary}
          colorB={match?.team_b?.color_primary}
          className="shrink-0 text-sm"
        />
      ) : showBadge && match?.status ? (
        <StatusBadge status={match.status} />
      ) : (
        <span className="shrink-0 font-mono text-xs tabular-nums text-text-secondary">
          BO{match?.best_of ?? "?"}
        </span>
      )}
      <span
        aria-hidden="true"
        className="shrink-0 text-text-secondary transition-transform motion-safe:group-hover:translate-x-0.5"
      >
        →
      </span>
    </Link>
  );
}
