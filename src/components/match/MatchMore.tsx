import Link from "next/link";

import { TicketPanel } from "@/components/match/TicketPanel";
import { RevealButton, Spoiler } from "@/components/spoiler/Spoiler";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { LiveDot } from "@/components/ui/LiveDot";
import { LogoMark } from "@/components/ui/LogoMark";
import { Thumbnail } from "@/components/ui/Thumbnail";
import type { MatchSummary, TeamSummary } from "@/lib/api/types";
import { formatDate, formatStage, formatStartsIn, formatViewerCount, shortTeamName } from "@/lib/utils/format";
import { seriesInfo } from "@/lib/utils/series";

interface MatchMoreProps {
  match: MatchSummary;
  /** Earlier meetings of the two teams, newest first. */
  history: MatchSummary[];
  /** Other live matches. */
  live: MatchSummary[];
  /** The next scheduled match, if any. */
  next: MatchSummary | null;
}

const H2H_KEY = (id: string) => `h2h-${id}`;

function winnerName(row: MatchSummary): string {
  const team: TeamSummary | null | undefined =
    row?.winner_team_id === row?.team_a?.id ? row?.team_a : row?.winner_team_id === row?.team_b?.id ? row?.team_b : null;
  return team ? shortTeamName(team) : "Draw";
}

