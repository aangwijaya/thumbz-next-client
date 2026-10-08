import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";

import { PlayerTile } from "@/components/cards/PlayerTile";
import { TeamLogo } from "@/components/cards/TeamLogo";
import { MatchDayList } from "@/components/match/MatchDayList";
import { MatchListItem } from "@/components/match/MatchListItem";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { FormStrip, StatGrid, decimal, percent } from "@/components/ui/StatGrid";
import { getOptional, getOrNotFound, query } from "@/lib/api/server";
import type { MatchSummary, PlayerSummary, TeamDetail, TeamStatistics } from "@/lib/api/types";

type Props = { params: Promise<{ id: string }> };

const policy = (id: string) => ({ revalidate: 30, tags: [`team:${id}`, "catalog"] });
// Shared by generateMetadata and the page: one request per render.
const getTeam = cache((id: string) => getOrNotFound<TeamDetail>(`/teams/${id}`, policy(id)));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const team = await getTeam((await params).id);
  return {
    title: team?.name ?? "Team",
    description: team?.description ?? `${team?.name} — roster, form and results.`,
    alternates: { canonical: `/teams/${team?.id}` },
  };
}

export default async function TeamPage({ params }: Props) {
  const { id } = await params;
  const [team, statistics, roster, recent] = await Promise.all([
    getTeam(id),
    getOptional<TeamStatistics>(`/teams/${id}/statistics`, policy(id)),
    getOptional<PlayerSummary[]>(`/teams/${id}/roster`, policy(id)),
    getOptional<MatchSummary[]>(`/teams/${id}/matches${query({ pageSize: 10 })}`, policy(id)),
  ]);
  const featured = team?.live_match ?? team?.next_match;

  return (
    <div className="flex-1 bg-paper">
      <div
        className="border-b border-stone"
        style={{ background: `color-mix(in oklab, ${team?.color_primary || "var(--color-stone)"} 10%, var(--color-paper))` }}
      >
        <Container size="page" className="flex flex-col gap-6 py-10 min-[801px]:flex-row min-[801px]:items-center min-[801px]:py-14">
          <span className="grid size-24 shrink-0 place-items-center rounded-image bg-paper shadow-subtle">
            <TeamLogo team={team} size={72} />
          </span>
          <div className="flex flex-col gap-2">
            <p className="text-caption font-semibold text-deep-ember">
              {[team?.region, team?.founded_year ? `Founded ${team.founded_year}` : null].filter(Boolean).join(" · ")}
            </p>
            <h1 className="font-graphik text-[clamp(30px,calc(2.4vw+10px),44px)] font-bold leading-[1.15] text-ink">
              {team?.name}
            </h1>
            {team?.description ? <p className="max-w-2xl text-body text-pencil">{team.description}</p> : null}
            <FormStrip form={team?.stats?.current_form ?? []} />
          </div>
        </Container>
      </div>

      <Container size="page" className="flex flex-col gap-12 py-10">
        <StatGrid
          stats={[
            { label: "Matches", value: statistics?.matches_played ?? team?.stats?.matches_played ?? "–" },
            { label: "Win rate", value: percent(statistics?.win_rate ?? team?.stats?.win_rate) },
            { label: "Avg kills", value: decimal(statistics?.avg_kills) },
            { label: "Avg gold", value: statistics?.avg_gold ? `${(statistics.avg_gold / 1000).toFixed(1)}k` : "–" },
          ]}
        />

        {featured ? (
          <section aria-labelledby="next-title" className="flex flex-col gap-3">
            <h2 id="next-title" className="font-graphik text-subheading font-bold text-ink">
              {team?.live_match ? "Live now" : "Next match"}
            </h2>
            <ul className="rounded-image border border-stone">
              <MatchListItem match={featured} />
            </ul>
          </section>
        ) : null}

        {roster && roster.length > 0 ? (
          <section aria-labelledby="roster-title" className="flex flex-col gap-4">
            <h2 id="roster-title" className="font-graphik text-subheading font-bold text-ink">Roster</h2>
            <ul className="grid gap-4 min-[641px]:grid-cols-2 min-[1001px]:grid-cols-3">
              {roster.map((player) => (
                <li key={player?.id}>
                  <PlayerTile player={player} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {recent && recent.length > 0 ? (
          <section aria-labelledby="recent-title" className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="recent-title" className="font-graphik text-subheading font-bold text-ink">Recent matches</h2>
              <ArrowLink href={`/matches?team=${id}`}>All matches</ArrowLink>
            </div>
            <MatchDayList matches={recent} />
          </section>
        ) : null}

        {statistics?.per_tournament && statistics.per_tournament.length > 0 ? (
          <section aria-labelledby="tournaments-title" className="flex flex-col gap-4">
            <h2 id="tournaments-title" className="font-graphik text-subheading font-bold text-ink">By tournament</h2>
            <div className="overflow-x-auto rounded-image border border-stone">
              <table className="w-full min-w-[480px] text-left text-body-sm">
                <thead className="bg-cream text-caption text-pencil">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Tournament</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Played</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Won</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">Win rate</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.per_tournament.map((row) => (
                    <tr key={row?.tournament?.id} className="border-t border-stone">
                      <th scope="row" className="px-4 py-3 font-semibold text-ink">
                        <Link href={`/tournaments/${row?.tournament?.id}`} className="hover:text-deep-ember">
                          {row?.tournament?.name}
                        </Link>
                      </th>
                      <td className="px-4 py-3 text-right tabular-nums">{row?.matches_played}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row?.wins}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {percent(row?.matches_played ? row.wins / row.matches_played : null)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </Container>
    </div>
  );
}
