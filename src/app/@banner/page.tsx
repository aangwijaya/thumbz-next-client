import { AnnouncementBanner } from "@/components/home/AnnouncementBanner";
import { getHome } from "@/lib/api/home";
import type { HomePayload } from "@/lib/api/types";
import { getAccessToken } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// The announcement bar sits above the header, so it is its own slot in the
// root layout. It only renders on the home page, and only while a match is live.
export default async function BannerSlot() {
  let home: HomePayload;
  try {
    home = await getHome(await getAccessToken());
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
