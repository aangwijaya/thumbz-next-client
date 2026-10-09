import type { Metadata } from "next";

import { EmptyState } from "@/components/ui/EmptyState";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TournamentCard } from "@/components/cards/TournamentCard";
import { apiFetch } from "@/lib/api/client";
import type { ApiEnvelope, TournamentSummary, TournamentStatus } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "Mobile Legends esports leagues and championships — schedules, standings and venue tickets.",
  alternates: { canonical: "/tournaments" },
};

const STATUS_ORDER: Array<{ status: TournamentStatus; title: string }> = [
  { status: "ongoing", title: "Ongoing" },
  { status: "upcoming", title: "Upcoming" },
  { status: "completed", title: "Completed" },
];

/** null = the API could not be reached (distinct from "no tournaments"). */
async function fetchTournaments(): Promise<TournamentSummary[] | null> {
  try {
    const response = await apiFetch<ApiEnvelope<TournamentSummary[]>>(
      "/tournaments?pageSize=50",
      { next: { revalidate: 60, tags: ["catalog"] } },
    );
    return response?.data ?? [];
  } catch {
    // Static page: an unreachable API must not fail the build. The next ISR
    // revalidation (60 s) replaces this state once the API is back.
    return null;
  }
}

export default async function TournamentsPage() {
  const result = await fetchTournaments();
  const tournaments = result ?? [];

  return (
    <div className="flex-1 bg-page-dark">
      <Container size="wide" className="flex flex-col gap-6 py-8 sm:gap-10 sm:py-12">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            Tournaments
          </h1>
          <p className="max-w-xl text-sm text-text-secondary">
            Mobile Legends esports leagues and championships — schedules,
            standings, and venue tickets.
          </p>
        </div>

        {result === null ? (
          <EmptyState
            title="Tournaments are temporarily unavailable"
            description="We could not load tournaments right now. Please check back in a minute."
          />
        ) : tournaments.length === 0 ? (
          <EmptyState
            title="No tournaments yet"
            description="Tournaments will appear here once they are announced."
          />
        ) : (
          STATUS_ORDER.map(({ status, title }) => {
            const group = tournaments.filter((t) => t?.status === status);
            if (group.length === 0) return null;
            return (
              <section key={status} className="flex flex-col gap-5 border-t border-page-dark-border pt-8 first:border-t-0 first:pt-0">
                <SectionHeader title={title} />
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {group.map((tournament) => (
                    <TournamentCard key={tournament?.id} tournament={tournament} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </Container>
    </div>
  );
}
