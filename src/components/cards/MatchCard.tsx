import Link from "next/link";

import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ViewerCount } from "@/components/ui/ViewerCount";
import type { MatchSummary } from "@/lib/api/types";
import { formatDateTime, formatStage } from "@/lib/utils/format";

import { TeamLogo } from "./TeamLogo";

interface MatchCardProps {
  match: MatchSummary;
  className?: string;
}

export function MatchCard({ match, className = "" }: MatchCardProps) {
  const isLive = match?.status === "live";
  const hasScore = isLive || match?.status === "completed";
  const winnerId = match?.winner_team_id;
  const aWon =
    match?.status === "completed" &&
    winnerId != null &&
    winnerId === match?.team_a?.id;
  const bWon =
    match?.status === "completed" &&
    winnerId != null &&
    winnerId === match?.team_b?.id;
  const showBadge =
    match?.status === "cancelled" || match?.status === "postponed";

  const meta = [
    match?.tournament?.name,
    match?.stage ? formatStage(match.stage) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/matches/${match?.id ?? ""}`}
      className={`group block rounded-lg border border-page-dark-border bg-page-dark-surface p-4 transition-colors hover:border-text-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate font-mono text-xs uppercase tracking-wider text-text-secondary">
          {meta || "Exhibition"}
        </p>
        {isLive ? <LiveIndicator /> : null}
        {showBadge ? <StatusBadge status={match.status} /> : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2.5">
            <TeamLogo team={match?.team_a} size={20} />
            <span
              className={`truncate text-sm ${bWon ? "text-text-secondary" : "font-medium text-text-primary"}`}
            >
              {match?.team_a?.name ?? "TBD"}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <TeamLogo team={match?.team_b} size={20} />
            <span
              className={`truncate text-sm ${aWon ? "text-text-secondary" : "font-medium text-text-primary"}`}
            >
              {match?.team_b?.name ?? "TBD"}
            </span>
          </div>
        </div>
        {hasScore ? (
          <ScoreDisplay
            scoreA={match?.score_a ?? null}
            scoreB={match?.score_b ?? null}
            colorA={match?.team_a?.color_primary}
            colorB={match?.team_b?.color_primary}
          />
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 font-mono text-xs text-text-secondary">
        {isLive ? (
          <ViewerCount count={match?.viewer_count} />
        ) : (
          <span>{formatDateTime(match?.scheduled_at ?? "")}</span>
        )}
        <span>BO{match?.best_of ?? "?"}</span>
      </div>
    </Link>
  );
}
