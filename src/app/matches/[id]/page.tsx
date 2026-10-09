import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { MatchChatProvider } from "@/components/chat/MatchChatProvider";
import { FollowProvider } from "@/components/home/FollowProvider";
import { MatchLanguageProvider } from "@/components/home/MatchLanguage";
import { LiveMatchProvider, LiveStatusLine } from "@/components/match/LiveMatchProvider";
import { LiveStats } from "@/components/match/LiveStats";
import { MatchChat } from "@/components/match/MatchChat";
import { MatchMoments } from "@/components/match/MatchMoments";
import { MatchMore } from "@/components/match/MatchMore";
import { ScoreStrip } from "@/components/match/ScoreStrip";
import { WatchLayout } from "@/components/match/WatchLayout";
import { Spoiler } from "@/components/spoiler/Spoiler";
import { Container } from "@/components/ui/Container";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { apiFetch } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { getFollowedTeams } from "@/lib/api/favorites";
import type { ApiEnvelope, MatchDetail, MatchSummary } from "@/lib/api/types";
import { SITE_URL } from "@/lib/site";
import { getAccessToken } from "@/lib/supabase/server";
import { hideScoresFromCookie } from "@/lib/spoiler-server";
import { SpoilerProvider } from "@/components/spoiler/SpoilerProvider";
import {
  dummyBroadcasts,
  dummyHistory,
  gameWinners,
  orDummy,
} from "@/lib/dummy/match";
import { formatStage } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

