import { RevealButton, Spoiler } from "@/components/spoiler/Spoiler";
import { LogoMark } from "@/components/ui/LogoMark";
import type { MatchSummary, StandingsRow } from "@/lib/api/types";
import { DEFAULT_TEAM_A_COLOR } from "@/lib/utils/team-colors";

/** Last results per team id, oldest first ("W"/"L"), from completed matches newest first. */
export function formByTeam(results: MatchSummary[], length = 5): Record<string, Array<"W" | "L">> {
  const form: Record<string, Array<"W" | "L">> = {};
  for (const match of results) {
    const winner = match?.winner_team_id;
    if (!winner) continue;
    for (const team of [match?.team_a, match?.team_b]) {
      const id = team?.id;
      if (!id) continue;
      const list = (form[id] ??= []);
      if (list.length < length) list.unshift(id === winner ? "W" : "L");
    }
  }
  return form;
}

const grid = "grid grid-cols-[20px_minmax(0,1fr)_44px_72px] items-center gap-2.5 min-[641px]:grid-cols-[24px_minmax(0,1.5fr)_52px_minmax(0,1fr)_96px] min-[641px]:gap-3.5";

/**
 * Standings as a race: win-rate bars in each team's colour, the last five
 * results, and a dashed line under the last playoff spot. Spoiler-gated.
 */
export function RaceLadder({
  rows,
  form,
  playoffSpots,
  revealKey,
  caption,
}: {
  rows: StandingsRow[];
  form: Record<string, Array<"W" | "L">>;
  playoffSpots: number | null;
  revealKey: string;
  caption: string;
}) {
  const body = (visible: boolean) => (
    <ol aria-hidden={visible ? undefined : true} className={visible ? "" : "select-none blur-[6px]"}>
      {rows.map((row, index) => {
        const percent = Math.round((row?.win_rate ?? 0) * 100);
        const results = form[row?.team?.id ?? ""] ?? [];
        const cut = playoffSpots != null && index === playoffSpots - 1 && index < rows.length - 1;
        return (
          <li
            key={row?.team?.id ?? index}
            className={`${grid} relative min-h-12 text-sm ${cut ? "border-b-[1.5px] border-dashed border-deep-ember" : "border-b border-[#eeecea] last:border-b-0"}`}
          >
            <span className="text-pencil">{visible ? row?.rank : 0}</span>
            <span className="flex min-w-0 items-center gap-2.5 font-semibold">
              <LogoMark source={row?.team} size="sm" />
              <span className="truncate">{visible ? (row?.team?.name ?? "TBD") : "Team name"}</span>
            </span>
            <span className="text-right font-semibold tabular-nums">
              {visible ? `${row?.wins ?? 0}–${row?.losses ?? 0}` : "0–0"}
            </span>
            <span aria-hidden="true" className="relative h-2.5 overflow-hidden rounded-[5px] bg-[#f4f2ef] max-[640px]:hidden">
              <span
                className="absolute inset-y-0 left-0 origin-left rounded-[5px] motion-safe:animate-grow"
                style={{ width: `${visible ? percent : 50}%`, background: row?.team?.color_primary || DEFAULT_TEAM_A_COLOR }}
              />
            </span>
            <span
              role="img"
              aria-label={results.length ? `Last ${results.length}: ${results.join(" ")}` : "No results yet"}
              className="flex justify-end gap-[3px]"
            >
              {results.map((result, at) => (
                <i
                  key={at}
                  className={`grid size-4 place-items-center rounded text-[9px] font-bold not-italic ${
                    result === "W" ? "bg-ink text-paper" : "text-pencil shadow-[inset_0_0_0_1px_var(--color-stone)]"
                  }`}
                >
                  {result}
                </i>
              ))}
            </span>
            {cut ? (
              <span className="absolute -bottom-2.5 right-0 z-[1] bg-paper px-1.5 text-[11px] font-semibold text-deep-ember">
                Playoff line
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );

  return (
    <div>
      <p className="mb-3 flex items-center justify-between gap-3 text-caption font-semibold text-pencil">
        <span>{caption}</span>
        <RevealButton matchId={revealKey}>Show standings</RevealButton>
      </p>
      <div aria-hidden="true" className={`${grid} border-b border-stone pb-2 text-caption font-medium text-pencil`}>
        <span>#</span>
        <span>Team</span>
        <span className="text-right">W–L</span>
        <span className="max-[640px]:hidden">Win rate</span>
        <span className="text-right">Last 5</span>
      </div>
      <Spoiler matchId={revealKey} safe={body(false)}>
        {body(true)}
      </Spoiler>
    </div>
  );
}
