import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { ViewerCount } from "@/components/ui/ViewerCount";
import type { MatchSummary } from "@/lib/api/types";

import { LiveHeroCard } from "./LiveHeroCard";

interface LiveSectionProps {
  heroes: MatchSummary[];
  alsoLive: MatchSummary[];
}

function AlsoLiveRow({ match }: { match: MatchSummary }) {
  return (
    <Link
      href={`/matches/${match?.id ?? ""}`}
      className="group flex items-center gap-4 border-b border-page-light-border px-1 py-3.5 transition-colors hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-page-light-text"
    >
      <LiveIndicator />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {match?.team_a?.name ?? "TBD"} vs {match?.team_b?.name ?? "TBD"}
      </span>
      <span className="hidden font-mono text-xs uppercase tracking-wider text-page-light-text-secondary sm:block">
        {match?.tournament?.name}
      </span>
      <ViewerCount
        count={match?.viewer_count}
        className="text-page-light-text-secondary"
      />
      <span
        aria-hidden="true"
        className="text-page-light-text-secondary transition-transform motion-safe:group-hover:translate-x-0.5"
      >
        →
      </span>
    </Link>
  );
}

export function LiveSection({ heroes, alsoLive }: LiveSectionProps) {
  return (
    <section aria-label="Live matches" className="bg-page-light text-page-light-text">
      <Container size="wide" className="flex flex-col gap-8 py-10 sm:gap-10 sm:py-14">
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 2xl:gap-8">
          {heroes.map((match, index) => (
            <LiveHeroCard
              key={match?.id ?? index}
              match={match}
              priority={index === 0}
            />
          ))}
        </div>

        {alsoLive.length > 0 ? (
          <div className="flex flex-col border-t border-page-light-border">
            {alsoLive.map((match, index) => (
              <AlsoLiveRow key={match?.id ?? index} match={match} />
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
