import Link from "next/link";

import { TeamLogo } from "@/components/cards/TeamLogo";
import { HiddenValue, Spoiler } from "@/components/spoiler/Spoiler";
import { Badge } from "@/components/ui/Badge";
import { LiveDot } from "@/components/ui/LiveDot";
import { LocalTime } from "@/components/ui/LocalTime";
import type { MatchSummary } from "@/lib/api/types";
import { formatStage, shortTeamName } from "@/lib/utils/format";

function Side({
  team,
  align,
  won,
}: {
  team: MatchSummary["team_a"];
  align: "start" | "end";
  won: boolean;
}) {
  return (
    <span
      className={`flex min-w-0 flex-1 items-center gap-2.5 ${
        align === "end" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamLogo team={team} size={28} />
      <span
        className={`truncate font-graphik text-body font-semibold ${won ? "text-ink" : "text-charcoal"}`}
      >
        <span className="min-[641px]:hidden">{shortTeamName(team)}</span>
        <span className="max-[640px]:hidden">{team?.name ?? "TBD"}</span>
      </span>
    </span>
  );
}

/** One match in a list: time, both teams, score (spoiler-aware) and context. */
export function MatchListItem({ match }: { match: MatchSummary }) {
  const live = match?.status === "live";
  const done = match?.status === "completed";
  const hasScore = live || done;
  const stage = match?.stage ? formatStage(match.stage) : null;

  const score = (
    <span className="font-mono text-body-lg font-semibold tabular-nums text-ink">
      {match?.score_a ?? 0}
      <span aria-hidden="true" className="mx-1 text-graphite">
        –
      </span>
      {match?.score_b ?? 0}
    </span>
  );

  return (
    <li>
      <Link
        href={`/matches/${match?.id ?? ""}`}
        className="group grid grid-cols-[64px_1fr_auto] items-center gap-x-4 gap-y-1 rounded-lg px-3 py-3.5 transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember min-[641px]:grid-cols-[72px_1fr_auto]"
      >
        <span className="flex flex-col text-caption text-pencil">
          {live ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-deep-ember">
              <LiveDot />
              Live
            </span>
          ) : (
            <LocalTime iso={match?.scheduled_at} className="font-semibold tabular-nums text-ink" />
          )}
          <span>BO{match?.best_of ?? 1}</span>
        </span>

        <span className="flex min-w-0 items-center gap-3">
          <Side team={match?.team_a} align="start" won={match?.winner_team_id === match?.team_a?.id} />
          <span className="shrink-0 px-1 text-center">
            {hasScore ? (
              <Spoiler
                matchId={match?.id ?? ""}
                safe={
                  <span className="font-mono text-body-lg font-semibold tabular-nums text-ink">
                    <HiddenValue>0 – 0</HiddenValue>
                  </span>
                }
              >
                {score}
              </Spoiler>
            ) : (
              <span className="text-caption font-semibold uppercase tracking-wider text-pencil">
                vs
              </span>
            )}
          </span>
          <Side team={match?.team_b} align="end" won={match?.winner_team_id === match?.team_b?.id} />
        </span>

        <span className="flex items-center gap-3 max-[800px]:hidden">
          {match?.tournament?.name ? (
            <span className="max-w-[180px] truncate text-body-sm text-pencil">
              {match.tournament.name}
              {stage ? ` · ${stage}` : ""}
            </span>
          ) : null}
          {match?.status === "cancelled" || match?.status === "postponed" ? (
            <Badge tone="neutral" size="sm">
              {match.status === "cancelled" ? "Cancelled" : "Postponed"}
            </Badge>
          ) : null}
          <span
            aria-hidden="true"
            className="text-pencil transition-transform motion-safe:group-hover:translate-x-0.5"
          >
            →
          </span>
        </span>
      </Link>
    </li>
  );
}
