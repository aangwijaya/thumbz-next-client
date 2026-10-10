import Link from "next/link";

import { HeroChatPhone, HeroChatProvider, HeroChatTicker } from "@/components/home/HeroChat";
import { Scorebug } from "@/components/home/Scorebug";
import { MatchLanguageLabel } from "@/components/home/MatchLanguage";
import { Waves } from "@/components/home/Waves";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { LiveDot } from "@/components/ui/LiveDot";
import { PrimaryLink } from "@/components/ui/PrimaryLink";
import { Thumbnail } from "@/components/ui/Thumbnail";
import type { MatchSummary, TeamSummary } from "@/lib/api/types";
import {
  formatDate,
  formatStartsIn,
  formatTime,
  formatViewerCount,
  shortTeamName,
} from "@/lib/utils/format";

interface HeroProps {
  /** The featured live match, else the next scheduled one. */
  match: MatchSummary | null;
  liveCount: number;
  viewerTotal: number;
  upcomingCount: number;
  /** Matches still to play today (UTC). */
  todayCount: number;
  /** Shown in the address bar of the match window. */
  host: string;
  /** The tournament the page shows. */
  leagueName: string | null;
}

function short(team?: TeamSummary | null): string {
  return shortTeamName(team);
}

function PlayerBar({ viewers }: { viewers: number }) {
  const icon = "size-[15px] shrink-0";
  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-linear-to-t from-ink/80 to-transparent px-2.5 pb-2 pt-6 text-[11px] text-paper min-[641px]:gap-3 min-[641px]:px-3.5 min-[641px]:pb-[11px] min-[641px]:pt-[30px] min-[641px]:text-caption"
    >
      <span className="absolute inset-x-2.5 bottom-[33px] h-[3px] rounded-full bg-ember-red min-[641px]:inset-x-3.5 min-[641px]:bottom-10" />
      <svg viewBox="0 0 24 24" fill="currentColor" className={icon}>
        <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={`${icon} max-[640px]:hidden`}
      >
        <path d="M4 9v6h4l5 4V5L8 9z" />
        <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      </svg>
      <span>{formatViewerCount(viewers)} watching</span>
      <MatchLanguageLabel />
      <span className="flex-1" />
      <span className="inline-flex items-center gap-1.5 font-semibold tracking-[0.06em]">
        <LiveDot />
        LIVE
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className={`${icon} max-[640px]:hidden`}
      >
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      </svg>
    </span>
  );
}

// The match as a 16:10 window: a browser bar over a 16:9 player (the bar is
// dropped on phones). The chat phone overlaps its lower right corner.
function MatchWindow({ match, host }: { match: MatchSummary; host: string }) {
  const isLive = match?.status === "live";
  const startsIn = isLive ? "" : formatStartsIn(match?.scheduled_at ?? "");

  return (
    <div className="col-start-1 row-start-1 self-start overflow-hidden rounded-[12px] border border-stone bg-paper shadow-[0_1px_0_0_rgb(37_34_30/0.04),0_20px_40px_-28px_rgb(37_34_30/0.45)] min-[901px]:rounded-image min-[901px]:shadow-[0_1px_0_0_rgb(37_34_30/0.04),0_32px_64px_-36px_rgb(37_34_30/0.42)]">
      <div
        aria-hidden="true"
        className="hidden h-9 items-center gap-1.5 border-b border-stone/50 bg-[#f7f5f2] px-3.5 min-[901px]:flex"
      >
        <span className="size-2.5 shrink-0 rounded-full bg-[#dcd9d5]" />
        <span className="size-2.5 shrink-0 rounded-full bg-[#dcd9d5]" />
        <span className="size-2.5 shrink-0 rounded-full bg-[#dcd9d5]" />
        <span className="mx-auto min-w-0 max-w-[70%] -translate-x-[22px] truncate rounded-md border border-stone/50 bg-paper px-3 py-0.5 text-caption text-pencil">
          {host}/matches/{match?.id}
        </span>
      </div>

      <Thumbnail
        src={match?.thumbnail_url}
        colors={[match?.team_a?.color_primary, match?.team_b?.color_primary]}
        sizes="(min-width: 901px) 640px, 100vw"
        priority
      >
        <Link
          href={`/matches/${match?.id ?? ""}`}
          className="absolute inset-0 z-[1] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-paper"
        >
          <span className="sr-only">
            {isLive ? "Watch live: " : ""}
            {match?.team_a?.name ?? "TBD"} vs {match?.team_b?.name ?? "TBD"}
          </span>
        </Link>
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 min-[641px]:left-3 min-[641px]:top-3">
          {isLive ? (
            <Badge tone="light" size="sm">
              <LiveDot />
              Live
            </Badge>
          ) : (
            <Badge tone="light" size="sm">
              {startsIn ? `Starts ${startsIn}` : "Up next"}
            </Badge>
          )}
        </div>
        <Scorebug match={match} />
        {isLive ? (
          <PlayerBar viewers={match?.viewer_count ?? 0} />
        ) : (
          <span className="absolute bottom-2.5 left-2.5 min-[641px]:bottom-3 min-[641px]:left-3">
            <Badge tone="dark" size="sm">
              {formatDate(match?.scheduled_at ?? "")}, {formatTime(match?.scheduled_at ?? "")} UTC
            </Badge>
          </span>
        )}
      </Thumbnail>

      {isLive ? <HeroChatTicker /> : null}
    </div>
  );
}

