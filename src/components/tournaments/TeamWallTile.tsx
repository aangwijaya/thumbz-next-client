import Link from "next/link";

import { FollowButton } from "@/components/home/FollowControls";
import { Spoiler } from "@/components/spoiler/Spoiler";
import { LogoMark } from "@/components/ui/LogoMark";
import type { StandingsRow, TeamSummary } from "@/lib/api/types";
import { shortTeamName } from "@/lib/utils/format";
import { DEFAULT_TEAM_B_COLOR } from "@/lib/utils/team-colors";

/** One team on a team wall: washed in its colour, its code in large type, rank and record (spoiler-gated). */
export function TeamWallTile({
  team,
  row,
  revealKey,
}: {
  team: TeamSummary;
  row?: StandingsRow;
  revealKey: string;
}) {
  const color = team?.color_primary || DEFAULT_TEAM_B_COLOR;
  const played = (row?.wins ?? 0) + (row?.losses ?? 0);
  return (
    <article
      className="relative flex min-h-[212px] flex-col gap-3 overflow-hidden rounded-xl border p-[18px] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-[3px] motion-reduce:transition-none motion-reduce:hover:translate-y-0 max-[640px]:min-h-[196px] max-[640px]:w-[200px]"
      style={{
        borderColor: `color-mix(in oklab, ${color} 30%, var(--color-stone))`,
        background: `color-mix(in oklab, ${color} 9%, var(--color-paper))`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <LogoMark source={team} size="sm" />
        {row ? (
          <Spoiler matchId={revealKey}>
            <span
              className="text-caption font-semibold"
              style={{
                color: `color-mix(in oklab, ${color} 45%, var(--color-ink))`,
              }}
            >
              #{row.rank}
            </span>
          </Spoiler>
        ) : null}
      </div>
      <p
        aria-hidden="true"
        className="mt-auto font-graphik text-[clamp(40px,3.4vw,54px)] font-extrabold leading-[0.9] tracking-[-0.035em]"
        style={{ color: `color-mix(in oklab, ${color} 62%, var(--color-ink))` }}
      >
        {shortTeamName(team)}
      </p>
      <div>
        <h3 className="font-graphik text-[15px] font-bold leading-snug text-ink">
          <Link
            href={`/teams/${team?.id ?? ""}`}
            className="rounded-lg hover:underline hover:underline-offset-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
          >
            {team?.name ?? "Unknown team"}
          </Link>
        </h3>
        <p className="text-[13px] text-charcoal">
          {row ? (
            <Spoiler
              matchId={revealKey}
              safe={<span>{team?.region ?? ""}</span>}
            >
              <span>
                {row.wins}–{row.losses}
                {played > 0
                  ? ` · ${Math.round((row.wins / played) * 100)}% wins`
                  : ""}
              </span>
            </Spoiler>
          ) : (
            (team?.region ?? "")
          )}
        </p>
      </div>
      <FollowButton team={team} />
    </article>
  );
}
