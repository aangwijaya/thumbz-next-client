import Link from "next/link";

import { FollowButton } from "@/components/home/FollowControls";
import { TeamStatus } from "@/components/home/TeamStatus";
import { Waves } from "@/components/home/Waves";
import { Container } from "@/components/ui/Container";
import { Rail } from "@/components/ui/Rail";
import { LogoMark } from "@/components/ui/LogoMark";
import type { MatchSummary, TeamSummary } from "@/lib/api/types";

interface TeamsProps {
  teams: TeamSummary[];
  liveMatches: MatchSummary[];
  upcoming: MatchSummary[];
}

export function Teams({ teams, liveMatches, upcoming }: TeamsProps) {
  return (
    <section
      id="teams"
      aria-labelledby="teams-title"
      className="relative isolate scroll-mt-24 my-[clamp(8px,1vw,16px)] overflow-hidden bg-cream py-[clamp(48px,6vw,80px)]"
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
          <p className="max-w-[44ch] text-body text-pencil">
            Followed teams show up first on your home page, with their live and next matches.
          </p>
        </div>

        <Rail grid="min-[641px]:grid-cols-2 min-[901px]:grid-cols-4" gap="gap-3">
          {teams.map((team, index) => (
            <div
              key={team?.id ?? index}
              className="flex flex-col gap-3.5 rounded-lg border border-stone bg-paper p-4 shadow-subtle max-[640px]:w-[236px]"
            >
              <div className="flex items-center gap-3">
                <LogoMark source={team} size="lg" />
                <div className="min-w-0">
                  <h3 className="font-graphik text-base font-bold leading-[1.3] text-ink">
                    <Link
                      href={`/teams/${team?.id ?? ""}`}
                      className="rounded-lg transition-colors hover:text-deep-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
                    >
                      {team?.name ?? "Unknown team"}
                    </Link>
                  </h3>
                  <p className="text-[13px] text-pencil">{team?.region ?? ""}</p>
                </div>
              </div>
              <div className="min-h-5">
                <TeamStatus team={team} liveMatches={liveMatches} upcoming={upcoming} />
              </div>
              <FollowButton team={team} />
            </div>
          ))}
        </Rail>
      </Container>
    </section>
  );
}
