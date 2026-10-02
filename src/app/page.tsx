import { headers } from "next/headers";

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
import { Tournaments } from "@/components/home/Tournaments";
import { YourTeams } from "@/components/home/YourTeams";
import { apiFetch } from "@/lib/api/client";
import { getHome } from "@/lib/api/home";
import type { ApiEnvelope, Favorite, MatchSummary, TeamSummary } from "@/lib/api/types";
import { getAccessToken } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The visitor's followed teams. The home page still renders without them.
async function fetchFollowedTeams(token: string | null): Promise<TeamSummary[]> {
  if (!token) return [];
  try {
    const response = await apiFetch<ApiEnvelope<Favorite[]>>("/me/favorites", {
      token,
      cache: "no-store",
    });
    return (response?.data ?? [])
      .filter((favorite) => favorite?.entity_type === "team")
      .map((favorite) => favorite.entity as TeamSummary);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const token = await getAccessToken();
  const [home, followedTeams] = await Promise.all([
    getHome(token),
    fetchFollowedTeams(token),
  ]);

  const featured = home?.featured_live_match ?? null;
  const liveNow = home?.live_now ?? [];
  const upcoming = home?.upcoming ?? [];
  const tournaments = home?.featured_tournaments ?? [];
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
    <div className="flex-1 bg-paper text-ink">
      <FollowProvider signedIn={token !== null} initialTeams={followedTeams}>
        <MatchLanguageProvider initial={heroMatch?.broadcasts?.[0]?.language ?? null}>
          <Hero
            match={heroMatch}
            liveCount={liveMatches.length}
            viewerTotal={viewerTotal}
            upcomingCount={upcoming.length}
            todayCount={todayCount}
            host={host}
          />
          <YourTeams liveMatches={liveMatches} upcoming={upcoming} />
          {continueWatching.length > 0 ? (
            <ContinueWatching items={continueWatching} />
          ) : null}
          {heroMatch?.status === "live" ? <MatchCenter match={heroMatch} /> : null}
        </MatchLanguageProvider>
        {otherLive.length > 0 ? (
          <LiveNow matches={otherLive} more={heroMatch?.status === "live"} />
        ) : null}
        {upcoming.length > 0 ? <Schedule matches={upcoming} /> : null}
        {tournaments.length > 0 ? <Tournaments tournaments={tournaments} /> : null}
        {teams.length > 0 ? (
          <Teams teams={teams} liveMatches={liveMatches} upcoming={upcoming} />
        ) : null}
        {videos.length > 0 ? <Replays videos={videos} /> : null}
      </FollowProvider>
      {token === null ? <JoinCta /> : null}
    </div>
  );
}
