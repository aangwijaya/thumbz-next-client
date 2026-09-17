import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ViewerCount } from "@/components/ui/ViewerCount";
import type { MatchDetail, TeamSummary } from "@/lib/api/types";
import { formatDateTime, formatStage } from "@/lib/utils/format";

import { TeamLogo } from "../cards/TeamLogo";

interface MatchHeaderProps {
  match: MatchDetail;
}

function HeaderTeam({
  team,
  align,
}: {
  team?: TeamSummary | null;
  align: "start" | "end";
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 sm:gap-4 ${
        align === "end" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamLogo team={team} size={44} className="sm:size-14" />
      <span className="truncate font-display text-xl tracking-tight sm:text-3xl">
        {team?.name ?? "TBD"}
      </span>
    </div>
  );
}

export function MatchHeader({ match }: MatchHeaderProps) {
  const isLive = match?.status === "live";
  const hasScore = match?.score_a != null && match?.score_b != null;
  const kicker = [
    match?.tournament?.name,
    match?.stage ? formatStage(match.stage) : null,
    `BO${match?.best_of ?? "?"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="flex flex-col gap-4 border-b border-page-dark-border pb-5 sm:gap-5 sm:pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary sm:text-xs">
          {kicker}
        </p>
        {isLive ? (
          <span className="flex items-center gap-3">
            <LiveIndicator />
            <ViewerCount count={match?.viewer_count} />
          </span>
        ) : (
          <span className="flex items-center gap-3 font-mono text-xs text-text-secondary">
            {match?.status ? <StatusBadge status={match.status} /> : null}
            <span>{formatDateTime(match?.scheduled_at ?? "")}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        <HeaderTeam team={match?.team_a} align="start" />
        <div className="flex flex-col items-center gap-1">
          {hasScore ? (
            <ScoreDisplay
              scoreA={match?.score_a ?? null}
              scoreB={match?.score_b ?? null}
              colorA={match?.team_a?.color_primary}
              colorB={match?.team_b?.color_primary}
              className="text-3xl sm:text-4xl"
            />
          ) : (
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-text-secondary sm:text-sm">
              VS
            </span>
          )}
        </div>
        <HeaderTeam team={match?.team_b} align="end" />
      </div>
    </section>
  );
}
