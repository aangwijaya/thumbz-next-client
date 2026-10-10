import { Waves } from "@/components/home/Waves";
import { TeamWallTile } from "@/components/tournaments/TeamWallTile";
import { Container } from "@/components/ui/Container";
import { Rail } from "@/components/ui/Rail";
import { getOptional } from "@/lib/api/server";
import type {
  StandingsPayload,
  StandingsRow,
  TeamSummary,
} from "@/lib/api/types";

interface TeamsProps {
  teams: TeamSummary[];
  /** The league the page shows: its standings give rank and record. */
  tournamentId: string | null;
}

/** A team wall: one tile per team, washed in its colour, with its rank and record in the league. */
export async function Teams({ teams, tournamentId }: TeamsProps) {
  const standings = tournamentId
    ? await getOptional<StandingsPayload>(
        `/tournaments/${tournamentId}/standings`,
      )
    : null;
  const byTeam = new Map<string, StandingsRow>();
  for (const row of standings?.standings ?? []) {
    if (row?.team?.id) byTeam.set(row.team.id, row);
  }
  // Standings order first; teams without a row keep the API's order after them.
  const ordered = [...teams].sort(
    (x, y) =>
      (byTeam.get(x?.id ?? "")?.rank ?? 99) -
      (byTeam.get(y?.id ?? "")?.rank ?? 99),
  );
  const revealKey = `standings-${tournamentId ?? ""}`;

  return (
    <section
      id="teams"
      aria-labelledby="teams-title"
      className="relative isolate my-[clamp(8px,1vw,16px)] scroll-mt-32 overflow-hidden bg-cream py-[clamp(48px,6vw,80px)]"
    >
      <Waves className="top-0 h-full" />

      <Container size="page">
        <div className="mb-6 flex flex-col items-start gap-4 min-[641px]:mb-10 min-[641px]:items-center min-[641px]:text-center">
          <p className="-mb-2 text-caption font-semibold text-deep-ember">
            Teams
          </p>
          <h2
            id="teams-title"
            className="text-balance font-graphik text-[clamp(28px,calc(2.2vw+8px),38px)] font-bold leading-[1.2] tracking-[-0.005em] text-ink"
          >
            Follow the teams you root for
          </h2>
          <p className="max-w-[46ch] text-body text-pencil">
            Followed teams show first in Live, Schedule and Replays, and you get
            a reminder before they play.
          </p>
        </div>

        <Rail
          grid="min-[641px]:grid-cols-2 min-[901px]:grid-cols-4"
          gap="gap-3"
        >
          {ordered.map((team, index) => (
            <TeamWallTile
              key={team?.id ?? index}
              team={team}
              row={byTeam.get(team?.id ?? "")}
              revealKey={revealKey}
            />
          ))}
        </Rail>
      </Container>
    </section>
  );
}
