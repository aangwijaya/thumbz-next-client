import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { FollowProvider } from "@/components/home/FollowProvider";
import { Waves } from "@/components/home/Waves";
import { MatchListItem } from "@/components/match/MatchListItem";
import { SeriesPips } from "@/components/match/SeriesPips";
import { HiddenValue, Spoiler } from "@/components/spoiler/Spoiler";
import { RaceLadder, formByTeam } from "@/components/tournaments/RaceLadder";
import { StageTracker } from "@/components/tournaments/StageTracker";
import { TeamWallTile } from "@/components/tournaments/TeamWallTile";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { LiveDot } from "@/components/ui/LiveDot";
import { LogoMark } from "@/components/ui/LogoMark";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tabs } from "@/components/ui/Tabs";
import { apiFetch } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import { getFollowedTeams } from "@/lib/api/favorites";
import { query } from "@/lib/api/server";
import type {
  ApiEnvelope,
  MatchSummary,
  ScheduleGroup,
  StageInfo,
  StandingsPayload,
  TeamSummary,
  TournamentDetail,
} from "@/lib/api/types";
import { leagueFormat, leagueMark, tournamentLabel } from "@/lib/leagues";
import { getAccessToken } from "@/lib/supabase/server";
import { formatDateRange, formatPrizePool, formatStage } from "@/lib/utils/format";

const TAB_ITEMS = [
  { value: "standings", label: "Standings" },
  { value: "schedule", label: "Schedule" },
  { value: "teams", label: "Teams" },
  { value: "results", label: "Results" },
];

type TabValue = "schedule" | "standings" | "teams" | "results";

// cache(): generateMetadata and the page share one request per render.
const fetchTournament = cache(async function fetchTournament(id: string): Promise<TournamentDetail> {
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
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const tournament = await fetchTournament((await params).id);
  return {
    title: tournament?.name ?? "Tournament",
    description: `${tournament?.name ?? "Tournament"} — schedule, standings, teams and results${
      tournament?.region ? ` (${tournament.region})` : ""
    }.`,
    alternates: { canonical: `/tournaments/${tournament?.id}` },
  };
}

function MatchList({ matches, emptyTitle }: { matches: MatchSummary[]; emptyTitle: string }) {
  if (matches.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }
  return (
    <ul className="border-t border-stone">
      {matches.map((match, index) => (
        <MatchListItem key={match?.id ?? index} match={match} />
      ))}
    </ul>
  );
}

const READ = { next: { revalidate: 30, tags: ["catalog"] } };

async function ScheduleTab({ id }: { id: string }) {
  const response = await apiFetch<ApiEnvelope<ScheduleGroup[]>>(`/tournaments/${id}/schedule?pageSize=50`, READ);
  const groups = response?.data ?? [];
  if (groups.length === 0) {
    return <EmptyState title="No scheduled matches" description="The schedule will be published soon." />;
  }
  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group?.stage} aria-label={group?.stage ? formatStage(group.stage) : "Matches"}>
          <h2 className="mb-2 font-graphik text-[19px] font-bold text-ink">
            {group?.stage ? formatStage(group.stage) : "Matches"}
          </h2>
          <MatchList matches={group?.matches ?? []} emptyTitle="No matches in this stage" />
        </section>
      ))}
    </div>
  );
}

