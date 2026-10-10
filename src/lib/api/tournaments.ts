import { cache } from "react";

import { getOptional, query } from "./server";
import type { MatchSummary, TournamentSummary } from "./types";

/** Every tournament for the league bar, newest first. One request per render. */
export const getTournaments = cache(async (): Promise<TournamentSummary[]> => {
  const list = await getOptional<TournamentSummary[]>(
    `/tournaments${query({ sort: "start_date", order: "desc", pageSize: 20 })}`,
  );
  return list ?? [];
});

/**
 * The tournament a page shows: the one in the URL when it exists, else the
 * first featured ongoing one, else the first ongoing one, else the newest.
 */
export function pickTournament(list: TournamentSummary[], id?: string | null): TournamentSummary | null {
  return (
    list.find((tournament) => tournament?.id === id) ??
    list.find((tournament) => tournament?.featured && tournament?.status === "ongoing") ??
    list.find((tournament) => tournament?.status === "ongoing") ??
    list[0] ??
    null
  );
}

const REGION_CODES: Record<string, string> = {
  Philippines: "PH",
  Indonesia: "ID",
  Malaysia: "MY",
  Singapore: "SG",
  Cambodia: "KH",
  Myanmar: "MM",
};

/** A short tab label: "MPL Philippines Season 18" → "MPL PH"; other names drop "Season N". */
export function tournamentLabel(tournament: Pick<TournamentSummary, "name"> | null | undefined): string {
  const name = tournament?.name?.trim() || "Tournament";
  const mpl = /^MPL (\w+)/.exec(name);
  const code = mpl ? REGION_CODES[mpl[1] ?? ""] : undefined;
  if (code) return `MPL ${code}`;
  return name.replace(/\s+Season\s+\d+$/i, "");
}

/** Live matches per tournament id, for the counts in the league bar (one request). */
export const getLiveCounts = cache(async (): Promise<Record<string, number>> => {
  const live = await getOptional<MatchSummary[]>(`/matches/live${query({ pageSize: 50 })}`, {
    revalidate: 10,
    tags: ["live"],
  });
  const counts: Record<string, number> = {};
  for (const match of live ?? []) {
    const id = match?.tournament_id;
    if (id) counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
});
