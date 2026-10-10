import { AnnouncementBanner } from "@/components/home/AnnouncementBanner";
import { getHome } from "@/lib/api/home";
import { getTournaments, pickTournament } from "@/lib/api/tournaments";
import type { HomePayload } from "@/lib/api/types";
import { getAccessToken } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The announcement bar sits above the header, so it is its own slot in the
// root layout. It only renders on the home page, and only while a match is live.
export default async function BannerSlot({
  searchParams,
}: {
  searchParams: Promise<{ tournament?: string | string[] }>;
}) {
  let home: HomePayload;
  try {
    // Same tournament and same cached /home call as the page below it.
    const [token, params, tournaments] = await Promise.all([getAccessToken(), searchParams, getTournaments()]);
    const requested = typeof params?.tournament === "string" ? params.tournament : null;
    home = await getHome(token, pickTournament(tournaments, requested)?.id);
  } catch {
    return null;
  }

  const match = home?.featured_live_match ?? home?.live_now?.[0];
  if (match?.status !== "live") return null;

  return (
    <AnnouncementBanner
      message={`${match?.tournament?.name ?? "A match"} is live now.`}
      linkLabel={`Watch ${match?.team_a?.name ?? "TBD"} vs ${match?.team_b?.name ?? "TBD"}`}
      href={`/matches/${match?.id ?? ""}`}
    />
  );
}
