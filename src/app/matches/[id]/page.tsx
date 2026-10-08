import Link from "next/link";
import { notFound } from "next/navigation";

import { MatchChatProvider } from "@/components/chat/MatchChatProvider";
import { FollowProvider } from "@/components/home/FollowProvider";
import { MatchLanguageProvider } from "@/components/home/MatchLanguage";
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

async function fetchMatch(id: string): Promise<MatchDetail> {
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

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
  const title = `${match?.team_a?.name ?? "TBD"} vs ${match?.team_b?.name ?? "TBD"}`;
  const game =
    match?.game_number ?? (match?.score_a ?? 0) + (match?.score_b ?? 0) + 1;
  const backHref = isLive ? "/#live-now" : "/#schedule";

  return (
    <SpoilerProvider initialHidden={hideScores}>
      <div className="flex-1 bg-paper text-ink">
        <h1 className="sr-only">
          {isLive ? "Live: " : ""}
          {title}
        </h1>
        <FollowProvider signedIn={token !== null} initialTeams={followed}>
          <MatchLanguageProvider initial={broadcasts[0]?.language ?? null}>
            <MatchChatProvider matchId={match?.id ?? id} live={isLive}>
              <Container size="watch" className="max-[900px]:hidden">
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
          </MatchLanguageProvider>
        </FollowProvider>
      </div>
    </SpoilerProvider>
  );
}
