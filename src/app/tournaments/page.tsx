import { EmptyState } from "@/components/ui/EmptyState";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TournamentCard } from "@/components/cards/TournamentCard";
import { apiFetch } from "@/lib/api/client";
import type { ApiEnvelope, TournamentSummary, TournamentStatus } from "@/lib/api/types";

export const dynamic = "force-dynamic";

const STATUS_ORDER: Array<{ status: TournamentStatus; title: string }> = [
  { status: "ongoing", title: "Ongoing" },
  { status: "upcoming", title: "Upcoming" },
  { status: "completed", title: "Completed" },
];

async function fetchTournaments(): Promise<TournamentSummary[]> {
  const response = await apiFetch<ApiEnvelope<TournamentSummary[]>>(
    "/tournaments?pageSize=50",
    { cache: "no-store" },
  );
  return response?.data ?? [];
}

export default async function TournamentsPage() {
  const tournaments = await fetchTournaments();

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

        {tournaments.length === 0 ? (
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