function HeadToHead({ match, history }: { match: MatchSummary; history: MatchSummary[] }) {
  const key = H2H_KEY(match?.id ?? "");
  const rows = history.slice(0, 5);
  const wins = (teamId?: string) => rows.filter((row) => row?.winner_team_id === teamId).length;
  const nameA = shortTeamName(match?.team_a);
  const nameB = shortTeamName(match?.team_b);

  return (
    <div className="rounded-xl border border-stone bg-paper p-4 shadow-subtle min-[641px]:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption font-semibold text-deep-ember">Head to head</p>
          <h2 className="font-graphik text-[21px] font-bold leading-[1.3] text-ink">
            Last {rows.length} {rows.length === 1 ? "meeting" : "meetings"}
          </h2>
        </div>
        <RevealButton matchId={key}>Show results</RevealButton>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-pencil">These teams have not met before.</p>
      ) : (
        <>
          <div className="mt-3.5 flex items-center justify-between gap-3 rounded-[10px] bg-ink/[0.04] px-4 py-3.5">
            <span className="flex items-center gap-2.5 font-graphik text-[15px] font-bold">
              <LogoMark source={match?.team_a} size="sm" />
              {nameA}
            </span>
            <span className="font-graphik text-[26px] font-extrabold tabular-nums">
              <Spoiler matchId={key} safe="vs">
                {wins(match?.team_a?.id)}
                <span aria-hidden="true" className="px-1.5 text-stone">
                  –
                </span>
                {wins(match?.team_b?.id)}
              </Spoiler>
            </span>
            <span className="flex items-center gap-2.5 font-graphik text-[15px] font-bold">
              {nameB}
              <LogoMark source={match?.team_b} size="sm" />
            </span>
          </div>
          <ul className="mt-1.5">
            {rows.map((row) => (
              <li
                key={row?.id}
                className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-stone/50 py-[11px] text-sm last:border-b-0 min-[641px]:grid-cols-[64px_minmax(0,1fr)_auto] min-[641px]:gap-3"
              >
                <time className="text-[13px] text-pencil">{formatDate(row?.ended_at ?? row?.scheduled_at ?? "").replace(/ \d{4}$/, "")}</time>
                <span className="truncate text-charcoal">
                  {[row?.tournament?.name, row?.stage ? formatStage(row.stage) : null].filter(Boolean).join(" · ")}
                </span>
                <span className="font-semibold">
                  <Spoiler matchId={key} safe={<span className="font-normal text-pencil">Hidden</span>}>
                    {winnerName(row)} {Math.max(row?.score_a ?? 0, row?.score_b ?? 0)}–{Math.min(row?.score_a ?? 0, row?.score_b ?? 0)}
                  </Spoiler>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function KeepRow({ match }: { match: MatchSummary }) {
  const isLive = match?.status === "live";
  const info = seriesInfo(match);
  const startsIn = isLive ? "" : formatStartsIn(match?.scheduled_at ?? "");
  const badge =
    info?.state === "match-point"
      ? <Badge tone="blue">Match point</Badge>
      : info?.state === "decider"
        ? <Badge tone="ember">Decider</Badge>
        : info?.state === "just-started"
          ? <Badge>Just started</Badge>
          : null;

  return (
    <div className="relative grid grid-cols-[104px_minmax(0,1fr)] items-center gap-3.5 rounded-xl border border-stone bg-paper p-2.5 transition-colors hover:border-graphite has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-deep-ember min-[641px]:grid-cols-[136px_minmax(0,1fr)_auto]">
      <Thumbnail
        src={match?.thumbnail_url}
        colors={[match?.team_a?.color_primary, match?.team_b?.color_primary]}
        sizes="136px"
        className="rounded-lg"
      >
        <Badge tone="light" size="xs" className="absolute left-1.5 top-1.5">
          {isLive ? (
            <>
              <LiveDot />
              Live
            </>
          ) : (
            startsIn || "Up next"
          )}
        </Badge>
      </Thumbnail>
      <div className="flex min-w-0 flex-col gap-1 text-[15px] font-semibold">
        {[match?.team_a, match?.team_b].map((team, index) => (
          <span key={team?.id ?? index} className="flex min-w-0 items-center gap-2">
            <LogoMark source={team} size="sm" />
            <span className="truncate">{team?.name ?? "TBD"}</span>
          </span>
        ))}
        <Link href={`/matches/${match?.id ?? ""}`} className="after:absolute after:inset-0 focus-visible:outline-none">
          <span className="sr-only">
            {isLive ? "Watch" : "Open"} {match?.team_a?.name ?? "TBD"} vs {match?.team_b?.name ?? "TBD"}
          </span>
        </Link>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-normal text-pencil">
          {badge ? <Spoiler matchId={match?.id ?? ""}>{badge}</Spoiler> : null}
          <span>
            {match?.tournament?.name ?? ""} · Best of {match?.best_of ?? 1}
          </span>
          {isLive ? (
            <span className="min-[641px]:hidden">{formatViewerCount(match?.viewer_count ?? 0)} watching</span>
          ) : null}
        </p>
      </div>
      {isLive ? (
        <p className="text-right text-[13px] text-pencil max-[640px]:hidden">
          {formatViewerCount(match?.viewer_count ?? 0)}
          <br />
          watching
        </p>
      ) : null}
    </div>
  );
}

// Below the stats: how these teams usually do, and what to watch next.
export function MatchMore({ match, history, live, next }: MatchMoreProps) {
  return (
    <section aria-label="More about this match" className="pb-10 pt-5 min-[901px]:pb-16 min-[901px]:pt-12">
      <Container size="watch" className="grid gap-4 min-[901px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-4">
          <HeadToHead match={match} history={history} />
          <TicketPanel matchId={match?.id ?? ""} />
        </div>
        {live.length > 0 || next ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-caption font-semibold text-deep-ember">Keep watching</p>
                <h2 className="font-graphik text-[21px] font-bold leading-[1.3] text-ink">
                  {live.length > 0 ? "Also live right now" : "Up next"}
                </h2>
              </div>
              <ArrowLink href="/#live-now">All live matches</ArrowLink>
            </div>
            {live.slice(0, 3).map((row) => (
              <KeepRow key={row?.id} match={row} />
            ))}
            {next && live.length > 0 ? <p className="mt-1.5 text-[13px] font-semibold text-pencil">Up next</p> : null}
            {next ? <KeepRow match={next} /> : null}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
