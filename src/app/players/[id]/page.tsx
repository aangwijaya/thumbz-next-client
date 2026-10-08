import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";

import { ROLE_LABELS } from "@/components/cards/PlayerTile";
import { TeamLogo } from "@/components/cards/TeamLogo";
import { MatchDayList } from "@/components/match/MatchDayList";
import { Container } from "@/components/ui/Container";
import { StatGrid, decimal, percent } from "@/components/ui/StatGrid";
import { getOptional, getOrNotFound, query } from "@/lib/api/server";
import type { MatchSummary, PlayerDetail, PlayerStatistics } from "@/lib/api/types";
import { initialsOf } from "@/lib/utils/format";

type Props = { params: Promise<{ id: string }> };

const getPlayer = cache((id: string) => getOrNotFound<PlayerDetail>(`/players/${id}`));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const player = await getPlayer((await params).id);
  const team = player?.team?.name;
  return {
    title: player?.nickname ?? "Player",
    description: `${player?.nickname}${team ? ` (${team})` : ""} — role, career statistics and heroes.`,
    alternates: { canonical: `/players/${player?.id}` },
  };
}

export default async function PlayerPage({ params }: Props) {
  const { id } = await params;
  const [player, statistics, matches] = await Promise.all([
    getPlayer(id),
    getOptional<PlayerStatistics>(`/players/${id}/statistics`),
    getOptional<MatchSummary[]>(`/players/${id}/matches${query({ pageSize: 10 })}`),
  ]);
  const heroes = statistics?.per_hero ?? [];
  const stats = player?.stats;

  return (
    <div className="flex-1 bg-paper">
      <div className="border-b border-stone bg-cream/60">
        <Container size="page" className="flex flex-col gap-6 py-10 min-[641px]:flex-row min-[641px]:items-center min-[801px]:py-14">
          {player?.photo_url ? (
            <Image src={player.photo_url} alt="" width={112} height={112} priority className="size-28 rounded-full bg-paper object-cover shadow-subtle" />
          ) : (
            <span aria-hidden="true" className="grid size-28 place-items-center rounded-full bg-paper font-graphik text-heading font-bold text-deep-ember shadow-subtle">
              {initialsOf(player?.nickname ?? "?")}
            </span>
          )}
          <div className="flex flex-col gap-2">
            <p className="text-caption font-semibold text-deep-ember">
              {[ROLE_LABELS[player?.role ?? ""] ?? player?.role, player?.country].filter(Boolean).join(" · ")}
            </p>
            <h1 className="font-graphik text-[clamp(30px,calc(2.4vw+10px),44px)] font-bold leading-[1.15] text-ink">
              {player?.nickname}
            </h1>
            {player?.real_name ? <p className="text-body text-pencil">{player.real_name}</p> : null}
            {player?.team ? (
              <Link href={`/teams/${player.team.id}`} className="inline-flex w-fit items-center gap-2 rounded-lg py-1 font-graphik font-semibold text-ink hover:text-deep-ember">
                <TeamLogo team={player.team} size={22} />
                {player.team.name}
              </Link>
            ) : null}
          </div>
        </Container>
      </div>

      <Container size="page" className="flex flex-col gap-12 py-10">
        <StatGrid
          stats={[
            { label: "Matches", value: stats?.matches_played ?? "–" },
            { label: "Win rate", value: percent(stats?.win_rate) },
            { label: "KDA (avg)", value: `${decimal(stats?.avg_kills)} / ${decimal(stats?.avg_deaths)} / ${decimal(stats?.avg_assists)}` },
            { label: "MVPs", value: stats?.mvp_count ?? "–" },
          ]}
        />

        {heroes.length > 0 ? (
          <section aria-labelledby="heroes-title" className="flex flex-col gap-4">
            <h2 id="heroes-title" className="font-graphik text-subheading font-bold text-ink">Most played heroes</h2>
            <ul className="grid gap-3 min-[641px]:grid-cols-2 min-[1001px]:grid-cols-3">
              {heroes.slice(0, 9).map((hero) => {
                const winRate = hero.games ? hero.wins / hero.games : 0;
                return (
                  <li key={hero.hero} className="flex flex-col gap-2 rounded-image border border-stone p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-graphik text-body-lg font-bold text-ink">{hero.hero}</span>
                      <span className="text-body-sm tabular-nums text-pencil">{hero.games} games</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-stone/50" aria-hidden="true">
                      <div className="h-full rounded-full bg-forest" style={{ width: `${Math.round(winRate * 100)}%` }} />
                    </div>
                    <span className="text-caption text-pencil">
                      {percent(winRate)} win rate · {decimal(hero.avg_kills)} kills/game
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {player?.tournament_history && player.tournament_history.length > 0 ? (
          <section aria-labelledby="history-title" className="flex flex-col gap-4">
            <h2 id="history-title" className="font-graphik text-subheading font-bold text-ink">Tournaments</h2>
            <ul className="flex flex-col divide-y divide-stone rounded-image border border-stone">
              {player.tournament_history.map((entry) => (
                <li key={entry?.tournament?.id}>
                  <Link href={`/tournaments/${entry?.tournament?.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-cream">
                    <span className="font-graphik font-semibold text-ink">{entry?.tournament?.name}</span>
                    <span className="text-body-sm tabular-nums text-pencil">
                      {[entry?.placement, `${entry?.matches_played ?? 0} matches`].filter(Boolean).join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {matches && matches.length > 0 ? (
          <section aria-labelledby="matches-title" className="flex flex-col gap-4">
            <h2 id="matches-title" className="font-graphik text-subheading font-bold text-ink">Recent matches</h2>
            <MatchDayList matches={matches} />
          </section>
        ) : null}
      </Container>
    </div>
  );
}
