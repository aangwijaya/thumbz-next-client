import type { Metadata } from "next";

import { MatchDayList } from "@/components/match/MatchDayList";
import { LeagueBar } from "@/components/tournaments/LeagueBar";
import { getLiveCounts, getTournaments, tournamentLabel } from "@/lib/api/tournaments";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { getEnvelope, query } from "@/lib/api/server";
import type { MatchStatus, MatchSummary } from "@/lib/api/types";
import {
  enumParam,
  hrefWith,
  pageParam,
  param,
  type SearchParamsRecord,
} from "@/lib/utils/search-params";

const STATUSES = ["live", "scheduled", "completed"] as const satisfies readonly MatchStatus[];
/** Sized for the demo's one week of matches, so the list still pages. */
const PAGE_SIZE = 6;

const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  live: "Live",
  scheduled: "Upcoming",
  completed: "Results",
};

type Props = { searchParams: Promise<SearchParamsRecord> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const status = enumParam(await searchParams, "status", STATUSES);
  return {
    title: status ? `${STATUS_LABELS[status]} matches` : "Matches",
    description: "Every Mobile Legends esports match: live now, upcoming schedule and results.",
    alternates: { canonical: "/matches" },
  };
}

export default async function MatchesPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = enumParam(params, "status", STATUSES);
  const tournamentId = param(params, "tournament");
  const teamId = param(params, "team");
  const page = pageParam(params);
  // Upcoming reads soonest first; everything else most recent first.
  const order = status === "scheduled" ? "asc" : "desc";

  const [list, tournaments, liveCounts] = await Promise.all([
    getEnvelope<MatchSummary[]>(
      `/matches${query({
        status,
        tournament_id: tournamentId,
        team_id: teamId,
        page,
        pageSize: PAGE_SIZE,
        sort: "scheduled_at",
        order,
      })}`,
      { revalidate: status === "live" ? 10 : 30, tags: ["matches", "live", "catalog"] },
    ),
    getTournaments(),
    getLiveCounts(),
  ]);

  const matches = list?.data ?? [];
  const totalPages = list?.meta?.totalPages ?? 1;
  const current = { status, tournament: tournamentId, team: teamId };
  const href = (patch: Record<string, string | number | null>) =>
    hrefWith("/matches", current, { page: null, ...patch });

  return (
    <div className="flex-1 bg-paper">
      <LeagueBar
        allHref="/tournaments"
        tabs={[
          {
            key: "all",
            label: "All",
            title: "All tournaments",
            href: href({ tournament: null }),
            active: !tournamentId,
            live: 0,
            divider: true,
          },
          ...tournaments.map((tournament) => ({
            key: tournament?.id ?? "",
            label: tournamentLabel(tournament),
            title: tournament?.name ?? "Tournament",
            href: href({ tournament: tournament?.id ?? null }),
            active: tournamentId === tournament?.id,
            live: liveCounts[tournament?.id ?? ""] ?? 0,
          })),
        ]}
      />
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <PageHeader
          eyebrow="Schedule & results"
          title="Matches"
          description="Live games, the upcoming schedule in your local time, and every result."
        />

        <div className="flex flex-col gap-3">
          <FilterChips
            label="Match status"
            chips={[
              { label: "All", href: href({ status: null }), active: !status },
              ...STATUSES.map((value) => ({
                label: STATUS_LABELS[value],
                href: href({ status: value }),
                active: status === value,
              })),
            ]}
          />
        </div>

        {matches.length === 0 ? (
          <EmptyState
            title="No matches here"
            description="Try another status or tournament."
          />
        ) : (
          <MatchDayList matches={matches} />
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          hrefFor={(n) => hrefWith("/matches", current, { page: n === 1 ? null : n })}
          label="Match pages"
        />
      </Container>
    </div>
  );
}
