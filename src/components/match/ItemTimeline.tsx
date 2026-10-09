import { clock } from "@/components/match/GoldLead";
import { GameIcon } from "@/components/match/GameIcon";
import type { ItemPurchase } from "@/lib/api/types";
import { minuteTicks, timelineOf } from "@/lib/utils/builds";

const ICON = 22;
const LANE = 26;

export interface TimelinePlayer {
  id: string;
  nickname: string;
  hero: string | null;
  heroIcon: string | null;
  color: string;
}

/**
 * Every item each player bought, placed at the second they bought it (the
 * real item sequence). Each player's purchases are an ordered list, so
 * screen readers get "Blade of Despair, 10:42" in order; the axis is visual.
 */
export function ItemTimeline({
  players,
  purchases,
  startedAt,
  axisSeconds,
}: {
  players: TimelinePlayer[];
  purchases: ItemPurchase[];
  startedAt: number;
  axisSeconds: number;
}) {
  const ticks = minuteTicks(axisSeconds);
  const at = (seconds: number) => `${(seconds / Math.max(1, axisSeconds)) * 100}%`;

  return (
    <div className="overflow-hidden rounded-xl border border-stone bg-paper shadow-subtle">
      {/* The track scrolls inside the card on phones; the page never does. */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px] px-4 pb-3">
          <div className="grid grid-cols-[132px_minmax(0,1fr)] gap-3 border-b border-stone/50 py-2 text-caption text-pencil">
            <span>Player</span>
            <div className="relative h-4" aria-hidden="true">
              {ticks.map((minute) => (
                <span key={minute} className="absolute -translate-x-1/2 tabular-nums first:translate-x-0" style={{ left: at(minute * 60) }}>
                  {String(minute).padStart(2, "0")}
                </span>
              ))}
            </div>
          </div>
          <ul>
            {players.map((player) => {
              const marks = timelineOf(
                purchases.filter((p) => p.player_id === player.id),
                startedAt,
                axisSeconds,
              );
              const lanes = Math.max(1, ...marks.map((mark) => mark.lane + 1));
              return (
                <li key={player.id} className="grid grid-cols-[132px_minmax(0,1fr)] items-center gap-3 border-b border-stone/50 py-2 last:border-b-0">
                  <span className="flex min-w-0 items-center gap-2">
                    <GameIcon src={player.heroIcon} name={player.hero ?? player.nickname} size={26} className="rounded-md" tint={player.color} />
                    <span className="min-w-0">
                      <b className="block truncate text-[13px] font-semibold">{player.nickname}</b>
                      <small className="block truncate text-[11px] text-pencil">{player.hero ?? ""}</small>
                    </span>
                  </span>
                  {marks.length === 0 ? (
                    <span className="text-caption text-pencil">No purchases yet</span>
                  ) : (
                    <div className="relative" style={{ height: lanes * LANE }}>
                      {ticks.map((minute) => (
                        <span
                          key={minute}
                          aria-hidden="true"
                          className="absolute inset-y-0 w-px bg-stone/40"
                          style={{ left: at(minute * 60) }}
                        />
                      ))}
                      <ol aria-label={`${player.nickname}'s purchases`} className="absolute inset-0">
                        {marks.map((mark) => (
                          <li
                            key={mark.key}
                            className="absolute"
                            style={{
                              left: `min(${mark.left}%, calc(100% - ${ICON}px))`,
                              top: mark.lane * LANE + (LANE - ICON) / 2,
                            }}
                          >
                            <GameIcon
                              src={mark.icon_url}
                              name={`${mark.name}, ${clock(mark.second)}`}
                              size={ICON}
                              className={`rounded ${mark.tier === 3 ? "ring-2 ring-deep-ember" : ""}`}
                            />
                            <span className="sr-only">
                              {mark.name}, {clock(mark.second)}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <p className="border-t border-stone/50 px-4 py-2 text-caption text-pencil">
        Ringed: finished items. Times are when the item was bought.
      </p>
    </div>
  );
}
