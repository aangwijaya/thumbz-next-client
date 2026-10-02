import { Spoiler } from "@/components/spoiler/Spoiler";
import { LiveDot } from "@/components/ui/LiveDot";
import type { MatchSummary, TeamSummary } from "@/lib/api/types";
import { formatDate, formatStartsIn } from "@/lib/utils/format";
import { seriesInfo } from "@/lib/utils/series";

function involves(match: MatchSummary, team: TeamSummary): boolean {
  return match?.team_a?.id === team?.id || match?.team_b?.id === team?.id;
}

function opponentOf(match: MatchSummary, team: TeamSummary): string {
  const other = match?.team_a?.id === team?.id ? match?.team_b : match?.team_a;
  return other?.name ?? "TBD";
}

// The team's live match, else its next scheduled one.
export function findTeamMatch(
  team: TeamSummary,
  liveMatches: MatchSummary[],
  upcoming: MatchSummary[],
): { live?: MatchSummary; next?: MatchSummary } {
  return {
    live: liveMatches.find((match) => involves(match, team)),
    next: upcoming.find((match) => involves(match, team)),
  };
}

function Score({ own, other }: { own: number; other: number }) {
  return (
    <span className="whitespace-nowrap">
      {own}–{other}
    </span>
  );
}

// What the live line says: the full version mentions the score, the safe one
// only says who is playing.
function liveStatus(
  match: MatchSummary,
  team: TeamSummary,
): { full: React.ReactNode; safe: string } {
  const opponent = opponentOf(match, team);
  const safe = `Live now vs ${opponent}`;
  const info = seriesInfo(match);
  if (!info) return { full: safe, safe };

  const isA = match?.team_a?.id === team?.id;
  const own = (isA ? match?.score_a : match?.score_b) ?? 0;
  const other = (isA ? match?.score_b : match?.score_a) ?? 0;

  if (info.state === "decider") return { full: `Live · decider vs ${opponent}`, safe };
  if (own > other) {
    return { full: <>Live · leads {opponent} <Score own={own} other={other} /></>, safe };
  }
  if (own < other) {
    return { full: <>Live · trails {opponent} <Score own={own} other={other} /></>, safe };
  }
  if (own === 0) return { full: `Live · Game 1 vs ${opponent}`, safe };
  return { full: <>Live · tied <Score own={own} other={other} /> vs {opponent}</>, safe };
}

interface TeamStatusProps {
  team: TeamSummary;
  liveMatches: MatchSummary[];
  upcoming: MatchSummary[];
}

export function TeamStatus({ team, liveMatches, upcoming }: TeamStatusProps) {
  const { live, next } = findTeamMatch(team, liveMatches, upcoming);

  if (live) {
    const { full, safe } = liveStatus(live, team);
    return (
      <p className="flex items-start gap-1.5 text-[13px] text-pencil">
        <LiveDot className="mt-1.5" />
        <Spoiler matchId={live.id} safe={<span>{safe}</span>}>
          <span>{full}</span>
        </Spoiler>
      </p>
    );
  }

  if (next) {
    const when =
      formatStartsIn(next?.scheduled_at ?? "") || formatDate(next?.scheduled_at ?? "");
    return (
      <p className="text-[13px] text-pencil">
        Next{when ? ` · ${when}` : ""} vs {opponentOf(next, team)}
      </p>
    );
  }

  return null;
}
