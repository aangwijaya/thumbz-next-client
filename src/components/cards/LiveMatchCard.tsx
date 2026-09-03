import Image from "next/image";
import Link from "next/link";

import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { ViewerCount } from "@/components/ui/ViewerCount";
import type { MatchSummary } from "@/lib/api/types";

import { TeamLogo } from "./TeamLogo";

interface LiveMatchCardProps {
  match: MatchSummary;
  className?: string;
}

export function LiveMatchCard({ match, className = "" }: LiveMatchCardProps) {
  const teamA = match?.team_a?.name ?? "TBD";
  const teamB = match?.team_b?.name ?? "TBD";

  return (
    <Link
      href={`/matches/${match?.id ?? ""}`}
      className={`group block overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-text-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary ${className}`}
    >
      <div className="relative aspect-video bg-surface-elevated">
        {match?.thumbnail_url ? (
          <Image
            src={match.thumbnail_url}
            alt={`${teamA} vs ${teamB}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover motion-safe:transition-transform motion-safe:group-hover:scale-[1.02]"
          />
        ) : null}
        <div className="absolute left-3 top-3">
          <LiveIndicator />
        </div>
        <div className="absolute right-3 top-3 rounded bg-background/80 px-2 py-1">
          <ViewerCount count={match?.viewer_count} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
            <TeamLogo team={match?.team_a} size={18} />
            <span className="truncate">{teamA}</span>
            <span className="text-text-secondary">vs</span>
            <TeamLogo team={match?.team_b} size={18} />
            <span className="truncate">{teamB}</span>
          </div>
          <ScoreDisplay
            scoreA={match?.score_a ?? null}
            scoreB={match?.score_b ?? null}
            colorA={match?.team_a?.color_primary}
            colorB={match?.team_b?.color_primary}
            className="text-base"
          />
        </div>
        <p className="mt-1.5 truncate font-mono text-xs uppercase tracking-wider text-text-secondary">
          {[match?.tournament?.name, `BO${match?.best_of ?? "?"}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </Link>
  );
}
