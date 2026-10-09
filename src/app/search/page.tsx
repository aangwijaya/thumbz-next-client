import type { Metadata } from "next";
import { Suspense } from "react";

import { ReplayCard } from "@/components/cards/ReplayCard";
import { MatchListItem } from "@/components/match/MatchListItem";
import { SearchBox } from "@/components/search/SearchBox";
import { SearchResultRow } from "@/components/search/SearchResultRow";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { FilterChips } from "@/components/ui/FilterChips";
import { Pagination } from "@/components/ui/Pagination";
import { apiFetch } from "@/lib/api/client";
import { query } from "@/lib/api/server";
import type { SearchCounts, SearchPayload } from "@/lib/api/types";
import { formatDateRange } from "@/lib/utils/format";
import {
  enumParam,
  hrefWith,
  pageParam,
  param,
  type SearchParamsRecord,
} from "@/lib/utils/search-params";

const TYPES = ["match", "team", "player", "tournament", "video"] as const;
type ResultType = (typeof TYPES)[number];

const TYPE_INFO: Record<ResultType, { label: string; key: keyof SearchCounts }> = {
  team: { label: "Teams", key: "teams" },
  player: { label: "Players", key: "players" },
  match: { label: "Matches", key: "matches" },
  tournament: { label: "Tournaments", key: "tournaments" },
  video: { label: "Videos", key: "videos" },
};
// Display order on the "All" tab.
const ORDER: ResultType[] = ["team", "player", "match", "tournament", "video"];
const PAGE_SIZE = 20;
const PREVIEW = 5;

type Props = { searchParams: Promise<SearchParamsRecord> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = param(await searchParams, "q");
  return {
    title: q ? `“${q}” — Search` : "Search",
    // Result pages are endless permutations: keep them out of the index.
    robots: { index: false, follow: true },
  };
}

interface SearchResponse {
  data: SearchPayload;
  meta: { counts: SearchCounts; total: number };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = (param(params, "q") ?? "").slice(0, 100);
  const type = enumParam(params, "type", TYPES);
  const page = pageParam(params);

  const result =
    q.length > 0
      ? await apiFetch<SearchResponse>(
          `/search${query({ q, type: type ?? "all", page: type ? page : 1, pageSize: type ? PAGE_SIZE : PREVIEW })}`,
          { next: { revalidate: 60, tags: ["catalog"] } },
        ).catch(() => null)
      : null;

  const counts = result?.meta?.counts;
  const data = result?.data;
  const current = { q, type };
  const tabHref = (value: ResultType | null) => hrefWith("/search", current, { type: value, page: null });

  return (
    <div className="flex-1 bg-paper">
      <Container size="page" className="flex flex-col gap-8 py-10 min-[801px]:py-14">
        <h1 className="sr-only">Search</h1>
        <Suspense>
          <SearchBox initialQuery={q} />
        </Suspense>

        {!q ? (
          <p className="text-body text-pencil">
            Find teams, players, tournaments, matches and replays. Typos are fine: “onik” still finds ONIC.
          </p>
        ) : !result ? (
          <p className="text-body text-pencil">Search is unavailable right now. Please try again.</p>
        ) : (
          <>
            <FilterChips
              label="Result type"
              chips={[
                { label: "All", href: tabHref(null), active: !type, count: result.meta.total },
                ...ORDER.map((value) => ({
                  label: TYPE_INFO[value].label,
                  href: tabHref(value),
                  active: type === value,
                  count: counts?.[TYPE_INFO[value].key] ?? 0,
                })),
              ]}
            />

            {result.meta.total === 0 ? (
              <div className="flex flex-col gap-2 py-10 text-center">
                <p className="font-graphik text-subheading font-bold text-ink">No results for “{q}”</p>
                <p className="text-body text-pencil">Check the spelling or try a team, player or league name.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-10">
                {(type ? [type] : ORDER).map((value) => {
                  const count = counts?.[TYPE_INFO[value].key] ?? 0;
                  if (count === 0) return null;
                  return (
                    <section key={value} aria-labelledby={`results-${value}`} className="flex flex-col gap-3">
                      <div className="flex items-baseline justify-between gap-4 border-b border-stone pb-2">
                        <h2 id={`results-${value}`} className="font-graphik text-body-lg font-bold text-ink">
                          {TYPE_INFO[value].label}
                          <span className="ml-2 text-body-sm font-semibold text-pencil">{count}</span>
                        </h2>
                        {!type && count > PREVIEW ? (
                          <ArrowLink href={tabHref(value)}>See all {count}</ArrowLink>
                        ) : null}
                      </div>
                      <Results type={value} data={data} q={q} />
                    </section>
                  );
                })}

                {type ? (
                  <Pagination
                    page={page}
                    totalPages={Math.ceil((counts?.[TYPE_INFO[type].key] ?? 0) / PAGE_SIZE)}
                    hrefFor={(n) => hrefWith("/search", current, { page: n === 1 ? null : n })}
                    label="Result pages"
                  />
                ) : null}
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

function Results({ type, data, q }: { type: ResultType; data?: SearchPayload; q: string }) {
  switch (type) {
    case "team":
      return (
        <ul className="grid gap-1 min-[641px]:grid-cols-2">
          {(data?.teams ?? []).map((team) => (
            <SearchResultRow
              key={team?.id}
              href={`/teams/${team?.id}`}
              title={team?.name ?? "Team"}
              subtitle={team?.region}
              imageUrl={team?.logo_url}
              query={q}
            />
          ))}
        </ul>
      );
    case "player":
      return (
        <ul className="grid gap-1 min-[641px]:grid-cols-2">
          {(data?.players ?? []).map((player) => (
            <SearchResultRow
              key={player?.id}
              href={`/players/${player?.id}`}
              title={player?.nickname ?? "Player"}
              subtitle={[player?.team?.name, player?.real_name].filter(Boolean).join(" · ")}
              imageUrl={player?.photo_url}
              shape="round"
              query={q}
            />
          ))}
        </ul>
      );
    case "tournament":
      return (
        <ul className="grid gap-1 min-[641px]:grid-cols-2">
          {(data?.tournaments ?? []).map((tournament) => (
            <SearchResultRow
              key={tournament?.id}
              href={`/tournaments/${tournament?.id}`}
              title={tournament?.name ?? "Tournament"}
              subtitle={formatDateRange(tournament?.start_date ?? "", tournament?.end_date ?? "")}
              imageUrl={tournament?.logo_url}
              query={q}
            />
          ))}
        </ul>
      );
    case "match":
      return (
        <ul className="flex flex-col">
          {(data?.matches ?? []).map((match) => (
            <MatchListItem key={match?.id} match={match} />
          ))}
        </ul>
      );
    case "video":
      return (
        <ul className="grid gap-x-6 gap-y-8 min-[641px]:grid-cols-2 min-[901px]:grid-cols-3">
          {(data?.videos ?? []).map((video) => (
            <li key={video?.id}>
              <ReplayCard video={video} />
            </li>
          ))}
        </ul>
      );
  }
}
