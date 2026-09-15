import { MatchCard } from "@/components/cards/MatchCard";
import { TeamCard } from "@/components/cards/TeamCard";
import { TournamentCard } from "@/components/cards/TournamentCard";
import { VideoCard } from "@/components/cards/VideoCard";
import { LiveSection } from "@/components/home/LiveSection";
import { UpcomingSchedule } from "@/components/home/UpcomingSchedule";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { apiFetch } from "@/lib/api/client";
import type { ApiEnvelope, HomePayload, MatchSummary } from "@/lib/api/types";
import { getAccessToken } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface HomeSectionProps {
  title: string;
  viewAllHref?: string;
  gridClass?: string;
  className?: string;
  children: React.ReactNode;
}

function HomeSection({ title, viewAllHref, gridClass, className = "", children }: HomeSectionProps) {
  return (
    <section className={`flex flex-col gap-6 sm:gap-8 ${className}`}>
      <SectionHeader title={title} viewAllHref={viewAllHref} />
      {gridClass ? <div className={gridClass}>{children}</div> : children}
    </section>
  );
}

async function fetchHome(): Promise<HomePayload> {
  const token = await getAccessToken();
  const response = await apiFetch<ApiEnvelope<HomePayload>>("/home", {
    token: token ?? undefined,
    cache: "no-store",
  });
  return response?.data;
}

export default async function HomePage() {
  const home = await fetchHome();

  const featured = home?.featured_live_match ?? null;
  const liveNow = home?.live_now ?? [];
  const upcoming = home?.upcoming ?? [];
  const tournaments = home?.featured_tournaments ?? [];
  const teams = home?.popular_teams ?? [];
  const videos = home?.latest_videos ?? [];
  const continueWatching = home?.continue_watching ?? [];

  const heroes: MatchSummary[] = [];
  if (featured) heroes.push(featured);
  const candidates = liveNow.filter(
    (match) => !heroes.some((hero) => hero?.id === match?.id),
  );
  for (const match of candidates) {
    if (heroes.length >= 2) break;
    const sameTournament = heroes.some(
      (hero) => hero?.tournament_id && hero.tournament_id === match?.tournament_id,
    );
    if (sameTournament) continue;
    heroes.push(match);
  }
  for (const match of candidates) {
    if (heroes.length >= 2) break;
    if (!heroes.some((hero) => hero?.id === match?.id)) heroes.push(match);
  }
  const heroIds = new Set(heroes.map((match) => match?.id));
  const alsoLive = liveNow.filter((match) => !heroIds.has(match?.id));

  const hasContent =
    liveNow.length > 0 ||
    upcoming.length > 0 ||
    tournaments.length > 0 ||
    teams.length > 0 ||
    videos.length > 0;

  return (
    <>
      {heroes.length > 0 ? <LiveSection heroes={heroes} alsoLive={alsoLive} /> : null}

      <div className="flex-1 bg-page-dark">
        <Container size="wide" className="flex flex-col gap-16 py-10 sm:gap-16 sm:py-14">
          {upcoming.length > 0 ? (
            <HomeSection title="Upcoming matches" viewAllHref="/matches">
              <UpcomingSchedule matches={upcoming} />
            </HomeSection>
          ) : null}

          {tournaments.length > 0 ? (
            <HomeSection
              title="Featured tournaments"
              viewAllHref="/tournaments"
              gridClass="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
              className="border-t border-page-dark-border pt-14 sm:pt-16"
            >
              {tournaments.map((tournament, index) => (
                <TournamentCard key={tournament?.id ?? index} tournament={tournament} />
              ))}
            </HomeSection>
          ) : null}

          {teams.length > 0 ? (
            <HomeSection
              title="Popular teams"
              viewAllHref="/teams"
              gridClass="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              className="border-t border-page-dark-border pt-14 sm:pt-16"
            >
              {teams.map((team, index) => (
                <TeamCard key={team?.id ?? index} team={team} />
              ))}
            </HomeSection>
          ) : null}

          {videos.length > 0 ? (
            <HomeSection
              title="Latest content"
              gridClass="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              className="border-t border-page-dark-border pt-14 sm:pt-16"
            >
              {videos.slice(0, 8).map((video, index) => (
                <VideoCard key={video?.id ?? index} video={video} />
              ))}
            </HomeSection>
          ) : null}

          {continueWatching.length > 0 ? (
            <HomeSection
              title="Continue watching"
              viewAllHref="/history"
              gridClass="grid gap-4 md:grid-cols-2"
              className="border-t border-page-dark-border pt-14 sm:pt-16"
            >
              {continueWatching.map((item, index) => (
                <MatchCard key={item?.match_id ?? index} match={item?.match} />
              ))}
            </HomeSection>
          ) : null}

          {!hasContent && !featured ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="font-display text-2xl tracking-tight">Nothing here yet</p>
              <p className="max-w-md text-sm text-text-secondary">
                No matches or content are available right now. Check back soon.
              </p>
            </div>
          ) : null}
        </Container>
      </div>
    </>
  );
}