export function Hero({
  match,
  liveCount,
  viewerTotal,
  upcomingCount,
  todayCount,
  host,
  leagueName,
}: HeroProps) {
  const isLive = match?.status === "live";

  const facts: Array<{ value: string; label: string }> = [];
  if (liveCount > 0) {
    facts.push({
      value: String(liveCount),
      label: liveCount === 1 ? "match live" : "matches live",
    });
  }
  if (viewerTotal > 0) {
    facts.push({ value: formatViewerCount(viewerTotal), label: "watching" });
  }
  if (todayCount > 0) facts.push({ value: String(todayCount), label: "more today" });

  const media = match ? (
    <div className="contents min-[901px]:grid min-[901px]:grid-cols-[minmax(0,1fr)_var(--off)]">
      <MatchWindow match={match} host={host} />
      {isLive ? <HeroChatPhone /> : null}
    </div>
  ) : (
    <div className="rounded-image border border-stone bg-paper p-10 text-center shadow-subtle">
      <p className="font-graphik text-body-lg font-bold text-ink">No matches on right now</p>
      <p className="mt-1 text-body-sm text-pencil">
        New matches appear here as soon as they are scheduled.
      </p>
    </div>
  );

  // One grid for both layouts. Desktop: copy left, media right across both
  // rows. Phone: headline, then lead, media, buttons and facts in that order.
  // The peach band is a grid item starting at the lead's row, so its top edge
  // always sits right at the lead whatever the screen width.
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate mb-[clamp(8px,1vw,16px)] overflow-x-clip pt-[clamp(28px,4.5vw,64px)]"
    >
      <Container
        size="page"
        className="grid grid-cols-[minmax(0,1fr)] [--off:56px] max-[1080px]:[--off:40px] min-[901px]:grid-cols-[minmax(0,40fr)_minmax(0,60fr)] min-[901px]:grid-rows-[auto_1fr] min-[901px]:gap-x-[clamp(32px,3.6vw,56px)]"
      >
        <div className="col-start-1 row-start-1 flex flex-col items-start gap-3 pb-[22px] min-[901px]:pb-7">
          <p className="text-caption font-semibold text-deep-ember motion-safe:animate-lift">
            Mobile Legends esports, live
          </p>
          <h1
            id="hero-title"
            className="text-balance font-graphik text-[clamp(38px,calc(3.4vw+8px),56px)] font-bold leading-[1.03] tracking-[-0.01em] text-ink motion-safe:animate-lift motion-safe:[animation-delay:60ms]"
          >
            Watch every match as it happens.
          </h1>
        </div>

        <div
          aria-hidden="true"
          className="relative -z-10 col-span-full row-start-2 row-end-6 mx-[calc(50%-50vw)] overflow-hidden bg-cream min-[901px]:row-end-3"
        >
          <Waves animate className="bottom-0 h-[min(100%,300px)]" />
        </div>

        <div className="contents min-[901px]:col-start-1 min-[901px]:row-start-2 min-[901px]:block min-[901px]:pb-[clamp(40px,5vw,80px)]">
          <p className="col-start-1 row-start-2 max-w-[38ch] font-graphik text-[clamp(17px,calc(0.45vw+13.5px),20px)] font-semibold leading-normal text-pencil motion-safe:animate-lift motion-safe:[animation-delay:120ms]">
            Live streams, series scores, full builds and replays from{" "}
            {leagueName ?? "the pro leagues"}, game by game.
          </p>

          <div className="col-start-1 row-start-4 mt-5 flex items-center gap-3 motion-safe:animate-rise motion-safe:[animation-delay:180ms] min-[901px]:mt-8 min-[901px]:flex-wrap min-[901px]:gap-x-5">
            {match ? (
              <PrimaryLink href={`/matches/${match?.id ?? ""}`} className="max-[900px]:flex-1">
                {isLive ? "Watch" : "View"} {short(match?.team_a)} vs {short(match?.team_b)}
              </PrimaryLink>
            ) : (
              <PrimaryLink href="/tournaments" className="max-[900px]:flex-1">
                Browse tournaments
              </PrimaryLink>
            )}
            {upcomingCount > 0 ? (
              <Link
                href="#schedule"
                className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-lg border border-stone bg-paper px-3.5 text-[15px] font-semibold text-ink transition-colors hover:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember min-[641px]:px-4 min-[641px]:text-body min-[901px]:min-h-10 min-[901px]:border-0 min-[901px]:bg-transparent min-[901px]:px-1.5 min-[901px]:text-[15px] min-[901px]:font-medium min-[901px]:hover:text-deep-ember"
              >
                View schedule
                <span aria-hidden="true" className="ml-1.5 max-[900px]:hidden">
                  →
                </span>
              </Link>
            ) : null}
          </div>

          <ul className="col-start-1 row-start-5 mt-4 flex flex-wrap gap-x-4 gap-y-1.5 pb-9 text-body-sm text-pencil motion-safe:animate-rise motion-safe:[animation-delay:240ms] min-[901px]:mt-7 min-[901px]:gap-x-6 min-[901px]:pb-0">
            {facts.map((fact) => (
              <li key={fact.label}>
                <span className="font-semibold text-ink">{fact.value}</span> {fact.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="col-start-1 row-start-3 mt-5 motion-safe:animate-rise motion-safe:[animation-delay:120ms] min-[901px]:col-start-2 min-[901px]:row-start-1 min-[901px]:row-end-3 min-[901px]:mt-0 min-[901px]:self-start min-[901px]:pb-[clamp(40px,5vw,72px)]">
          {isLive && match ? (
            <HeroChatProvider matchId={match.id}>{media}</HeroChatProvider>
          ) : (
            media
          )}
        </div>
      </Container>
    </section>
  );
}
