"use client";

import { useEffect, useState } from "react";

import { useMatchLanguage } from "@/components/home/MatchLanguage";
import {
  clock,
  GoldLeadChart,
  goldLabel,
  holdBackMs,
  leadPoints,
  type LeadPoint,
} from "@/components/match/GoldLead";

const TICK_MS = 5_000;
import { HiddenValue, RevealButton } from "@/components/spoiler/Spoiler";
import { useSpoilers } from "@/components/spoiler/SpoilerProvider";
import { LogoMark } from "@/components/ui/LogoMark";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useMatchEconomy, useMatchEvents } from "@/lib/api/endpoints";
import type { MatchSummary } from "@/lib/api/types";
import { formatBroadcastLanguage, formatViewerCount, shortTeamName } from "@/lib/utils/format";
import { seriesInfo } from "@/lib/utils/series";

export function MatchCenterPanel({ match }: { match: MatchSummary }) {
  const matchId = match?.id ?? "";
  const nameA = match?.team_a?.name ?? "TBD";
  const nameB = match?.team_b?.name ?? "TBD";
  const shortA = shortTeamName(match?.team_a);
  const shortB = shortTeamName(match?.team_b);
  // Full names from 641px up, short ones on phones where the line is tight.
  const teamName = (full: string, brief: string) => (
    <>
      <span className="min-[641px]:hidden">{brief}</span>
      <span className="max-[640px]:hidden">{full}</span>
    </>
  );

  const { isVisible } = useSpoilers();
  const visible = isVisible(matchId);
  const toast = useToast();
  const { language, setLanguage } = useMatchLanguage();
  const economy = useMatchEconomy(matchId, true);
  const events = useMatchEvents(matchId, true);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const cutoff = now - holdBackMs(match);
  const snapshots = (economy.data ?? []).filter(
    (snapshot) => Date.parse(snapshot?.recorded_at ?? "") <= cutoff,
  );
  const moments = (events.data ?? []).filter(
    (event) => Date.parse(event?.occurred_at ?? "") <= cutoff,
  );

  const times = [
    ...snapshots.map((snapshot) => Date.parse(snapshot.recorded_at)),
    ...moments.map((event) => Date.parse(event.occurred_at)),
  ].filter(Number.isFinite);
  const origin = times.length > 0 ? Math.min(...times) : 0;

  const points: LeadPoint[] = leadPoints(snapshots, match?.team_a?.id, match?.team_b?.id, origin);
  const latest = points[points.length - 1];

  const keyMoments = [...moments]
    .sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))
    .slice(0, 3);

  const game = match?.game_number ?? seriesInfo(match)?.game;
  const hasScore = match?.score_a != null && match?.score_b != null;
  const broadcasts = match?.broadcasts ?? [];
  const totalViewers = broadcasts.reduce((sum, item) => sum + (item?.viewer_count ?? 0), 0);
  const loading = economy.isLoading || events.isLoading;

  return (
    <div className="rounded-lg border border-stone bg-paper p-4 shadow-subtle min-[641px]:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-stone/50 pb-4">
        <div className="flex items-center gap-2.5 whitespace-nowrap font-graphik text-[17px] font-bold">
          <LogoMark source={match?.team_a} size="sm" />
          {teamName(nameA, shortA)}
          {hasScore ? (
            <span className="px-1 tabular-nums">
              {visible ? `${match.score_a}–${match.score_b}` : <HiddenValue>0–0</HiddenValue>}
            </span>
          ) : (
            <span className="px-1 text-pencil">vs</span>
          )}
          {teamName(nameB, shortB)}
          <LogoMark source={match?.team_b} size="sm" />
        </div>
        <span className="text-[13px] text-pencil">
          {visible && game ? `Game ${game} · ` : ""}
          {latest ? `${clock(latest.seconds)} · ` : ""}Synced to stream
        </span>
      </div>

      {visible ? (
        <div className="pt-[18px]">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">Gold lead{game ? `, Game ${game}` : ""}</h3>
            {latest ? (
              <span className="font-graphik text-[21px] font-bold">
                {latest.lead === 0
                  ? "Even"
                  : `${latest.lead > 0 ? shortA : shortB} ${goldLabel(latest.lead)}`}
                <small className="ml-1.5 font-body text-[13px] font-medium text-pencil">
                  at {clock(latest.seconds)}
                </small>
              </span>
            ) : null}
          </div>
          {loading ? (
            <Skeleton bg="bg-stone/40" className="h-[150px] w-full" />
          ) : points.length > 1 ? (
            <GoldLeadChart points={points} nameA={nameA} nameB={nameB} />
          ) : (
            <p className="grid h-[150px] place-items-center rounded-lg bg-ink/[0.03] px-4 text-center text-sm text-pencil">
              The gold lead appears once snapshots are recorded.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 flex min-h-[150px] flex-col items-center justify-center gap-2.5 rounded-lg bg-ink/[0.03] p-4 text-center text-sm text-pencil">
          <b className="font-graphik text-[17px] text-ink">Scores and events are hidden</b>
          <span>The gold lead and key moments would give away how the game is going.</span>
          <RevealButton matchId={matchId} size="md">
            Show for this match
          </RevealButton>
        </div>
      )}

      {visible || broadcasts.length > 0 ? (
        <div
          className={`mt-5 grid gap-5 border-t border-stone/50 pt-5 min-[641px]:gap-6 ${
            visible && broadcasts.length > 0
              ? "min-[641px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
              : ""
          }`}
        >
          {visible ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Key moments</h3>
              {keyMoments.length > 0 ? (
                <ol className="flex flex-col">
                  {keyMoments.map((event) => (
                    <li
                      key={event.id}
                      className="grid grid-cols-[48px_1fr] gap-2 border-b border-stone/50 py-[9px] text-sm last:border-b-0"
                    >
                      <time className="text-[13px] text-pencil">
                        {clock((Date.parse(event.occurred_at) - origin) / 1000)}
                      </time>
                      <span>{event.title}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-pencil">Key moments appear here as the match goes on.</p>
              )}
            </div>
          ) : null}

          {broadcasts.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Commentary</h3>
              <div
                role="group"
                aria-label="Commentary language"
                className="flex gap-2 overflow-x-auto [scrollbar-width:none] max-[640px]:-mx-4 max-[640px]:px-4 min-[641px]:flex-col"
              >
                {broadcasts.map((item) => {
                  const share = totalViewers > 0 ? (item.viewer_count / totalViewers) * 100 : 0;
                  const label = formatBroadcastLanguage(item.language);
                  return (
                    <button
                      key={item.language}
                      type="button"
                      aria-pressed={language === item.language}
                      onClick={() => {
                        setLanguage(item.language);
                        toast(`Switched commentary to ${label}.`);
                      }}
                      className="grid shrink-0 grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1.5 rounded-lg border border-stone px-3 py-[9px] text-left text-sm transition-colors hover:border-charcoal aria-pressed:border-ink aria-pressed:shadow-[inset_0_0_0_1px_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
                    >
                      <span className="font-medium">{label}</span>
                      <small className="text-xs text-pencil">
                        {formatViewerCount(item.viewer_count)}
                      </small>
                      <span
                        aria-hidden="true"
                        className="relative col-span-2 h-[3px] overflow-hidden rounded-full bg-stone/50 max-[640px]:hidden"
                      >
                        <span
                          className="absolute inset-y-0 left-0 rounded-full bg-charcoal"
                          style={{ width: `${share}%` }}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
