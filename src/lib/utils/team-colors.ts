interface TeamLike {
  color_primary?: string | null;
}

interface MatchTeamsLike {
  team_a?: TeamLike | null;
  team_b?: TeamLike | null;
}

/** Fallbacks are the design tokens --color-ember-red / --color-cobalt-link. */
export const DEFAULT_TEAM_A_COLOR = "#e34432";
export const DEFAULT_TEAM_B_COLOR = "#0f66ae";

/** Side colors for a match (team A, team B), falling back to the brand pair. */
export function teamColors(match: MatchTeamsLike | null | undefined): [string, string] {
  return [
    match?.team_a?.color_primary || DEFAULT_TEAM_A_COLOR,
    match?.team_b?.color_primary || DEFAULT_TEAM_B_COLOR,
  ];
}

/** A team color mixed into the paper background, `share` percent strong. */
export function tint(color: string, share: number): string {
  return `color-mix(in oklab, ${color} ${share}%, var(--color-paper))`;
}
