import Link from "next/link";

import { FollowButton } from "@/components/home/FollowControls";
import { Waves } from "@/components/home/Waves";
import { Spoiler } from "@/components/spoiler/Spoiler";
import { Container } from "@/components/ui/Container";
import { LogoMark } from "@/components/ui/LogoMark";
import { Rail } from "@/components/ui/Rail";
import { getOptional } from "@/lib/api/server";
import type { StandingsPayload, StandingsRow, TeamSummary } from "@/lib/api/types";
import { shortTeamName } from "@/lib/utils/format";
import { DEFAULT_TEAM_B_COLOR } from "@/lib/utils/team-colors";

interface TeamsProps {
  teams: TeamSummary[];
  /** The league the page shows: its standings give rank and record. */
  tournamentId: string | null;
}

/** A team wall: one tile per team, washed in its colour, with its rank and record in the league. */
export async function Teams({ teams, tournamentId }: TeamsProps) {
  const standings = tournamentId
    ? await getOptional<StandingsPayload>(`/tournaments/${tournamentId}/standings`)
    : null;
  const byTeam = new Map<string, StandingsRow>();
  for (const row of standings?.standings ?? []) {
    if (row?.team?.id) byTeam.set(row.team.id, row);
  }
  // Standings order first; teams without a row keep the API's order after them.
  const ordered = [...teams].sort(
    (x, y) => (byTeam.get(x?.id ?? "")?.rank ?? 99) - (byTeam.get(y?.id ?? "")?.rank ?? 99),
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
          <p className="-mb-2 text-caption font-semibold text-deep-ember">Teams</p>
          <h2
            id="teams-title"
            className="text-balance font-graphik text-[clamp(28px,calc(2.2vw+8px),38px)] font-bold leading-[1.2] tracking-[-0.005em] text-ink"
          >
            Follow the teams you root for
          </h2>
          <p className="max-w-[46ch] text-body text-pencil">
            Followed teams show first in Live, Schedule and Replays, and you get a reminder before they play.
          </p>
        </div>

        <Rail grid="min-[641px]:grid-cols-2 min-[901px]:grid-cols-4" gap="gap-3">
          {ordered.map((team, index) => {
            const row = byTeam.get(team?.id ?? "");
            const color = team?.color_primary || DEFAULT_TEAM_B_COLOR;
            const played = (row?.wins ?? 0) + (row?.losses ?? 0);
            return (
              <article
                key={team?.id ?? index}
                className="relative flex min-h-[212px] flex-col gap-3 overflow-hidden rounded-xl border p-[18px] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-[3px] motion-reduce:transition-none motion-reduce:hover:translate-y-0 max-[640px]:min-h-[196px] max-[640px]:w-[200px]"
                style={{
                  borderColor: `color-mix(in oklab, ${color} 30%, var(--color-stone))`,
                  background: `color-mix(in oklab, ${color} 9%, var(--color-paper))`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <LogoMark source={team} size="sm" />
                  {row ? (
                    <Spoiler matchId={revealKey}>
                      <span
                        className="text-caption font-semibold"
                        style={{ color: `color-mix(in oklab, ${color} 45%, var(--color-ink))` }}
                      >
                        #{row.rank}
                      </span>
                    </Spoiler>
                  ) : null}
                </div>
                <p
                  aria-hidden="true"
                  className="mt-auto font-graphik text-[clamp(40px,3.4vw,54px)] font-extrabold leading-[0.9] tracking-[-0.035em]"
                  style={{ color: `color-mix(in oklab, ${color} 62%, var(--color-ink))` }}
                >
                  {shortTeamName(team)}
                </p>
                <div>
                  <h3 className="font-graphik text-[15px] font-bold leading-snug text-ink">
                    <Link
                      href={`/teams/${team?.id ?? ""}`}
                      className="rounded-lg hover:underline hover:underline-offset-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
                    >
                      {team?.name ?? "Unknown team"}
                    </Link>
                  </h3>
                  <p className="text-[13px] text-charcoal">
                    {row ? (
                      <Spoiler matchId={revealKey} safe={<span>{team?.region ?? ""}</span>}>
                        <span>
                          {row.wins}–{row.losses}
                          {played > 0 ? ` · ${Math.round((row.wins / played) * 100)}% wins` : ""}
                        </span>
                      </Spoiler>
                    ) : (
                      (team?.region ?? "")
                    )}
                  </p>
                </div>
                <FollowButton team={team} />
              </article>
            );
          })}
        </Rail>
      </Container>
    </section>
  );
}