// The ladder next to this week's series (live first, then the latest results).
async function StandingsTab({ tournament }: { tournament: TournamentDetail }) {
  const id = tournament?.id ?? "";
  const [standings, results, live] = await Promise.all([
    apiFetch<ApiEnvelope<StandingsPayload>>(`/tournaments/${id}/standings`, READ).catch(() => null),
    apiFetch<ApiEnvelope<MatchSummary[]>>(`/tournaments/${id}/results?pageSize=50`, READ).catch(() => null),
    apiFetch<ApiEnvelope<MatchSummary[]>>(`/matches${query({ tournament_id: id, status: "live", pageSize: 10 })}`, READ).catch(
      () => null,
    ),
  ]);
  const rows = standings?.data?.standings ?? [];
  const format = leagueFormat(tournament);
  const week = [...(live?.data ?? []), ...(results?.data ?? []).slice(0, 5)];

  return (
    <div className="grid gap-8 min-[901px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section aria-labelledby="ladder-title">
        <h2 id="ladder-title" className="mb-3.5 font-graphik text-[21px] font-bold text-ink">
          Standings
        </h2>
        {rows.length === 0 ? (
          <EmptyState title="No standings yet" description="They appear after the first results." />
        ) : (
          <div className="rounded-lg border border-stone bg-paper p-6 shadow-subtle max-[640px]:p-4">
            <RaceLadder
              rows={rows}
              form={formByTeam(results?.data ?? [])}
              playoffSpots={format?.playoffSpots ?? null}
              revealKey={`standings-${id}`}
              caption={format ? `Top ${format.playoffSpots} go to the playoffs` : (tournament?.name ?? "Standings")}
            />
          </div>
        )}
      </section>
      <section aria-labelledby="week-title">
        <h2 id="week-title" className="mb-3.5 font-graphik text-[21px] font-bold text-ink">
          Latest series
        </h2>
        {week.length === 0 ? (
          <EmptyState title="No series yet" />
        ) : (
          <ul className="rounded-lg border border-stone bg-paper px-5 py-1 shadow-subtle">
            {week.map((match) => (
              <WeekRow key={match?.id} match={match} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function WeekRow({ match }: { match: MatchSummary }) {
  const id = match?.id ?? "";
  const live = match?.status === "live";
  const line = (team: MatchSummary["team_a"], score: number | null | undefined, visible: boolean) => (
    <span className="flex min-w-0 items-center gap-2.5 text-sm font-semibold">
      <LogoMark source={team} size="sm" />
      <span className="truncate">{team?.name ?? "TBD"}</span>
      <span className="ml-auto pl-2 font-graphik font-extrabold tabular-nums">{visible ? (score ?? 0) : <HiddenValue>0</HiddenValue>}</span>
    </span>
  );
  return (
    <li className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-[#eeecea] py-3 last:border-b-0 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-deep-ember">
      <span className="flex min-w-0 flex-col gap-1.5">
        <Spoiler matchId={id} safe={<>{line(match?.team_a, 0, false)}{line(match?.team_b, 0, false)}</>}>
          {line(match?.team_a, match?.score_a, true)}
          {line(match?.team_b, match?.score_b, true)}
        </Spoiler>
        <Link href={`/matches/${id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
          <span className="sr-only">
            {match?.team_a?.name ?? "TBD"} vs {match?.team_b?.name ?? "TBD"}
          </span>
        </Link>
      </span>
      {live ? (
        <Badge tone="ember">
          <LiveDot />
          Live
        </Badge>
      ) : (
        <Badge>Final</Badge>
      )}
      <span className="col-span-full">
        <Spoiler matchId={id}>
          <SeriesPips match={match} />
        </Spoiler>
      </span>
    </li>
  );
}

async function TeamsTab({ id }: { id: string }) {
  const [teams, standings, token] = await Promise.all([
    apiFetch<ApiEnvelope<TeamSummary[]>>(`/teams${query({ tournament_id: id, pageSize: 50 })}`, READ),
    apiFetch<ApiEnvelope<StandingsPayload>>(`/tournaments/${id}/standings`, READ).catch(() => null),
    getAccessToken(),
  ]);
  const list = teams?.data ?? [];
  if (list.length === 0) {
    return <EmptyState title="No teams listed" />;
  }
  const byTeam = new Map((standings?.data?.standings ?? []).map((row) => [row?.team?.id ?? "", row]));
  const ordered = [...list].sort((x, y) => (byTeam.get(x?.id ?? "")?.rank ?? 99) - (byTeam.get(y?.id ?? "")?.rank ?? 99));
  const followed = await getFollowedTeams(token);
  return (
    <FollowProvider signedIn={token !== null} initialTeams={followed}>
      <div className="grid gap-3 min-[641px]:grid-cols-2 min-[901px]:grid-cols-4 max-[640px]:[&>article]:w-auto">
        {ordered.map((team) => (
          <TeamWallTile key={team?.id} team={team} row={byTeam.get(team?.id ?? "")} revealKey={`standings-${id}`} />
        ))}
      </div>
    </FollowProvider>
  );
}

async function ResultsTab({ id }: { id: string }) {
  const response = await apiFetch<ApiEnvelope<MatchSummary[]>>(`/tournaments/${id}/results?pageSize=50`, READ);
  return <MatchList matches={response?.data ?? []} emptyTitle="No results yet" />;
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
  const active: TabValue = TAB_ITEMS.some((item) => item.value === tab) ? (tab as TabValue) : "standings";

  const tournament = await fetchTournament(id);
  const [stages, teams] = await Promise.all([
    apiFetch<ApiEnvelope<StageInfo[]>>(`/tournaments/${id}/stages`, READ).catch(() => null),
    apiFetch<ApiEnvelope<TeamSummary[]>>(`/teams${query({ tournament_id: id, pageSize: 1 })}`, READ).catch(() => null),
  ]);
  const live = (stages?.data ?? []).reduce((sum, stage) => sum + (stage?.live_count ?? 0), 0);
  const prize = formatPrizePool(tournament?.prize_pool);
  const format = leagueFormat(tournament);

  return (
    <div className="flex-1 bg-paper">
      <section aria-labelledby="league-title" className="relative isolate overflow-hidden border-b border-stone bg-cream py-[clamp(32px,4vw,56px)]">
        <Waves className="bottom-0 h-[45%] opacity-70" />
        <Container size="page" className="grid items-end gap-x-12 gap-y-6 min-[901px]:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div>
            <p className="mb-3 flex items-center gap-2.5 text-[13px] text-pencil">
              <Link href="/tournaments" className="text-charcoal hover:text-deep-ember">
                Tournaments
              </Link>
              <span aria-hidden="true">/</span>
              <span>{tournamentLabel(tournament)}</span>
            </p>
            <div className="flex items-center gap-5 max-[640px]:gap-3.5">
              <LogoMark size="lg" {...leagueMark(tournament)} />
              <div className="min-w-0">
                <h1 id="league-title" className="font-graphik text-[clamp(30px,calc(2.6vw+8px),44px)] font-bold leading-[1.1] tracking-[-0.01em] text-ink">
                  {tournament?.name ?? "Tournament"}
                </h1>
                <p className="mt-1 text-[13px] text-pencil">
                  {[tournament?.region, formatDateRange(tournament?.start_date ?? "", tournament?.end_date ?? "")].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-body-sm text-pencil">
              {live > 0 ? (
                <li>
                  <Badge tone="ember">
                    <LiveDot />
                    {live} live now
                  </Badge>
                </li>
              ) : tournament?.status ? (
                <li>
                  <StatusBadge status={tournament.status} />
                </li>
              ) : null}
              {teams?.meta?.total ? (
                <li>
                  <b className="font-semibold text-ink">{teams.meta.total}</b> teams
                </li>
              ) : null}
              {prize ? (
                <li>
                  <b className="font-semibold text-ink">{prize}</b> prize pool
                </li>
              ) : null}
            </ul>
            {tournament?.description ? <p className="mt-3 max-w-2xl text-body-sm text-pencil">{tournament.description}</p> : null}
          </div>
          <StageTracker current={tournament?.current_stage} stages={stages?.data ?? []} format={format} />
        </Container>
      </section>

      <Container size="page" className="flex flex-col gap-8 pb-[clamp(32px,4vw,48px)] pt-2">
        <Tabs items={TAB_ITEMS} activeValue={active} ariaLabel="League sections" />
        <div role="tabpanel" id={`tab-panel-${active}`} aria-labelledby={`tab-tab-${active}`}>
          {active === "standings" ? <StandingsTab tournament={tournament} /> : null}
          {active === "schedule" ? <ScheduleTab id={id} /> : null}
          {active === "teams" ? <TeamsTab id={id} /> : null}
          {active === "results" ? <ResultsTab id={id} /> : null}
        </div>
      </Container>
    </div>
  );
}
