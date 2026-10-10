import type { Metadata } from "next";
import Link from "next/link";

import { StageTracker } from "@/components/tournaments/StageTracker";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { LiveDot } from "@/components/ui/LiveDot";
import { LogoMark } from "@/components/ui/LogoMark";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEnvelope, getOptional, query } from "@/lib/api/server";
import type { StageInfo, StandingsPayload, TeamSummary, TournamentStatus, TournamentSummary } from "@/lib/api/types";
import { leagueFormat, leagueMark } from "@/lib/leagues";
import { formatDateRange, formatPrizePool } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Tournaments",
  description: "Mobile Legends esports leagues and championships — schedules, standings and venue tickets.",
  alternates: { canonical: "/tournaments" },
};

const STATUS_RANK: Record<TournamentStatus, number> = { ongoing: 0, upcoming: 1, completed: 2 };
const STATUS_BADGE: Record<TournamentStatus, { tone: "green" | "blue" | "neutral"; label: string }> = {
  ongoing: { tone: "green", label: "Ongoing" },
  upcoming: { tone: "blue", label: "Upcoming" },
  completed: { tone: "neutral", label: "Completed" },
};
const READ = { revalidate: 60, tags: ["catalog"] };

// A league card: where the season stands this week and who leads it.
async function LeagueCard({ tournament }: { tournament: TournamentSummary }) {
  const id = tournament?.id ?? "";
  const [stages, standings, teams] = await Promise.all([
    getOptional<StageInfo[]>(`/tournaments/${id}/stages`, READ),
    getOptional<StandingsPayload>(`/tournaments/${id}/standings`, READ),
    getEnvelope<TeamSummary[]>(`/teams${query({ tournament_id: id, pageSize: 1 })}`, READ).catch(() => null),
  ]);
  const live = (stages ?? []).reduce((sum, stage) => sum + (stage?.live_count ?? 0), 0);
  const played = (stages ?? []).reduce((sum, stage) => sum + (stage?.completed_count ?? 0), 0);
  const total = (stages ?? []).reduce((sum, stage) => sum + (stage?.match_count ?? 0), 0);
  const top = (standings?.standings ?? []).slice(0, 3);
  const format = leagueFormat(tournament);
  const prize = formatPrizePool(tournament?.prize_pool);
  const badge = tournament?.status ? STATUS_BADGE[tournament.status] : null;

  return (
    <article className="relative flex flex-col gap-5 rounded-xl border border-stone bg-paper p-6 shadow-subtle transition-[border-color,box-shadow] duration-300 hover:border-[#c5c3c0] hover:shadow-[0_24px_48px_-36px_rgb(37_34_30/0.45)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-deep-ember max-[640px]:p-[18px]">
      <div className="flex items-center gap-4">
        <LogoMark size="lg" {...leagueMark(tournament)} />
        <div className="min-w-0">
          <h2 className="font-graphik text-2xl font-bold leading-tight text-ink max-[640px]:text-xl">
            <Link href={`/tournaments/${id}`} className="after:absolute after:inset-0 hover:text-deep-ember focus-visible:outline-none">
              {tournament?.name ?? "Tournament"}
            </Link>
          </h2>
          <p className="mt-0.5 text-body-sm text-pencil">
            {[tournament?.region, formatDateRange(tournament?.start_date ?? "", tournament?.end_date ?? "")].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className="ml-auto self-start">
          {live > 0 ? (
            <Badge tone="ember">
              <LiveDot />
              {live} live
            </Badge>
          ) : badge ? (
            <Badge tone={badge.tone}>{badge.label}</Badge>
          ) : null}
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-3 border-y border-[#eeecea] py-3.5">
        {[
          { value: String(teams?.meta?.total ?? "—"), label: "teams" },
          { value: total ? `${played}/${total}` : "—", label: "matches played" },
          { value: prize || "TBA", label: "prize pool" },
        ].map((fact) => (
          <div key={fact.label} className="flex flex-col-reverse gap-0.5 text-caption text-pencil">
            <dt>{fact.label}</dt>
            <dd className="font-graphik text-[19px] font-bold text-ink max-[640px]:text-base">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <StageTracker current={tournament?.current_stage} stages={stages ?? []} format={format} />

      {top.length > 0 ? (
        <div>
          <p className="mb-1 text-caption font-semibold text-pencil">Top three</p>
          <ol>
            {top.map((row) => (
              <li
                key={row?.team?.id ?? row?.rank}
                className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-[#eeecea] py-2 text-sm last:border-b-0"
              >
                <span className="text-caption text-pencil">{row?.rank}</span>
                <span className="flex min-w-0 items-center gap-2 font-semibold">
                  <LogoMark source={row?.team} size="sm" />
                  <span className="truncate">{row?.team?.name ?? "TBD"}</span>
                </span>
                <span className="text-caption text-pencil">
                  {row?.wins ?? 0}–{row?.losses ?? 0}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <p className="relative z-[1] flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="inline-flex min-h-9 items-center rounded-lg border border-stone px-3.5 text-[15px] font-semibold text-ink">
          Open league
        </span>
        <Link href={`/matches${query({ tournament: id })}`} className="text-[15px] font-medium text-cobalt-link hover:underline hover:underline-offset-4">
          Matches →
        </Link>
      </p>
    </article>
  );
}

export default async function TournamentsPage() {
  const result = await getOptional<TournamentSummary[]>(`/tournaments${query({ pageSize: 50 })}`, READ);
  const tournaments = [...(result ?? [])].sort(
    (x, y) => (STATUS_RANK[x?.status ?? "completed"] ?? 3) - (STATUS_RANK[y?.status ?? "completed"] ?? 3),
  );

  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <PageHeader
          eyebrow="Tournaments"
          title="Pick a league to follow"
          description="Every league on THUMBZ, where it stands this week and who leads it. More leagues appear here as they are added."
        />
        {result === null ? (
          <EmptyState
            title="Tournaments are temporarily unavailable"
            description="We could not load tournaments right now. Please check back in a minute."
          />
        ) : tournaments.length === 0 ? (
          <EmptyState title="No tournaments yet" description="Tournaments will appear here once they are announced." />
        ) : (
          <div className="grid gap-6 min-[901px]:grid-cols-2">
            {tournaments.map((tournament) => (
              <LeagueCard key={tournament?.id} tournament={tournament} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
