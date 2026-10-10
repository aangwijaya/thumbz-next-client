import type { Metadata } from "next";

import { MatchDayList } from "@/components/match/MatchDayList";
import { StatusTabs } from "@/components/match/StatusTabs";
import { WeekStrip } from "@/components/match/WeekStrip";
import { LeagueBar } from "@/components/tournaments/LeagueBar";
import { getLiveCounts, getTournaments } from "@/lib/api/tournaments";
import { tournamentLabel } from "@/lib/leagues";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
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
import { dayBounds, dayParam, shiftDay, weekDays } from "@/lib/utils/week";

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
  const day = dayParam(param(params, "day"));
  const page = pageParam(params);
  const today = new Date().toISOString().slice(0, 10);
  const week = weekDays(day ?? today);
  const bounds = day ? dayBounds(day) : null;
  // Upcoming reads soonest first; everything else most recent first.
  const order = status === "scheduled" ? "asc" : "desc";

  const total = (statusFilter?: string) =>
    getEnvelope<MatchSummary[]>(
      `/matches${query({ status: statusFilter, tournament_id: tournamentId, team_id: teamId, from: bounds?.from, to: bounds?.to, pageSize: 1 })}`,
      { revalidate: 30, tags: ["matches", "live", "catalog"] },
    ).then((envelope) => envelope?.meta?.total ?? null, () => null);

  const [list, tournaments, liveCounts, weekList, counts] = await Promise.all([
    getEnvelope<MatchSummary[]>(
      `/matches${query({
        status,
        tournament_id: tournamentId,
        team_id: teamId,
        from: bounds?.from,
        to: bounds?.to,
        page,
        pageSize: PAGE_SIZE,
        sort: "scheduled_at",
        order,
      })}`,
      { revalidate: status === "live" ? 10 : 30, tags: ["matches", "live", "catalog"] },
    ),
    getTournaments(),
    getLiveCounts(),
    // One read for the week strip's dots.
    getEnvelope<MatchSummary[]>(
      `/matches${query({
        tournament_id: tournamentId,
        team_id: teamId,
        from: dayBounds(week[0] ?? today).from,
        to: dayBounds(week[6] ?? today).to,
        pageSize: 50,
      })}`,
      { revalidate: 30, tags: ["matches", "live", "catalog"] },
    ).catch(() => null),
    Promise.all([total(), ...STATUSES.map((value) => total(value))]),
  ]);

  const matches = list?.data ?? [];
  const totalPages = list?.meta?.totalPages ?? 1;
  const current = { status, tournament: tournamentId, team: teamId, day: day ?? undefined };
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
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <PageHeader
            eyebrow="Schedule & results"
            title="Matches"
            description="Live games, the upcoming schedule in your local time, and every result."
          />
          <StatusTabs
            tabs={[
              { label: "All", href: href({ status: null }), active: !status, count: counts[0] ?? null },
              ...STATUSES.map((value, index) => ({
                label: STATUS_LABELS[value],
                href: href({ status: value }),
                active: status === value,
                count: counts[index + 1] ?? null,
                live: value === "live",
              })),
            ]}
          />
        </div>

        <WeekStrip
          prevHref={href({ day: shiftDay(week[0] ?? today, -7) })}
          nextHref={href({ day: shiftDay(week[0] ?? today, 7) })}
          days={week.map((date) => {
            const inDay = (weekList?.data ?? []).filter((match) => match?.scheduled_at?.slice(0, 10) === date);
            return {
              day: date,
              href: href({ day: day === date ? null : date }),
              active: day === date,
              today: date === today,
              matches: inDay.length,
              live: inDay.filter((match) => match?.status === "live").length,
            };
          })}
        />

        {matches.length === 0 ? (
          <EmptyState
            title="No matches here"
            description={day ? "No matches on this day. Pick another day or clear it." : "Try another status or tournament."}
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
