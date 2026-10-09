import type { Metadata } from "next";

import { PlayerTile, ROLE_LABELS } from "@/components/cards/PlayerTile";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { getEnvelope, query } from "@/lib/api/server";
import type { PlayerRole, PlayerSummary } from "@/lib/api/types";
import { enumParam, hrefWith, pageParam, type SearchParamsRecord } from "@/lib/utils/search-params";

const ROLES = ["exp", "jungle", "mid", "gold", "roam"] as const satisfies readonly PlayerRole[];
const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Players",
  description: "Mobile Legends esports players: roles, teams and career statistics.",
  alternates: { canonical: "/players" },
};

export default async function PlayersPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const role = enumParam(params, "role", ROLES);
  const page = pageParam(params);
  const list = await getEnvelope<PlayerSummary[]>(`/players${query({ role, page, pageSize: PAGE_SIZE })}`);
  const players = list?.data ?? [];

  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <PageHeader
          eyebrow="Players"
          title="The pros"
          description={`${list?.meta?.total ?? players.length} players across every team, with career numbers per hero.`}
        />
        <FilterChips
          label="Role"
          chips={[
            { label: "All roles", href: "/players", active: !role },
            ...ROLES.map((value) => ({
              label: ROLE_LABELS[value] ?? value,
              href: hrefWith("/players", {}, { role: value }),
              active: role === value,
            })),
          ]}
        />
        {players.length === 0 ? (
          <EmptyState title="No players found" description="Try another role." />
        ) : (
          <ul className="grid gap-4 min-[641px]:grid-cols-2 min-[1001px]:grid-cols-3">
            {players.map((player) => (
              <li key={player?.id}>
                <PlayerTile player={player} />
              </li>
            ))}
          </ul>
        )}
        <Pagination
          page={page}
          totalPages={list?.meta?.totalPages ?? 1}
          hrefFor={(n) => hrefWith("/players", { role }, { page: n === 1 ? null : n })}
          label="Player pages"
        />
      </Container>
    </div>
  );
}
