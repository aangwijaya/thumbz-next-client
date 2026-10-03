"use client";

import { FollowButton } from "@/components/home/FollowControls";
import { useMatchLanguage } from "@/components/home/MatchLanguage";
import { RevealButton, Spoiler } from "@/components/spoiler/Spoiler";
import { useSpoilers } from "@/components/spoiler/SpoilerProvider";
import { Badge } from "@/components/ui/Badge";
import { LogoMark } from "@/components/ui/LogoMark";
import { useToast } from "@/components/ui/Toast";
import type { BroadcastSummary, MatchDetail, TeamSummary } from "@/lib/api/types";
import {
  formatBroadcastLanguage,
  formatDateTime,
  formatViewerCount,
  shortTeamName,
} from "@/lib/utils/format";
import { seriesInfo } from "@/lib/utils/series";

interface ScoreStripProps {
  match: MatchDetail;
  broadcasts: BroadcastSummary[];
  /** Winner of each finished game, in order ("a", "b", or null when unknown). */
  winners: Array<"a" | "b" | null>;
}

function Team({ team, side }: { team?: TeamSummary | null; side: "a" | "b" }) {
  const name = team?.name ?? "TBD";
  return (
    <div
      className={`flex min-w-0 gap-2 max-[640px]:flex-col min-[641px]:items-center min-[641px]:gap-3.5 ${
        side === "b" ? "items-end text-right min-[641px]:flex-row-reverse" : "items-start"
      }`}
    >
      <LogoMark source={team} size="lg" />
      <div className="min-w-0">
        <p className="font-graphik text-base font-extrabold leading-tight tracking-[-0.01em] text-ink min-[641px]:text-[22px]">
          {name}
        </p>
        {team?.region ? (
          <p className="text-[13px] text-pencil max-[640px]:hidden">{team.region}</p>
        ) : null}
      </div>
      {team?.id ? (
        <div className="max-[640px]:hidden">
          <FollowButton team={team} />
        </div>
      ) : null}
    </div>
  );
}

export function ScoreStrip({ match, broadcasts, winners }: ScoreStripProps) {
  const toast = useToast();
  const { isVisible } = useSpoilers();
  const { language, setLanguage } = useMatchLanguage();
  const id = match?.id ?? "";
  const visible = isVisible(id);
  const isLive = match?.status === "live";
  const hasScore = match?.score_a != null && match?.score_b != null && match?.status !== "scheduled";
  const bestOf = match?.best_of ?? 1;
  const info = seriesInfo(match);

  const pointTeam = info?.pointSide === "a" ? match?.team_a : match?.team_b;
  const tension =
    isLive && info?.state === "match-point"
      ? `Match point · ${shortTeamName(pointTeam)}`
      : isLive && info?.state === "decider"
        ? "Decider"
        : null;

  const colorA = match?.team_a?.color_primary || "var(--color-ember-red)";
  const colorB = match?.team_b?.color_primary || "var(--color-cobalt-link)";
  const pips = Array.from({ length: bestOf }, (_, index) => {
    const winner = winners[index];
    if (winner) return visible ? (winner === "a" ? colorA : colorB) : "var(--color-stone)";
    if (index < winners.length) return "var(--color-stone)";
    // Where the live game sits tells how many games were played, so it hides with the score.
    return isLive && visible && index === winners.length ? "live" : null;
  });
  const gameNow = isLive ? (match?.game_number ?? winners.length + 1) : null;

  async function share() {
    const url = window.location.href;
    const title = `${match?.team_a?.name ?? "TBD"} vs ${match?.team_b?.name ?? "TBD"} on THUMBZ`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Link copied.");
    } catch {
      // The visitor closed the share sheet, or the clipboard is blocked.
    }
  }

  return (
    <div className="px-5 pt-3.5 min-[641px]:px-6 min-[901px]:px-1 min-[901px]:pt-[18px]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 min-[641px]:gap-6">
        <Team team={match?.team_a} side="a" />

        <div className="flex flex-col items-center gap-1.5">
          {tension ? (
            <Spoiler matchId={id}>
              <Badge tone="ember">{tension}</Badge>
            </Spoiler>
          ) : null}
          {hasScore ? (
            <p className="font-graphik text-[36px] font-extrabold leading-none tracking-[-0.02em] text-ink tabular-nums min-[641px]:text-[44px]">
              <Spoiler
                matchId={id}
                safe={<span className="text-[22px] font-bold text-pencil">vs</span>}
              >
                {match.score_a}
                <span aria-hidden="true" className="px-1.5 font-semibold text-stone min-[641px]:px-2.5">
                  –
                </span>
                {match.score_b}
                <span className="sr-only"> in the series</span>
              </Spoiler>
            </p>
          ) : (
            <p className="font-graphik text-[22px] font-bold text-pencil">vs</p>
          )}
          <div className="flex items-center gap-1" aria-hidden="true">
            {pips.map((color, index) =>
              color === "live" ? (
                <span key={index} className="relative h-1.5 w-5 rounded-full bg-ember-red min-[641px]:w-[26px]">
                  <span className="absolute -inset-[3px] rounded-[5px] border-2 border-ember-red opacity-35 motion-safe:animate-ping" />
                </span>
              ) : (
                <span
                  key={index}
                  className="h-1.5 w-5 rounded-full min-[641px]:w-[26px]"
                  style={{ background: color ?? "#eeecea" }}
                />
              ),
            )}
          </div>
          <p className="text-caption text-pencil">
            {gameNow
              ? visible
                ? `Game ${gameNow} of ${bestOf}`
                : `Best of ${bestOf}`
              : match?.status === "scheduled"
                ? `${formatDateTime(match?.scheduled_at ?? "")} UTC · Best of ${bestOf}`
                : `Best of ${bestOf}`}
          </p>
          {hasScore ? <RevealButton matchId={id}>Show score</RevealButton> : null}
        </div>

        <Team team={match?.team_b} side="b" />
      </div>

      {broadcasts.length > 0 || isLive ? (
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-t border-stone/50 pt-3 min-[641px]:mt-[18px] min-[641px]:pt-3.5">
          {broadcasts.length > 0 ? (
            <div
              role="group"
              aria-label="Commentary language"
              className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] max-[640px]:-mx-5 max-[640px]:w-[calc(100%+40px)] max-[640px]:px-5"
            >
              <span className="text-[13px] text-pencil max-[640px]:hidden">Commentary</span>
              {broadcasts.map((item) => (
                <button
                  key={item.language}
                  type="button"
                  aria-pressed={language === item.language}
                  onClick={() => {
                    setLanguage(item.language);
                    toast(`Switched commentary to ${formatBroadcastLanguage(item.language)}.`);
                  }}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-stone px-3 text-[13px] font-semibold text-ink transition-colors hover:border-charcoal aria-pressed:border-ink aria-pressed:shadow-[inset_0_0_0_1px_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember min-[641px]:min-h-[34px]"
                >
                  {formatBroadcastLanguage(item.language)}
                  <small className="text-caption font-medium text-pencil">
                    {formatViewerCount(item?.viewer_count ?? 0)}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={share}
            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-stone px-3 text-[13px] font-semibold text-ink transition-colors hover:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember max-[640px]:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
              aria-hidden="true"
            >
              <path d="M12 4v11M7.5 8.5 12 4l4.5 4.5" />
              <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
            </svg>
            Share
          </button>
        </div>
      ) : null}
    </div>
  );
}
