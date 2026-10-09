import type { Metadata } from "next";

import { LiveListRefresher } from "@/components/match/LiveListRefresher";
import { MatchDayList } from "@/components/match/MatchDayList";
import { MatchListItem } from "@/components/match/MatchListItem";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { getOptional, query } from "@/lib/api/server";
import type { MatchSummary } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Live now",
  description: "Mobile Legends esports matches streaming right now.",
  alternates: { canonical: "/live" },
};

export default async function LivePage() {
  const [live, upcoming] = await Promise.all([
    getOptional<MatchSummary[]>(`/matches/live${query({ pageSize: 20 })}`, { revalidate: 10, tags: ["live"] }),
    getOptional<MatchSummary[]>(`/matches/upcoming${query({ pageSize: 6 })}`, { revalidate: 30, tags: ["matches"] }),
  ]);

  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-10 py-10 min-[801px]:py-14">
        <LiveListRefresher />
        <PageHeader
          eyebrow="On air"
          title="Live now"
          description="Matches streaming right now, with live scores, gold lead and chat on each watch page."
        />
        {live && live.length > 0 ? (
          <ul className="flex flex-col divide-y divide-stone rounded-image border border-stone">
            {live.map((match) => (
              <MatchListItem key={match?.id} match={match} />
            ))}
          </ul>
        ) : (
          <div className="rounded-image border border-dashed border-stone px-6 py-12 text-center">
            <p className="font-graphik text-subheading font-bold text-ink">Nothing live right now</p>
            <p className="mt-1 text-body text-pencil">The next matches are below.</p>
          </div>
        )}
        {upcoming && upcoming.length > 0 ? (
          <section aria-labelledby="upcoming-title" className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="upcoming-title" className="font-graphik text-subheading font-bold text-ink">Coming up</h2>
              <ArrowLink href="/matches?status=scheduled">Full schedule</ArrowLink>
            </div>
            <MatchDayList matches={upcoming} />
          </section>
        ) : null}
      </Container>
    </div>
  );
}
