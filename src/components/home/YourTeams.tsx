"use client";

import Link from "next/link";

import { useFollow } from "@/components/home/FollowProvider";
import { findTeamMatch, TeamStatus } from "@/components/home/TeamStatus";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { LogoMark } from "@/components/ui/LogoMark";
import type { MatchSummary } from "@/lib/api/types";

interface YourTeamsProps {
  liveMatches: MatchSummary[];
  upcoming: MatchSummary[];
}

// Signed-in visitors: the teams they follow and what those teams are doing.
export function YourTeams({ liveMatches, upcoming }: YourTeamsProps) {
  const { signedIn, followed } = useFollow();
  if (!signedIn) return null;

  return (
    <section
      aria-labelledby="your-teams-title"
      className="py-[clamp(32px,4vw,48px)]"
    >
      <Container size="page">
        <div className="mb-6 flex flex-col items-start gap-4 min-[641px]:mb-8 min-[641px]:flex-row min-[641px]:flex-wrap min-[641px]:items-end min-[641px]:justify-between">
          <div className="flex flex-col gap-4">
            <p className="-mb-2 text-caption font-semibold text-deep-ember">Following</p>
            <h2
              id="your-teams-title"
              className="text-balance font-graphik text-[clamp(28px,calc(2.2vw+8px),38px)] font-bold leading-[1.2] tracking-[-0.005em] text-ink"
            >
              Your teams right now
            </h2>
          </div>
          <ArrowLink href="#teams">Manage teams</ArrowLink>
        </div>

        {followed.length === 0 ? (
          <div className="rounded-lg border border-stone bg-paper p-5 text-center text-sm text-pencil shadow-subtle">
            Follow a team below to see their matches here.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {followed.map((team) => {
              const { live, next } = findTeamMatch(team, liveMatches, upcoming);
              const target = live ?? next;
              return (
                <Link
                  key={team.id}
                  href={target ? `/matches/${target.id}` : `/teams/${team.id}`}
                  className="flex items-center gap-3.5 rounded-lg border border-stone bg-paper p-4 shadow-subtle transition-colors hover:border-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
                >
                  <LogoMark source={team} size="md" />
                  <div className="min-w-0">
                    <h3 className="font-graphik text-base font-bold text-ink">{team.name}</h3>
                    <div className="mt-0.5">
                      <TeamStatus team={team} liveMatches={liveMatches} upcoming={upcoming} />
                    </div>
                  </div>
                  <span className="ml-auto whitespace-nowrap text-sm font-medium text-cobalt-link">
                    {live ? "Watch" : "View"} →
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
