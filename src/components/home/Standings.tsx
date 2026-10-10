import { FeatureRow } from "@/components/home/FeatureRow";
import { RaceLadder, formByTeam } from "@/components/tournaments/RaceLadder";
import { StageTracker } from "@/components/tournaments/StageTracker";
import { getOptional, query } from "@/lib/api/server";
import { tournamentLabel } from "@/lib/api/tournaments";
import type { MatchSummary, StageInfo, StandingsPayload, TournamentSummary } from "@/lib/api/types";
import { leagueFormat } from "@/lib/leagues";

/** "The race to the MPL PH playoffs": stage tracker and standings ladder of the league the page shows. */
export async function Standings({ tournament }: { tournament: TournamentSummary }) {
  const id = tournament?.id ?? "";
  const [standings, stages, results] = await Promise.all([
    getOptional<StandingsPayload>(`/tournaments/${id}/standings`),
    getOptional<StageInfo[]>(`/tournaments/${id}/stages`),
    getOptional<MatchSummary[]>(`/tournaments/${id}/results${query({ pageSize: 50 })}`),
  ]);
  const rows = standings?.standings ?? [];
  if (rows.length === 0) return null;
  const format = leagueFormat(tournament);
  const label = tournamentLabel(tournament);

  return (
    <FeatureRow
      id="standings"
      eyebrow="Standings"
      title={`The race to the ${label} playoffs`}
      body={`${format ? `The top ${format.playoffSpots} after week ${format.weeks} move on. ` : ""}Bars show each team's win rate in its own colours; the last five results read left to right.`}
      action={{ href: `/tournaments/${id}?tab=standings`, label: "Full standings" }}
    >
      <div className="rounded-lg border border-stone bg-paper p-6 shadow-subtle max-[640px]:p-4">
        <StageTracker current={tournament?.current_stage} stages={stages ?? []} format={format} className="mb-[22px]" />
        <RaceLadder
          rows={rows}
          form={formByTeam(results ?? [])}
          playoffSpots={format?.playoffSpots ?? null}
          revealKey={`standings-${id}`}
          caption={tournament?.name ?? "Standings"}
        />
      </div>
    </FeatureRow>
  );
}

/** Same footprint as the section while its standings load (no layout shift). */
export function StandingsFallback() {
  return (
    <section aria-hidden="true" className="py-[clamp(32px,4vw,48px)]">
      <div className="mx-auto grid w-full max-w-[1200px] gap-7 px-5 sm:px-6 lg:px-8 min-[901px]:grid-cols-[minmax(0,40fr)_minmax(0,60fr)]">
        <div className="flex flex-col gap-4">
          <div className="h-3 w-28 rounded-md bg-stone/40 motion-safe:animate-pulse" />
          <div className="h-9 w-4/5 rounded-md bg-stone/40 motion-safe:animate-pulse" />
        </div>
        <div className="h-[520px] rounded-lg bg-stone/30 motion-safe:animate-pulse" />
      </div>
    </section>
  );
}
