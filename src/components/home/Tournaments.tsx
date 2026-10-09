import Link from "next/link";

import { FeatureRow } from "@/components/home/FeatureRow";
import { RevealButton, Spoiler } from "@/components/spoiler/Spoiler";
import { Badge } from "@/components/ui/Badge";
import { LogoMark } from "@/components/ui/LogoMark";
import { apiFetch } from "@/lib/api/client";
import type {
  ApiEnvelope,
  StandingsPayload,
  StandingsRow,
  TournamentStatus,
  TournamentSummary,
} from "@/lib/api/types";
import { formatDateRange, formatPrizePool } from "@/lib/utils/format";

interface TournamentsProps {
  tournaments: TournamentSummary[];
}

const TOP_TEAMS = 4;

const statusBadges: Record<
  TournamentStatus,
  { tone: "green" | "blue" | "neutral"; label: string }
> = {
  ongoing: { tone: "green", label: "Ongoing" },
  upcoming: { tone: "blue", label: "Upcoming" },
  completed: { tone: "neutral", label: "Completed" },
};

const cardClass =
  "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-4 rounded-lg border border-stone bg-paper p-5 shadow-subtle sm:grid-cols-[auto_minmax(0,1fr)_auto]";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

// The standings only decorate the card, so a failure just leaves them out.
async function fetchTopStandings(tournamentId: string): Promise<StandingsRow[]> {
  try {
    const response = await apiFetch<ApiEnvelope<StandingsPayload>>(
      `/tournaments/${tournamentId}/standings`,
      { next: { revalidate: 30 } },
    );
    return (response?.data?.standings ?? []).slice(0, TOP_TEAMS);
  } catch {
    return [];
  }
}

function TournamentInfo({
  tournament,
  linked,
}: {
  tournament: TournamentSummary;
  /** The name is its own link (the card is not one). */
  linked: boolean;
}) {
  const badge = tournament?.status ? statusBadges[tournament.status] : undefined;
  const dates = formatDateRange(tournament?.start_date ?? "", tournament?.end_date ?? "");
  const prize = formatPrizePool(tournament?.prize_pool);
  const name = tournament?.name ?? "Unknown tournament";

  return (
    <>
      <LogoMark source={tournament} size="lg" />

      <div className="min-w-0">
        <h3 className="font-graphik text-[19px] font-bold leading-[1.3] text-ink">
          {linked ? (
            <Link
              href={`/tournaments/${tournament?.id ?? ""}`}
              className={`rounded-lg transition-colors hover:text-deep-ember ${focusRing}`}
            >
              {name}
            </Link>
          ) : (
            name
          )}
        </h3>
        <p className="text-body-sm text-pencil">
          {[tournament?.region, dates].filter(Boolean).join(" · ")}
        </p>
        {badge ? (
          <Badge tone={badge.tone} className="mt-1.5">
            {badge.label}
          </Badge>
        ) : null}
      </div>

      {prize ? (
        <p className="col-start-2 sm:col-start-3 sm:row-start-1 sm:text-right">
          <b className="mr-1.5 font-graphik text-[19px] font-bold text-ink sm:mr-0 sm:block">
            {prize}
          </b>
          <span className="text-caption text-pencil">Prize pool</span>
        </p>
      ) : null}
    </>
  );
}

const th = "border-b border-stone py-1.5 text-caption font-medium text-pencil";
const td = "border-b border-[#eeecea] py-2 group-last:border-b-0";

