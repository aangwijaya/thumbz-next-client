import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { HomeSectionHead } from "@/components/home/HomeSectionHead";
import { ScheduleRundown } from "@/components/home/ScheduleRundown";
import type { HomePayload, MatchSummary } from "@/lib/api/types";

interface ScheduleProps {
  matches: HomePayload["upcoming"];
  /** Live matches sit on the same timeline, across the "now" needle. */
  live: MatchSummary[];
  tournamentId: string | null;
}

export function Schedule({ matches, live, tournamentId }: ScheduleProps) {
  return (
    <section id="schedule" aria-labelledby="schedule-title" className="scroll-mt-32 py-[clamp(32px,4vw,48px)]">
      <Container size="page">
        <HomeSectionHead
          id="schedule-title"
          eyebrow="Schedule"
          title="Plan your match day"
          actions={
            <>
              <span className="text-[13px] text-pencil">Times in your time zone</span>
              <ArrowLink href={tournamentId ? `/matches?tournament=${tournamentId}` : "/matches"}>
                See full schedule
              </ArrowLink>
            </>
          }
        />
        <ScheduleRundown live={live} upcoming={matches} />
      </Container>
    </section>
  );
}
