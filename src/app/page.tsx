import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";

import { ContinueWatching } from "@/components/home/ContinueWatching";
import { FollowProvider } from "@/components/home/FollowProvider";
import { Hero } from "@/components/home/Hero";
import { JoinCta } from "@/components/home/JoinCta";
import { LiveNow } from "@/components/home/LiveNow";
import { MatchCenter } from "@/components/home/MatchCenter";
import { MatchLanguageProvider } from "@/components/home/MatchLanguage";
import { Replays } from "@/components/home/Replays";
import { Schedule } from "@/components/home/Schedule";
import { Teams } from "@/components/home/Teams";
import { Standings, StandingsFallback } from "@/components/home/Standings";
import { YourTeams } from "@/components/home/YourTeams";
import { getFollowedTeams } from "@/lib/api/favorites";
import { getHome } from "@/lib/api/home";
import { getLiveCounts, getTournaments, pickTournament } from "@/lib/api/tournaments";
import { tournamentLabel } from "@/lib/leagues";
import { LeagueBar } from "@/components/tournaments/LeagueBar";
import type { MatchSummary } from "@/lib/api/types";
import { SpoilerProvider } from "@/components/spoiler/SpoilerProvider";
import { hideScoresFromCookie } from "@/lib/spoiler-server";
import { getAccessToken } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tournament?: string | string[] }>;
}) {
  const [token, hideScores, params, tournamentList, liveCounts] = await Promise.all([
    getAccessToken(),
    hideScoresFromCookie(),
    searchParams,
    getTournaments(),
    getLiveCounts(),
  ]);
  const requested = typeof params?.tournament === "string" ? params.tournament : null;
  const tournament = pickTournament(tournamentList, requested);
  const [home, followedTeams] = await Promise.all([
    getHome(token, tournament?.id),
    getFollowedTeams(token),
  ]);

  const featured = home?.featured_live_match ?? null;
  const liveNow = home?.live_now ?? [];
  const upcoming = home?.upcoming ?? [];
  const teams = home?.popular_teams ?? [];
  const videos = home?.latest_videos ?? [];
  const continueWatching = home?.continue_watching ?? [];

  // The featured match may or may not also be listed in live_now.
  const liveById = new Map<string, MatchSummary>();
  for (const match of [featured, ...liveNow]) {
    if (match?.id) liveById.set(match.id, match);
  }
  const liveMatches = [...liveById.values()];
  const viewerTotal = liveMatches.reduce(
    (sum, match) => sum + (match?.viewer_count ?? 0),
    0,
  );

  // Live match first; when nothing is live, show the next scheduled match.
  const heroMatch = featured ?? liveMatches[0] ?? upcoming[0] ?? null;
  const otherLive = liveMatches.filter((match) => match?.id !== heroMatch?.id);

  // API times are UTC, so "today" is the UTC day.
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = upcoming.filter(
    (match) => match?.scheduled_at?.slice(0, 10) === today,
  ).length;
  const host = (await headers()).get("host") ?? "thumbz";

  return (
    <SpoilerProvider initialHidden={hideScores}>
      <LeagueBar
        allHref="/tournaments"
        tabs={tournamentList.map((item) => ({
          key: item?.id ?? "",
          label: tournamentLabel(item),
          title: item?.name ?? "Tournament",
          href: `/?tournament=${item?.id ?? ""}`,
          active: item?.id === tournament?.id,
          live: liveCounts[item?.id ?? ""] ?? 0,
        }))}
      />
      <div className="flex-1 bg-paper text-ink">
        <FollowProvider signedIn={token !== null} initialTeams={followedTeams}>
          <MatchLanguageProvider
            initial={heroMatch?.broadcasts?.[0]?.language ?? null}
          >
            <Hero
              match={heroMatch}
              liveCount={liveMatches.length}
              viewerTotal={viewerTotal}
              upcomingCount={upcoming.length}
              todayCount={todayCount}
              host={host}
              leagueName={tournament?.name ?? null}
            />
            <YourTeams liveMatches={liveMatches} upcoming={upcoming} />
            {continueWatching.length > 0 ? (
              <ContinueWatching items={continueWatching} />
            ) : null}
            {heroMatch?.status === "live" ? (
              <MatchCenter match={heroMatch} />
            ) : null}
          </MatchLanguageProvider>
          {otherLive.length > 0 ? (
            <LiveNow
              matches={otherLive}
              more={heroMatch?.status === "live"}
              leagueLabel={tournament ? tournamentLabel(tournament) : null}
            />
          ) : null}
          {upcoming.length > 0 || liveMatches.length > 0 ? (
            <Schedule matches={upcoming} live={liveMatches} tournamentId={tournament?.id ?? null} />
          ) : null}
          {tournament ? (
            // The ladder streams in without holding up the page.
            <Suspense fallback={<StandingsFallback />}>
              <Standings tournament={tournament} />
            </Suspense>
          ) : null}
          {teams.length > 0 ? (
            <Suspense fallback={null}>
              <Teams teams={teams} tournamentId={tournament?.id ?? null} />
            </Suspense>
          ) : null}
          {videos.length > 0 ? <Replays videos={videos} tournamentId={tournament?.id ?? null} /> : null}
        </FollowProvider>
        {token === null ? <JoinCta /> : null}
      </div>
    </SpoilerProvider>
  );
}
