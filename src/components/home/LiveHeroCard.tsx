import Image from "next/image";
import Link from "next/link";

import { LiveIndicator } from "@/components/ui/LiveIndicator";
import type { MatchSummary, TeamSummary } from "@/lib/api/types";
import { formatStage } from "@/lib/utils/format";

import { TeamLogo } from "../cards/TeamLogo";

interface LiveHeroCardProps {
  match: MatchSummary;
  priority?: boolean;
}

function TeamLockup({ team }: { team?: TeamSummary | null }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2.5">
      <TeamLogo
        team={team}
        size={64}
        className="size-12 sm:size-20 2xl:size-24"
      />
      <span className="text-balance text-center text-base font-semibold leading-snug text-page-light-text sm:text-lg 2xl:text-xl">
        {team?.name ?? "TBD"}
      </span>
    </div>
  );
}

export function LiveHeroCard({ match, priority = false }: LiveHeroCardProps) {
  const teamA = match?.team_a?.name ?? "TBD";
  const teamB = match?.team_b?.name ?? "TBD";
  const tournamentName = match?.tournament?.name ?? null;
  const stage = match?.stage ? formatStage(match.stage) : null;

  return (
    <Link
      href={`/matches/${match?.id ?? ""}`}
      aria-label={`Watch live: ${teamA} vs ${teamB}`}
      className="group block border border-transparent p-4 transition-colors hover:border-page-light-border hover:bg-[#faf8f6] rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-page-light-text sm:p-6 2xl:p-8"
    >
      <LiveIndicator />

      <div className="mt-4 flex min-h-48 gap-5 sm:mt-5 sm:min-h-[20rem] sm:gap-8 lg:min-h-[20rem] xl:min-h-[22rem] 2xl:min-h-[26rem]">
        <div className="relative aspect-[3/4] w-[42%] shrink-0 overflow-hidden bg-page-light-border sm:w-[45%]">
          {match?.thumbnail_url ? (
            <Image
              src={match.thumbnail_url}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 640px) 40vw, (max-width: 1024px) 45vw, 30vw"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-4 sm:gap-6 2xl:gap-8">
          {tournamentName ? (
            <div className="hidden opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none sm:block">
              <p className="font-display text-xl leading-tight tracking-tight text-page-light-text sm:text-3xl 2xl:text-4xl">
                {tournamentName}
              </p>
              {stage ? (
                <p className="mt-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-page-light-text-secondary 2xl:text-xs">
                  <span
                    aria-hidden="true"
                    className="h-px w-6 bg-page-light-border"
                  />
                  {stage}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex w-full items-center justify-center gap-4 sm:gap-6 2xl:gap-8">
            <TeamLockup team={match?.team_a} />
            <span
              aria-hidden="true"
              className="flex shrink-0 items-center gap-2.5 text-page-light-text-secondary sm:gap-3 2xl:gap-4"
            >
              <span className="hidden h-px w-6 bg-page-light-border sm:block 2xl:w-10" />
              <span className="font-mono text-sm font-medium uppercase tracking-[0.25em] sm:text-base 2xl:text-lg">
                VS
              </span>
              <span className="hidden h-px w-6 bg-page-light-border sm:block 2xl:w-10" />
            </span>
            <TeamLockup team={match?.team_b} />
          </div>

          <p className="hidden opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none sm:block">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-page-light-text px-5 py-2 text-sm font-medium text-page-light transition-colors group-hover:bg-[#f37a0a] sm:px-6 sm:py-2.5 2xl:px-7 2xl:py-3 2xl:text-base">
              Watch Now
              <span
                aria-hidden="true"
                className="transition-transform motion-safe:group-hover:translate-x-0.5"
              >
                →
              </span>
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
