import type { Metadata } from "next";

import { TeamTile } from "@/components/cards/TeamTile";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { getEnvelope, getOptional, query } from "@/lib/api/server";
import type { TeamSummary } from "@/lib/api/types";
import { hrefWith, pageParam, param, type SearchParamsRecord } from "@/lib/utils/search-params";

const PAGE_SIZE = 24;

export const metadata: Metadata = {
  title: "Teams",
  description: "Every Mobile Legends esports team: rosters, form and results.",
  alternates: { canonical: "/teams" },
};

export default async function TeamsPage({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const params = await searchParams;
  const region = param(params, "region");
  const page = pageParam(params);

  const [list, all] = await Promise.all([
    getEnvelope<TeamSummary[]>(`/teams${query({ region, page, pageSize: PAGE_SIZE, sort: "name" })}`),
    // Region chips come from the catalog itself (cached; teams are few).
    getOptional<TeamSummary[]>(`/teams${query({ pageSize: 50 })}`),
  ]);
  const regions = [...new Set((all ?? []).map((team) => team?.region).filter(Boolean) as string[])].sort();
  const teams = list?.data ?? [];

  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <PageHeader eyebrow="Teams" title="Every team in the league" description="Rosters, recent form and results for each squad." />
        {regions.length > 1 ? (
          <FilterChips
            label="Region"
            chips={[
              { label: "All regions", href: "/teams", active: !region },
              ...regions.map((value) => ({
                label: value,
                href: hrefWith("/teams", {}, { region: value }),
                active: region === value,
              })),
            ]}
          />
        ) : null}
        {teams.length === 0 ? (
          <EmptyState title="No teams found" description="Try another region." />
        ) : (
          <ul className="grid gap-4 min-[641px]:grid-cols-2 min-[1001px]:grid-cols-3">
            {teams.map((team) => (
              <li key={team?.id}>
                <TeamTile team={team} />
              </li>
            ))}
          </ul>
        )}
        <Pagination
          page={page}
          totalPages={list?.meta?.totalPages ?? 1}
          hrefFor={(n) => hrefWith("/teams", { region }, { page: n === 1 ? null : n })}
          label="Team pages"
        />
      </Container>
    </div>
  );
}
