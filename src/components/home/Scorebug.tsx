import { RevealButton, Spoiler } from "@/components/spoiler/Spoiler";
import { Badge } from "@/components/ui/Badge";
import { LogoMark } from "@/components/ui/LogoMark";
import type { MatchSummary, TeamSummary } from "@/lib/api/types";
import { shortTeamName } from "@/lib/utils/format";
import { seriesInfo } from "@/lib/utils/series";

function short(team?: TeamSummary | null): string {
  return shortTeamName(team);
}

// The chip under the scorebug: "Game 4 · Match point RRQ" when scores show,
// "Best of 5" when they are hidden.
function seriesCaption(match: MatchSummary): { full: string; safe: string } {
  const safe = `Best of ${match?.best_of ?? 1}`;
  const info = seriesInfo(match);
  if (!info) return { full: safe, safe };
  const parts = [`Game ${info.game}`];
  if (info.state === "match-point") {
    parts.push(`Match point ${short(info.pointSide === "a" ? match?.team_a : match?.team_b)}`);
  } else if (info.state === "decider") {
    parts.push("Decider");
  } else {
    parts.push(safe);
  }
  return { full: parts.join(" · "), safe };
}

// Team names and the series score over the top of the video, like a broadcast.
export function Scorebug({ match }: { match: MatchSummary }) {
  const isLive = match?.status === "live";
  const hasScore = isLive && match?.score_a != null && match?.score_b != null;
  const caption = hasScore
    ? seriesCaption(match)
    : isLive
      ? { full: `Best of ${match?.best_of ?? 1}`, safe: `Best of ${match?.best_of ?? 1}` }
      : null;
  const vs = <span className="text-xs font-semibold text-pencil">vs</span>;

  return (
    <div className="absolute left-1/2 top-2.5 z-[2] flex -translate-x-1/2 flex-col items-center gap-[5px] min-[641px]:top-3 min-[641px]:gap-1.5">
      <div className="flex items-center gap-[7px] whitespace-nowrap rounded-[10px] bg-paper/95 px-[9px] py-[5px] font-graphik text-xs font-bold leading-none text-ink shadow-[0_2px_12px_rgb(0_0_0/0.2)] min-[641px]:gap-2.5 min-[641px]:px-3 min-[641px]:py-1.5 min-[641px]:text-sm">
        <span className="flex items-center gap-[7px]">
          <LogoMark source={match?.team_a} size="xs" />
          {short(match?.team_a)}
        </span>
        <span className="min-w-9 text-center text-[15px] font-extrabold tracking-[-0.01em] tabular-nums min-[641px]:min-w-[46px] min-[641px]:text-[19px]">
          {hasScore ? (
            <Spoiler matchId={match.id} safe={vs}>
              {match.score_a}
              <span aria-hidden="true" className="px-[3px] text-graphite">
                –
              </span>
              {match.score_b}
            </Spoiler>
          ) : (
            vs
          )}
        </span>
        <span className="flex items-center gap-[7px]">
          {short(match?.team_b)}
          <LogoMark source={match?.team_b} size="xs" />
        </span>
      </div>
      {caption ? (
        <Badge tone="dark" size="xs">
          <Spoiler matchId={match.id} safe={caption.safe}>
            {caption.full}
          </Spoiler>
        </Badge>
      ) : null}
      {hasScore ? <RevealButton matchId={match.id}>Show score</RevealButton> : null}
    </div>
  );
}

