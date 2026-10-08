import Link from "next/link";

import { TeamLogo } from "@/components/cards/TeamLogo";
import type { TeamSummary } from "@/lib/api/types";

export function TeamTile({ team }: { team: TeamSummary }) {
  return (
    <Link
      href={`/teams/${team?.id ?? ""}`}
      className="group flex items-center gap-4 rounded-image border border-stone bg-paper p-4 transition-colors hover:border-ink/30 hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
    >
      <span
        className="grid size-14 shrink-0 place-items-center rounded-lg"
        style={{ background: `color-mix(in oklab, ${team?.color_primary || "var(--color-stone)"} 14%, var(--color-paper))` }}
      >
        <TeamLogo team={team} size={40} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-graphik text-body-lg font-bold text-ink group-hover:text-deep-ember">
          {team?.name ?? "Team"}
        </span>
        <span className="truncate text-body-sm text-pencil">
          {[team?.short_name, team?.region].filter(Boolean).join(" · ")}
        </span>
      </span>
    </Link>
  );
}
