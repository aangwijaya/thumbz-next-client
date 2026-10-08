import Image from "next/image";
import { notFound } from "next/navigation";

import { MatchRow } from "@/components/match/MatchRow";
import { StandingsTable } from "@/components/tournaments/StandingsTable";
import { TeamCard } from "@/components/cards/TeamCard";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tabs } from "@/components/ui/Tabs";
import { apiFetch } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type {
  ApiEnvelope,
  MatchSummary,
  ScheduleGroup,
  StandingsPayload,
  TeamSummary,
  TournamentDetail,
} from "@/lib/api/types";
import { formatDate, formatStage, initialsOf } from "@/lib/utils/format";

const TAB_ITEMS = [
  { value: "schedule", label: "Schedule" },
  { value: "standings", label: "Standings" },
  { value: "teams", label: "Teams" },
  { value: "results", label: "Results" },
];

type TabValue = "schedule" | "standings" | "teams" | "results";

async function fetchTournament(id: string): Promise<TournamentDetail> {
  try {
    const response = await apiFetch<ApiEnvelope<TournamentDetail>>(
      `/tournaments/${id}`,
      { next: { revalidate: 30, tags: ["catalog"] } },
    );
    return response?.data;
  } catch (error) {
    if (isApiError(error) && error.status === 404) notFound();
    throw error;
  }
}

function MatchList({ matches, emptyTitle }: { matches: MatchSummary[]; emptyTitle: string }) {
  if (matches.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }
  return (
    <div className="border-t border-page-dark-border">
      {matches.map((match, index) => (
        <MatchRow key={match?.id ?? index} match={match} />
      ))}
    </div>
  );
}

async function ScheduleTab({ id }: { id: string }) {
  const response = await apiFetch<ApiEnvelope<ScheduleGroup[]>>(
    `/tournaments/${id}/schedule?pageSize=50`,
    { next: { revalidate: 30, tags: ["catalog"] } },
  );
  const groups = response?.data ?? [];
  if (groups.length === 0) {
    return <EmptyState title="No scheduled matches" description="The schedule will be published soon." />;
  }
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <div key={group?.stage}>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            {group?.stage ? formatStage(group.stage) : "Matches"}
          </p>
          <MatchList matches={group?.matches ?? []} emptyTitle="No matches in this stage" />
        </div>
      ))}
    </div>
  );
}

async function StandingsTab({ id }: { id: string }) {
  const response = await apiFetch<ApiEnvelope<StandingsPayload>>(
    `/tournaments/${id}/standings`,
    { next: { revalidate: 30, tags: ["catalog"] } },
  );
  return <StandingsTable standings={response?.data} />;
}

async function TeamsTab({ id }: { id: string }) {
  const response = await apiFetch<ApiEnvelope<TeamSummary[]>>(
    `/tournaments/${id}/teams`,
    { next: { revalidate: 30, tags: ["catalog"] } },
  );
  const teams = response?.data ?? [];
  if (teams.length === 0) {
    return <EmptyState title="No teams listed" />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {teams.map((team) => (
        <TeamCard key={team?.id} team={team} />
      ))}
    </div>
  );
}

async function ResultsTab({ id }: { id: string }) {
  const response = await apiFetch<ApiEnvelope<MatchSummary[]>>(
    `/tournaments/${id}/results?pageSize=50`,
    { next: { revalidate: 30, tags: ["catalog"] } },
  );
  return (
    <MatchList
      matches={response?.data ?? []}
      emptyTitle="No results yet"
    />
  );
}

export default async function TournamentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const active: TabValue = TAB_ITEMS.some((item) => item.value === tab)
    ? (tab as TabValue)
    : "schedule";

  const tournament = await fetchTournament(id);
  const dates = [
    tournament?.start_date ? formatDate(tournament.start_date) : null,
    tournament?.end_date ? formatDate(tournament.end_date) : null,
  ]
    .filter(Boolean)
    .join(" – ");

  return (
    <div className="flex-1 bg-page-dark">
      <Container size="wide" className="flex flex-col gap-6 py-8 sm:gap-8 sm:py-12">
        <header className="flex flex-col gap-4 border-b border-page-dark-border pb-6 sm:flex-row sm:items-center sm:gap-6">
          {tournament?.logo_url ? (
            <Image
              src={tournament.logo_url}
              alt={`${tournament?.name ?? "Tournament"} logo`}
              width={64}
              height={64}
              className="shrink-0 rounded-md object-contain"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-16 shrink-0 items-center justify-center rounded-md bg-page-dark-surface font-mono text-lg text-text-secondary"
            >
              {initialsOf(tournament?.name ?? "?")}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
                {tournament?.name ?? "Tournament"}
              </h1>
              {tournament?.status ? <StatusBadge status={tournament.status} /> : null}
            </div>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-text-secondary">
              {[tournament?.region, dates, tournament?.prize_pool].filter(Boolean).join(" · ")}
            </p>
          </div>
        </header>

        {tournament?.description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
            {tournament.description}
          </p>
        ) : null}

        <Tabs items={TAB_ITEMS} activeValue={active} ariaLabel="Tournament sections" />

        <div role="tabpanel" id={`tab-panel-${active}`} aria-labelledby={`tab-tab-${active}`}>
          {active === "schedule" ? <ScheduleTab id={id} /> : null}
          {active === "standings" ? <StandingsTab id={id} /> : null}
          {active === "teams" ? <TeamsTab id={id} /> : null}
          {active === "results" ? <ResultsTab id={id} /> : null}
        </div>
      </Container>
    </div>
  );
}
