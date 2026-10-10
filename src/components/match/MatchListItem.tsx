import Link from "next/link";

import { SeriesPips } from "@/components/match/SeriesPips";
import { HiddenValue, Spoiler } from "@/components/spoiler/Spoiler";
import { Badge } from "@/components/ui/Badge";
import { LiveDot } from "@/components/ui/LiveDot";
import { LocalTime } from "@/components/ui/LocalTime";
import { LogoMark } from "@/components/ui/LogoMark";
import { Thumbnail } from "@/components/ui/Thumbnail";
import type { MatchSummary, TeamSummary } from "@/lib/api/types";
import { tournamentLabel } from "@/lib/leagues";
import { formatStage, formatStartsIn, formatViewerCount, shortTeamName } from "@/lib/utils/format";

// One team line: logo, name (short on phones) and its games won. The dimmed
// "lost" style would give the result away, so it only shows with the score.
function TeamLine({
  matchId,
  team,
  score,
  lost,
}: {
  matchId: string;
  team?: TeamSummary | null;
  score: number | null;
  lost: boolean;
}) {
  const line = (visible: boolean) => (
    <span className={`flex min-w-0 items-center gap-2.5 text-[15px] font-semibold ${visible && lost ? "text-pencil" : "text-ink"}`}>
      <LogoMark source={team} size="sm" />
      <span className="truncate">
        <span className="min-[641px]:hidden">{shortTeamName(team)}</span>
        <span className="max-[640px]:hidden">{team?.name ?? "TBD"}</span>
      </span>
      {score != null ? (
        <span className="ml-auto pl-2 font-graphik text-[17px] font-extrabold tabular-nums">
          {visible ? score : <HiddenValue>0</HiddenValue>}
        </span>
      ) : null}
    </span>
  );
  return score != null ? (
    <Spoiler matchId={matchId} safe={line(false)}>
      {line(true)}
    </Spoiler>
  ) : (
    line(false)
  );
}

/**
 * One series in a list: when (or the live stream), both teams with the
 * series score, its games as pips, and what to do next. Spoiler-aware.
 */
export function MatchListItem({ match }: { match: MatchSummary }) {
  const id = match?.id ?? "";
  const live = match?.status === "live";
  const done = match?.status === "completed";
  const hasScore = live || done;
  const scoreA = hasScore ? (match?.score_a ?? 0) : null;
  const scoreB = hasScore ? (match?.score_b ?? 0) : null;
  const winner = match?.winner_team_id;
  const meta = [
    match?.tournament ? tournamentLabel(match.tournament) : null,
    match?.stage ? formatStage(match.stage) : null,
    match?.round ? `Round ${match.round}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const startsIn = match?.status === "scheduled" ? formatStartsIn(match?.scheduled_at ?? "") : "";
  const viewers = match?.viewer_count ?? 0;

  return (
    <li
      className={`relative grid items-center gap-x-5 gap-y-3 border-b border-[#eeecea] px-2 py-4 transition-colors last:border-b-0 hover:bg-[#fdfaf7] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-deep-ember max-[640px]:gap-x-3 max-[640px]:px-1 max-[640px]:py-3.5 ${
        live
          ? "grid-cols-[96px_minmax(0,1fr)] min-[641px]:grid-cols-[120px_minmax(0,1fr)_168px] min-[1081px]:grid-cols-[148px_minmax(0,1fr)_168px_176px]"
          : "grid-cols-[52px_minmax(0,1fr)] min-[641px]:grid-cols-[72px_minmax(0,1fr)_168px] min-[1081px]:grid-cols-[72px_minmax(0,1fr)_168px_176px]"
      }`}
    >
      {live ? (
        <Thumbnail
          src={match?.thumbnail_url}
          colors={[match?.team_a?.color_primary, match?.team_b?.color_primary]}
          sizes="148px"
          className="rounded-[10px]"
        >
          <Badge tone="light" size="xs" className="absolute left-1.5 top-1.5">
            <LiveDot />
            Live
          </Badge>
        </Thumbnail>
      ) : (
        <span className="flex flex-col gap-0.5">
          <LocalTime iso={match?.scheduled_at} className="text-[15px] font-semibold tabular-nums text-ink" />
          <span className="text-caption text-pencil">Bo{match?.best_of ?? 1}</span>
        </span>
      )}

      <span className="flex min-w-0 flex-col gap-1.5">
        <TeamLine matchId={id} team={match?.team_a} score={scoreA} lost={done && !!winner && winner !== match?.team_a?.id} />
        <TeamLine matchId={id} team={match?.team_b} score={scoreB} lost={done && !!winner && winner !== match?.team_b?.id} />
        {meta ? <span className="mt-0.5 truncate text-caption text-pencil">{meta}</span> : null}
        <Link href={`/matches/${id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
          <span className="sr-only">
            {match?.team_a?.name ?? "TBD"} vs {match?.team_b?.name ?? "TBD"}
            {live ? ", live now" : ""}
          </span>
        </Link>
      </span>

      <span className="flex flex-col items-start gap-1.5 max-[640px]:col-start-2">
        {hasScore ? (
          <Spoiler matchId={id} safe={<span className="text-caption text-pencil">Results hidden</span>}>
            <SeriesPips match={match} />
          </Spoiler>
        ) : match?.status === "cancelled" || match?.status === "postponed" ? (
          <Badge>{match.status === "cancelled" ? "Cancelled" : "Postponed"}</Badge>
        ) : startsIn ? (
          <Badge tone="blue">Starts {startsIn}</Badge>
        ) : (
          <Badge>Best of {match?.best_of ?? 1}</Badge>
        )}
      </span>

      <span
        aria-hidden="true"
        className="flex items-center justify-end gap-3 text-right max-[1080px]:col-span-full max-[1080px]:justify-start min-[1081px]:flex-col min-[1081px]:items-end min-[1081px]:gap-1.5"
      >
        {live ? (
          <>
            <span className="inline-flex min-h-9 items-center rounded-lg bg-deep-ember px-3.5 text-sm font-semibold text-paper">
              Watch
            </span>
            {viewers > 0 ? <span className="text-[13px] text-pencil">{formatViewerCount(viewers)} watching</span> : null}
          </>
        ) : done ? (
          <span className="text-[15px] font-medium text-cobalt-link">Watch replay →</span>
        ) : (
          <span className="text-[15px] font-medium text-cobalt-link max-[1080px]:hidden">Details →</span>
        )}
      </span>
    </li>
  );
}