// cache(): generateMetadata and the page share one request per render.
const fetchMatch = cache(async function fetchMatch(id: string): Promise<MatchDetail> {
  try {
    // Short shared cache: viewers of a busy live match share one fetch;
    // live changes then arrive over the realtime channel.
    const response = await apiFetch<ApiEnvelope<MatchDetail>>(
      `/matches/${id}`,
      {
        next: { revalidate: 5, tags: [`match:${id}`] },
      },
    );
    return response?.data;
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
});

type Props = { params: Promise<{ id: string }> };

const matchTitle = (match: MatchDetail | undefined) =>
  `${match?.team_a?.name ?? "TBD"} vs ${match?.team_b?.name ?? "TBD"}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const match = await fetchMatch((await params).id);
  const title = matchTitle(match);
  const when = match?.scheduled_at ? new Date(match.scheduled_at).toUTCString().slice(0, 16) : null;
  // Deliberately no score: shared links must not spoil results.
  const description = [
    match?.status === "live" ? "Live now" : match?.status === "completed" ? "Full match" : when,
    match?.tournament?.name,
    match?.stage ? formatStage(match.stage) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    title: match?.status === "live" ? `Live: ${title}` : title,
    description: `${title} — ${description}. Watch, chat and follow live stats on THUMBZ.`,
    alternates: { canonical: `/matches/${match?.id}` },
    openGraph: { type: "video.other", title },
  };
}

/** schema.org SportsEvent for search engines (no score, same as the share card). */
function matchJsonLd(match: MatchDetail | undefined) {
  const team = (side: MatchDetail["team_a"] | undefined) =>
    side ? { "@type": "SportsTeam", name: side?.name, url: `${SITE_URL}/teams/${side?.id}` } : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: matchTitle(match),
    sport: "Mobile Legends: Bang Bang",
    startDate: match?.scheduled_at,
    endDate: match?.ended_at ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: { "@type": "VirtualLocation", url: `${SITE_URL}/matches/${match?.id}` },
    competitor: [team(match?.team_a), team(match?.team_b)].filter(Boolean),
    superEvent: match?.tournament
      ? { "@type": "SportsEvent", name: match.tournament.name, url: `${SITE_URL}/tournaments/${match.tournament.id}` }
      : undefined,
    organizer: { "@type": "Organization", name: "THUMBZ", url: SITE_URL },
  };
}

// Side lists only decorate the page, so a failure leaves them empty.
async function fetchList(path: string): Promise<MatchSummary[]> {
  try {
    const response = await apiFetch<ApiEnvelope<MatchSummary[]>>(path, {
      next: { revalidate: 15, tags: ["matches", "live"] },
    });
    return response?.data ?? [];
  } catch {
    return [];
  }
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  const [token, hideScores] = await Promise.all([
    getAccessToken(),
    hideScoresFromCookie(),
  ]);
  const [match, history, live, upcoming, followed] = await Promise.all([
    fetchMatch(id),
    fetchList(`/matches/${id}/history`),
    fetchList("/matches/live?pageSize=4"),
    fetchList("/matches/upcoming?pageSize=2"),
    getFollowedTeams(token),
  ]);

  const isLive = match?.status === "live";
  const broadcasts = orDummy(match?.broadcasts, () => dummyBroadcasts(match));
  const title = matchTitle(match);
  const game =
    match?.game_number ?? (match?.score_a ?? 0) + (match?.score_b ?? 0) + 1;
  const backHref = isLive ? "/#live-now" : "/#schedule";

  return (
    <SpoilerProvider initialHidden={hideScores}>
      <div className="flex-1 bg-paper text-ink">
        <script
          type="application/ld+json"
          // "<" is escaped so API text can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(matchJsonLd(match)).replace(/</g, "\\u003c") }}
        />
        <h1 className="sr-only">
          {isLive ? "Live: " : ""}
          {title}
        </h1>
        <FollowProvider signedIn={token !== null} initialTeams={followed}>
          <MatchLanguageProvider initial={broadcasts[0]?.language ?? null}>
            <LiveMatchProvider matchId={match?.id ?? id}>
            <MatchChatProvider matchId={match?.id ?? id} live={isLive}>
              <Container
                size="watch"
                className="flex items-center justify-between gap-4 max-[900px]:hidden"
              >
                <nav
                  aria-label="Breadcrumb"
                  className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 py-3.5 text-[13px] text-pencil"
                >
                  <Link
                    href={backHref}
                    className="inline-flex items-center gap-1.5 rounded-lg font-medium text-ink transition-colors hover:text-deep-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
                  >
                    <span aria-hidden="true">←</span>
                    {isLive ? "Live" : "Schedule"}
                  </Link>
                  {match?.tournament?.name ? (
                    <>
                      <span aria-hidden="true" className="text-stone">
                        /
                      </span>
                      <Link
                        href={`/tournaments/${match.tournament.id}`}
                        className="rounded-lg transition-colors hover:text-deep-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
                      >
                        {match.tournament.name}
                      </Link>
                    </>
                  ) : null}
                  {match?.stage ? (
                    <>
                      <span aria-hidden="true" className="text-stone">
                        /
                      </span>
                      <span>
                        {formatStage(match.stage)}
                        {match?.round ? `, round ${match.round}` : ""}
                      </span>
                    </>
                  ) : null}
                </nav>
                {isLive ? <LiveStatusLine /> : null}
              </Container>

              <WatchLayout
                stage={
                  <>
                    <VideoPlayer
                      streamUrl={match?.stream_url ?? null}
                      broadcasts={broadcasts}
                      poster={match?.thumbnail_url}
                      live={isLive}
                      viewers={match?.viewer_count ?? 0}
                      title={title}
                      colors={[
                        match?.team_a?.color_primary,
                        match?.team_b?.color_primary,
                      ]}
                      badge={
                        isLive ? (
                          <Spoiler
                            matchId={match.id}
                            safe={`Best of ${match?.best_of ?? 1}`}
                          >
                            Game {game} · BO{match?.best_of ?? 1}
                          </Spoiler>
                        ) : null
                      }
                      className="min-[901px]:rounded-xl"
                    />
                    <ScoreStrip
                      match={match}
                      broadcasts={broadcasts}
                      winners={gameWinners(match)}
                    />
                    {isLive ? (
                      <div className="px-5 pb-3 min-[641px]:px-6 min-[901px]:hidden">
                        <LiveStatusLine />
                      </div>
                    ) : null}
                  </>
                }
                chat={<MatchChat live={isLive} />}
                moments={<MatchMoments match={match} />}
                stats={<LiveStats match={match} />}
                more={
                  <MatchMore
                    match={match}
                    history={orDummy(history, () => dummyHistory(match))}
                    live={live.filter((row) => row?.id !== match?.id)}
                    next={upcoming.find((row) => row?.id !== match?.id) ?? null}
                  />
                }
              />
            </MatchChatProvider>
            </LiveMatchProvider>
          </MatchLanguageProvider>
        </FollowProvider>
      </div>
    </SpoilerProvider>
  );
}
