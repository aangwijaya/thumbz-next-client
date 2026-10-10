import type { MatchGame, MatchSummary } from "@/lib/api/types";
import { shortTeamName } from "@/lib/utils/format";
import { gameSlots } from "@/lib/utils/series";
import { teamColors } from "@/lib/utils/team-colors";

interface SeriesPipsProps {
  match: (MatchSummary & { games?: MatchGame[] }) | null | undefined;
  /** Optional caption under each pip (game length, "Live"…), by game index. */
  captions?: Array<string | null>;
  className?: string;
}

/** One pill per game: the winner's colour, ember while live, outlined when not played. */
export function SeriesPips({ match, captions, className = "" }: SeriesPipsProps) {
  const [colorA, colorB] = teamColors(match);
  const slots = gameSlots(match);
  const nameA = shortTeamName(match?.team_a);
  const nameB = shortTeamName(match?.team_b);
  const label = slots
    .map((slot, index) =>
      slot === "a" ? `Game ${index + 1} ${nameA}` : slot === "b" ? `Game ${index + 1} ${nameB}` : slot === "live" ? `Game ${index + 1} live` : null,
    )
    .filter(Boolean)
    .join(", ");

  return (
    <span role="img" aria-label={label || "No games played yet"} className={`inline-flex items-start gap-1.5 ${className}`}>
      {slots.map((slot, index) => (
        <span key={index} className="flex flex-col items-center gap-1 text-[11px] text-pencil">
          <i
            className={`block h-2 w-[22px] rounded-full ${
              slot === "live"
                ? "bg-ember-red motion-safe:animate-pulse"
                : slot === "next"
                  ? "shadow-[inset_0_0_0_1px_var(--color-stone)]"
                  : ""
            } ${captions ? "w-10" : ""}`}
            style={slot === "a" ? { background: colorA } : slot === "b" ? { background: colorB } : undefined}
          />
          {captions?.[index] ? <span aria-hidden="true">{captions[index]}</span> : null}
        </span>
      ))}
    </span>
  );
}
