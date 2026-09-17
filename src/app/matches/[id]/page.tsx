import { notFound } from "next/navigation";

import { MatchHeader } from "@/components/match/MatchHeader";
import { HeadToHeadPanel } from "@/components/match/HeadToHeadPanel";
import { LiveCommentPanel } from "@/components/match/LiveCommentPanel";
import { EquipmentTimeline } from "@/components/match/EquipmentTimeline";
import { EconomyChart } from "@/components/match/EconomyChart";
import { EventsFeed } from "@/components/match/EventsFeed";
import { TicketPanel } from "@/components/match/TicketPanel";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { Container } from "@/components/ui/Container";
import { apiFetch } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { ApiEnvelope, MatchDetail } from "@/lib/api/types";

export const dynamic = "force-dynamic";

async function fetchMatch(id: string): Promise<MatchDetail> {
  try {
    const response = await apiFetch<ApiEnvelope<MatchDetail>>(`/matches/${id}`, {
      cache: "no-store",
    });
    return response?.data;
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await fetchMatch(id);
  const live = match?.status === "live";

  return (
    <div className="flex-1 bg-page-dark">
      <Container size="wide" className="flex flex-col gap-6 py-6 sm:gap-8 sm:py-10">
        <MatchHeader match={match} />

        <section className="grid gap-4 lg:grid-cols-[19rem_minmax(0,1fr)_19rem] xl:grid-cols-[20rem_minmax(0,1fr)_20rem]">
          <HeadToHeadPanel
            matchId={match?.id ?? ""}
            live={live}
            teamA={match?.team_a}
            teamB={match?.team_b}
            className="order-2 lg:order-1"
          />
          <VideoPlayer
            streamUrl={match?.stream_url ?? null}
            poster={match?.thumbnail_url}
            live={live}
            title={`${match?.team_a?.name ?? "Team A"} vs ${match?.team_b?.name ?? "Team B"}`}
            className="order-1 lg:order-2"
          />
          <LiveCommentPanel
            matchId={match?.id ?? ""}
            live={live}
            className="order-3"
          />
        </section>

        <EquipmentTimeline
          matchId={match?.id ?? ""}
          live={live}
          teamA={match?.team_a}
          teamB={match?.team_b}
        />
        <EconomyChart
          matchId={match?.id ?? ""}
          live={live}
          teamA={match?.team_a}
          teamB={match?.team_b}
        />
        <EventsFeed
          matchId={match?.id ?? ""}
          live={live}
          teamA={match?.team_a}
          teamB={match?.team_b}
        />
        <TicketPanel matchId={match?.id ?? ""} />
      </Container>
    </div>
  );
}
