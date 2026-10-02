import Link from "next/link";

import { FeatureRow } from "@/components/home/FeatureRow";
import { FollowingBadge } from "@/components/home/FollowControls";
import { HiddenValue, RevealButton, Spoiler } from "@/components/spoiler/Spoiler";
import { Badge } from "@/components/ui/Badge";
import { LiveDot } from "@/components/ui/LiveDot";
import { LogoMark } from "@/components/ui/LogoMark";
import { Thumbnail } from "@/components/ui/Thumbnail";
import type { MatchSummary, TeamSummary } from "@/lib/api/types";
import { formatViewerCount } from "@/lib/utils/format";
import { seriesInfo, type SeriesInfo } from "@/lib/utils/series";

interface LiveNowProps {
  matches: MatchSummary[];
  /** True when the hero already shows another live match. */
  more: boolean;
}

const COUNT_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];

interface TeamLineProps {
  matchId: string;
  team?: TeamSummary | null;
  score: number | null | undefined;
  /** The team is behind in the series. */
  behind: boolean;
}

// The dimmed "behind" style would give the score away, so it only shows when
// the score itself is visible.
function TeamLine({ matchId, team, score, behind }: TeamLineProps) {
  const line = (visible: boolean) => (
    <div
      className={`flex min-w-0 items-center gap-2 text-[15px] font-semibold ${
        visible && behind ? "text-pencil" : "text-ink"
      }`}
    >
      <LogoMark source={team} size="sm" />
      <span className="truncate">{team?.name ?? "TBD"}</span>
      {score != null ? (
        <span className="ml-auto pl-2 font-graphik font-bold tabular-nums">
          {visible ? score : <HiddenValue>0</HiddenValue>}
        </span>
      ) : null}
    </div>
  );

  return (
    <Spoiler matchId={matchId} safe={line(false)}>
      {line(true)}
    </Spoiler>
  );
}

function SeriesBadge({ info }: { info: SeriesInfo | null }) {
  if (info?.state === "match-point") return <Badge tone="blue">Match point</Badge>;
  if (info?.state === "decider") return <Badge tone="ember">Decider</Badge>;
  if (info?.state === "just-started") return <Badge>Just started</Badge>;
  return null;
}

function LiveRow({ match }: { match: MatchSummary }) {
  const id = match?.id ?? "";
  const nameA = match?.team_a?.name ?? "TBD";
  const nameB = match?.team_b?.name ?? "TBD";
  const scoreA = match?.score_a;
  const scoreB = match?.score_b;
  const hasScore = scoreA != null && scoreB != null;
  const hasLead = hasScore && scoreA !== scoreB;
  const info = seriesInfo(match);
  const bestOf = match?.best_of ?? 1;
  const tournament = match?.tournament?.name;
  const viewers = match?.viewer_count ?? 0;

  const safeMeta = [tournament, `Best of ${bestOf}`].filter(Boolean).join(" · ");
  const fullMeta = [tournament, info ? `Game ${info.game} of ${bestOf}` : `Best of ${bestOf}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative grid grid-cols-[112px_minmax(0,1fr)] items-center gap-3 border-b border-stone/50 p-3 transition-colors last:border-b-0 hover:bg-[#fdfaf7] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-deep-ember min-[641px]:grid-cols-[148px_minmax(0,1fr)_auto] min-[641px]:gap-4">
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

      <div className="flex min-w-0 flex-col gap-[5px]">
        <TeamLine
          matchId={id}
          team={match?.team_a}
          score={scoreA}
          behind={hasLead && (scoreA ?? 0) < (scoreB ?? 0)}
        />
        <TeamLine
          matchId={id}
          team={match?.team_b}
          score={scoreB}
          behind={hasLead && (scoreB ?? 0) < (scoreA ?? 0)}
        />
        <Link
          href={`/matches/${id}`}
          className="after:absolute after:inset-0 focus-visible:outline-none"
        >
          <span className="sr-only">
            Watch live: {nameA} vs {nameB}
          </span>
        </Link>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[13px] text-pencil">
          <Spoiler matchId={id}>
            <SeriesBadge info={info} />
          </Spoiler>
          <Spoiler matchId={id} safe={<span>{safeMeta}</span>}>
            <span>{fullMeta}</span>
          </Spoiler>
          {viewers > 0 ? (
            <span className="min-[641px]:hidden">{formatViewerCount(viewers)} watching</span>
          ) : null}
          {hasScore ? <RevealButton matchId={id}>Show score</RevealButton> : null}
          <FollowingBadge teamIds={[match?.team_a?.id, match?.team_b?.id]} />
        </p>
      </div>

      {viewers > 0 ? (
        <p className="text-right text-[13px] leading-snug text-pencil max-[640px]:hidden">
          {formatViewerCount(viewers)}
          <br />
          watching
        </p>
      ) : null}
    </div>
  );
}

export function LiveNow({ matches, more }: LiveNowProps) {
  const count = matches.length;
  const word = COUNT_WORDS[count] ?? String(count);

  return (
    <FeatureRow
      id="live-now"
      eyebrow={
        <>
          <LiveDot />
          Live now
        </>
      }
      title={`${word} ${more ? "more " : ""}${count === 1 ? "match is" : "matches are"} on air`}
      body="Deciding games are flagged, so you can jump straight to the tense ones. With scores hidden, you only see who is playing."
      action={{ href: "/live", label: "All live matches" }}
    >
      <div className="overflow-hidden rounded-lg border border-stone bg-paper shadow-subtle">
        {matches.map((match, index) => (
          <LiveRow key={match?.id ?? index} match={match} />
        ))}
      </div>
    </FeatureRow>
  );
}
