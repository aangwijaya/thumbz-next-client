"use client";

import { useEffect, useState } from "react";

import { clock, GoldLeadChart, goldLabel, holdBackMs, leadPoints } from "@/components/match/GoldLead";
import { RevealButton } from "@/components/spoiler/Spoiler";
import { useSpoilers } from "@/components/spoiler/SpoilerProvider";
import { useMatchEconomy, useMatchEvents } from "@/lib/api/endpoints";
import type { MatchEvent, MatchSummary } from "@/lib/api/types";
import { dummyEconomy, dummyEvents, orDummy } from "@/lib/dummy/match";
import { shortTeamName } from "@/lib/utils/format";

const TICK_MS = 5_000;

// Short label for the event's square; unknown types fall back to the first letters.
const TYPE_LABELS: Record<string, string> = {
  lord: "LORD",
  turtle: "TRTL",
  tower: "TWR",
  first_blood: "FB",
  kill: "KILL",
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.slice(0, 4).toUpperCase();
}

export function MatchMoments({ match }: { match: MatchSummary }) {
  const id = match?.id ?? "";
  const live = match?.status === "live";
  const { isVisible } = useSpoilers();
  const economy = useMatchEconomy(id, live);
  const events = useMatchEvents(id, live);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [live]);

  if (!isVisible(id)) {
    return (
      <div className="flex min-h-[360px] flex-1 flex-col items-center justify-center gap-2.5 p-6 text-center text-[13px] text-pencil">
        <b className="font-graphik text-base text-ink">Moments are hidden</b>
        <span>The gold lead and objectives would give away how the game is going.</span>
        <RevealButton matchId={id}>Show for this match</RevealButton>
      </div>
    );
  }

  // While live, nothing newer than the stream delay is shown.
  const cutoff = live ? now - holdBackMs(match) : Number.POSITIVE_INFINITY;
  const snapshots = orDummy(economy.data, () => dummyEconomy(match)).filter(
    (snapshot) => Date.parse(snapshot?.recorded_at ?? "") <= cutoff,
  );
  const moments = orDummy(events.data, () => dummyEvents(match)).filter(
    (event) => Date.parse(event?.occurred_at ?? "") <= cutoff,
  );
  const times = [...snapshots.map((s) => s.recorded_at), ...moments.map((e) => e.occurred_at)]
    .map((value) => Date.parse(value))
    .filter(Number.isFinite);
  const origin = times.length > 0 ? Math.min(...times) : 0;
  const points = leadPoints(snapshots, match?.team_a?.id, match?.team_b?.id, origin);
  const latest = points[points.length - 1];
  const nameA = shortTeamName(match?.team_a);
  const nameB = shortTeamName(match?.team_b);
  const colorA = match?.team_a?.color_primary || "#e34432";
  const colorB = match?.team_b?.color_primary || "#0f66ae";
  const tint = (color: string, share: number) => `color-mix(in oklab, ${color} ${share}%, var(--color-paper))`;
  const newestFirst = [...moments].sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at));

  const side = (event: MatchEvent) =>
    event.team_id === match?.team_a?.id ? colorA : event.team_id === match?.team_b?.id ? colorB : null;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="border-b border-stone/50 px-5 pb-3 pt-4 min-[641px]:px-6 min-[901px]:px-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="text-[13px] font-semibold text-pencil">
            Gold lead{match?.game_number ? `, Game ${match.game_number}` : ""}
          </h3>
          {latest ? (
            <p className="font-graphik text-xl font-extrabold">
              {latest.lead === 0 ? "Even" : `${latest.lead > 0 ? nameA : nameB} ${goldLabel(latest.lead)}`}
              <small className="ml-1.5 font-body text-caption font-medium text-pencil">at {clock(latest.seconds)}</small>
            </p>
          ) : null}
        </div>
        {points.length > 1 ? (
          <GoldLeadChart
            points={points}
            nameA={nameA}
            nameB={nameB}
            height={120}
            fills={[tint(colorA, 22), tint(colorB, 26)]}
          />
        ) : (
          <p className="grid h-[120px] place-items-center rounded-lg bg-ink/[0.03] px-4 text-center text-sm text-pencil">
            The gold lead appears once the game is underway.
          </p>
        )}
      </div>

      {newestFirst.length > 0 ? (
        <ol className="px-5 pb-2 pt-1 min-[641px]:px-6 min-[901px]:px-4">
          {newestFirst.map((event) => {
            const color = side(event);
            return (
              <li
                key={event.id}
                className="grid grid-cols-[44px_32px_minmax(0,1fr)] items-center gap-2.5 border-b border-stone/50 py-2.5 text-sm last:border-b-0"
              >
                <time className="text-[13px] text-pencil">
                  {clock((Date.parse(event.occurred_at) - origin) / 1000)}
                </time>
                <span
                  aria-hidden="true"
                  className="grid size-8 place-items-center rounded-lg font-graphik text-[9px] font-extrabold text-ink"
                  style={{ background: color ? tint(color, 22) : "var(--color-wash, #f4f2ef)" }}
                >
                  {typeLabel(event.event_type ?? "")}
                </span>
                <p className="min-w-0">{event.title}</p>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="px-5 py-6 text-center text-sm text-pencil">Key moments appear here as the game goes on.</p>
      )}
    </div>
  );
}