function StandingsTable({ tournamentId, rows }: { tournamentId: string; rows: StandingsRow[] }) {
  const revealKey = `standings-${tournamentId}`;

  return (
    <table className="col-span-full mt-1 w-full border-collapse text-body-sm">
      <caption className="pb-1.5 text-left text-caption font-semibold text-pencil">
        Standings, top {TOP_TEAMS}
        <RevealButton matchId={revealKey} className="ml-2.5 align-middle">
          Show standings
        </RevealButton>
      </caption>
      <thead>
        <tr>
          <th scope="col" className={`${th} w-7 text-left`}>
            #
          </th>
          <th scope="col" className={`${th} text-left`}>
            Team
          </th>
          <th scope="col" className={`${th} text-right`}>
            W–L
          </th>
          <th scope="col" className={`${th} text-right`}>
            Win rate
          </th>
        </tr>
      </thead>
      <tbody>
        <Spoiler
          matchId={revealKey}
          safe={rows.map((row) => (
            <tr key={row?.rank} aria-hidden="true" className="group select-none blur-[6px]">
              <td className={`${td} text-left text-pencil`}>0</td>
              <td className={`${td} text-left font-semibold`}>Team name</td>
              <td className={`${td} text-right`}>00–00</td>
              <td className={`${td} text-right`}>00%</td>
            </tr>
          ))}
        >
          {rows.map((row) => {
            const percent = Math.round((row?.win_rate ?? 0) * 100);
            return (
              <tr key={row?.team?.id ?? row?.rank} className="group">
                <td className={`${td} text-left text-pencil`}>{row?.rank}</td>
                <td className={`${td} text-left`}>
                  <span className="inline-flex items-center gap-2 align-middle font-semibold">
                    <LogoMark source={row?.team} size="sm" />
                    {row?.team?.name ?? "TBD"}
                  </span>
                </td>
                <td className={`${td} text-right`}>
                  {row?.wins ?? 0}–{row?.losses ?? 0}
                </td>
                <td className={`${td} text-right`}>
                  <span className="inline-flex items-center justify-end gap-2 align-middle">
                    <i
                      aria-hidden="true"
                      className="relative hidden h-1 w-14 overflow-hidden rounded-sm bg-[#eeecea] min-[561px]:inline-block"
                    >
                      <span
                        className="absolute inset-y-0 left-0 rounded-sm bg-teal-dusk"
                        style={{ width: `${percent}%` }}
                      />
                    </i>
                    {percent}%
                  </span>
                </td>
              </tr>
            );
          })}
        </Spoiler>
      </tbody>
    </table>
  );
}

export async function Tournaments({ tournaments }: TournamentsProps) {
  // The standings go on the first tournament that is running, else the first one.
  const withStandings = tournaments.find((tournament) => tournament?.status === "ongoing") ?? tournaments[0];
  const standings = withStandings?.id ? await fetchTopStandings(withStandings.id) : [];

  return (
    <FeatureRow
      id="tournaments"
      eyebrow="Tournaments"
      title="Follow the tournaments that matter"
      body="Standings, brackets and results for every league, updated after each series."
      action={{ href: "/tournaments", label: "All tournaments" }}
    >
      <div className="flex flex-col gap-3">
        {tournaments.map((tournament, index) => {
          if (tournament?.id === withStandings?.id && standings.length > 0) {
            return (
              <div key={tournament.id} className={cardClass}>
                <TournamentInfo tournament={tournament} linked />
                <StandingsTable tournamentId={tournament.id} rows={standings} />
              </div>
            );
          }
          return (
            <Link
              key={tournament?.id ?? index}
              href={`/tournaments/${tournament?.id ?? ""}`}
              className={`${cardClass} transition-colors hover:border-graphite ${focusRing}`}
            >
              <TournamentInfo tournament={tournament} linked={false} />
            </Link>
          );
        })}
      </div>
    </FeatureRow>
  );
}

/** Same footprint as the section while its standings load (no layout shift). */
export function TournamentsFallback() {
  return (
    <section aria-hidden="true" className="py-[clamp(32px,4vw,48px)]">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 sm:px-6 lg:px-8">
        <div className="h-3 w-28 rounded-md bg-stone/40 motion-safe:animate-pulse" />
        <div className="h-9 w-2/3 max-w-md rounded-md bg-stone/40 motion-safe:animate-pulse" />
        <div className="grid gap-4 min-[901px]:grid-cols-2">
          {[0, 1].map((key) => (
            <div key={key} className="h-[280px] rounded-image bg-stone/30 motion-safe:animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}
