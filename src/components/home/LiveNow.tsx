import Link from "next/link";

import { Scorebug } from "@/components/home/Scorebug";
import { SeriesPips } from "@/components/match/SeriesPips";
import { Spoiler } from "@/components/spoiler/Spoiler";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { LiveDot } from "@/components/ui/LiveDot";
import { Thumbnail } from "@/components/ui/Thumbnail";
import type { MatchSummary } from "@/lib/api/types";
import { formatBroadcastLanguage, formatStage, formatViewerCount } from "@/lib/utils/format";
import { seriesInfo } from "@/lib/utils/series";

interface LiveNowProps {
  matches: MatchSummary[];
  /** True when the hero already shows another live match. */
  more: boolean;
  /** The league the page shows, for the title. */
  leagueLabel: string | null;
}

const COUNT_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];

// A small broadcast window per live match: the hero's scorebug over the
// stream thumbnail, then who plays, the series so far and each language feed.
function LiveTile({ match }: { match: MatchSummary }) {
  const id = match?.id ?? "";
  const viewers = match?.viewer_count ?? 0;
  const info = seriesInfo(match);
  const stage = [match?.stage ? formatStage(match.stage) : null, match?.round ? `round ${match.round}` : null]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[15px] border border-stone bg-paper shadow-[0_1px_0_rgb(37_34_30/0.04),0_28px_56px_-40px_rgb(37_34_30/0.45)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-[3px] has-[a:focus-visible]:outline-deep-ember hover:-translate-y-[3px] hover:shadow-[0_1px_0_rgb(37_34_30/0.04),0_36px_64px_-36px_rgb(37_34_30/0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Thumbnail
        src={match?.thumbnail_url}
        colors={[match?.team_a?.color_primary, match?.team_b?.color_primary]}
        sizes="(min-width: 901px) 560px, 100vw"
      >
        <span className="absolute left-2.5 top-2.5 z-[2] flex gap-1.5 min-[641px]:left-3 min-[641px]:top-3">
          <Badge tone="light" size="xs">
            <LiveDot />
            Live
          </Badge>
          {viewers > 0 ? (
            <span className="max-[640px]:hidden">
              <Badge tone="dark" size="xs">
                {formatViewerCount(viewers)} watching
              </Badge>
            </span>
          ) : null}
        </span>
        <Scorebug match={match} />
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-[56%] grid size-14 -translate-x-1/2 -translate-y-1/2 scale-90 place-items-center rounded-full bg-paper/90 text-ink opacity-0 shadow-[0_8px_24px_rgb(0_0_0/0.25)] transition duration-300 group-hover:scale-100 group-hover:opacity-100 max-[640px]:hidden"
        >
          <svg viewBox="0 0 24 24" className="ml-[3px] size-5 fill-current">
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
        </span>
      </Thumbnail>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 px-[18px] pb-[18px] pt-4 max-[640px]:p-3.5">
        <div className="min-w-0">
          <h3 className="truncate font-graphik text-[17px] font-bold leading-snug text-ink">
            <Link href={`/matches/${id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {match?.team_a?.name ?? "TBD"} vs {match?.team_b?.name ?? "TBD"}
            </Link>
          </h3>
          <p className="mt-0.5 text-[13px] text-pencil">
            {stage || match?.tournament?.name}
            {info ? (
              <Spoiler matchId={id}>
                <span> · Game {info.game}</span>
              </Spoiler>
            ) : null}
          </p>
        </div>
        <Spoiler matchId={id} safe={<span className="text-[13px] text-pencil">Best of {match?.best_of ?? 1}</span>}>
          <SeriesPips match={match} />
        </Spoiler>
        {(match?.broadcasts?.length ?? 0) > 0 ? (
          <ul className="col-span-full flex flex-wrap gap-1.5" aria-label="Commentary">
            {match?.broadcasts?.map((feed) => (
              <li
                key={feed?.language}
                className="inline-flex min-h-7 items-center gap-1.5 rounded-[7px] border border-[#eeecea] px-2.5 text-caption font-medium text-charcoal"
              >
                {formatBroadcastLanguage(feed?.language ?? "")}
                <b className="font-semibold text-ink">{formatViewerCount(feed?.viewer_count ?? 0)}</b>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

export function LiveNow({ matches, more, leagueLabel }: LiveNowProps) {
  const count = matches.length;
  const word = COUNT_WORDS[count] ?? String(count);

  return (
    <section id="live-now" aria-labelledby="live-now-title" className="scroll-mt-32 py-[clamp(32px,4vw,48px)]">
      <Container size="page">
        <div className="mb-6 flex flex-col items-start gap-4 min-[641px]:mb-8 min-[641px]:flex-row min-[641px]:flex-wrap min-[641px]:items-end min-[641px]:justify-between">
          <div className="flex flex-col gap-4">
            <p className="-mb-2 flex items-center gap-2 text-caption font-semibold text-deep-ember">
              <LiveDot />
              Live now
            </p>
            <h2
              id="live-now-title"
              className="text-balance font-graphik text-[clamp(28px,calc(2.2vw+8px),38px)] font-bold leading-[1.2] tracking-[-0.005em] text-ink"
            >
              {word} {more ? "more " : ""}
              {leagueLabel ? `${leagueLabel} ` : ""}
              {count === 1 ? "match is" : "matches are"} on air
            </h2>
          </div>
          <ArrowLink href="/live">All live matches</ArrowLink>
        </div>
        <div className="grid gap-6 max-[640px]:gap-4 min-[901px]:grid-cols-2">
          {matches.map((match, index) => (
            <LiveTile key={match?.id ?? index} match={match} />
          ))}
        </div>
      </Container>
    </section>
  );
}
