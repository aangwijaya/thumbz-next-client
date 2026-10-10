import type { TournamentSummary } from "@/lib/api/types";

/**
 * League formats the API does not carry yet (no fields for them): how many
 * teams reach the playoffs and how long the regular season runs. Per league,
 * by slug prefix; stand-in values until the backend has them.
 */
const FORMATS: Array<{ prefix: string; playoffSpots: number; weeks: number; currentWeek: number }> = [
  { prefix: "mpl-ph", playoffSpots: 6, weeks: 9, currentWeek: 8 },
  { prefix: "mpl-id", playoffSpots: 6, weeks: 9, currentWeek: 8 },
];

export interface LeagueFormat {
  playoffSpots: number;
  weeks: number;
  currentWeek: number;
}

export function leagueFormat(tournament: Pick<TournamentSummary, "slug"> | null | undefined): LeagueFormat | null {
  const slug = tournament?.slug ?? "";
  return FORMATS.find((format) => slug.startsWith(format.prefix)) ?? null;
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
