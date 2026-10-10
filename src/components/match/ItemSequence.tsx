"use client";

import { useState } from "react";

import { clock } from "@/components/match/GoldLead";
import { GameIcon } from "@/components/match/GameIcon";
import type { ItemPurchase, MatchEvent } from "@/lib/api/types";
import { minuteTicks } from "@/lib/utils/builds";
import { tint } from "@/lib/utils/team-colors";

export interface SequencePlayer {
  id: string;
  nickname: string;
  hero: string | null;
  heroIcon: string | null;
  /** "EXP lane", "Jungle"… */
  lane: string;
}

interface Buy {
  second: number;
  name: string;
  icon: string | null;
  finished: boolean;
}

const OBJECTIVES: Record<string, string> = { first_blood: "FB", turtle: "Turtle", tower: "Tower", lord: "Lord" };
const isBoots = (name: string) => /boots|shoes/i.test(name);

function buysOf(purchases: ItemPurchase[], playerId: string, startedAt: number): Buy[] {
  return purchases
    .filter((purchase) => purchase?.player_id === playerId)
    .map((purchase) => ({
      second: Math.max(0, (Date.parse(purchase?.purchased_at ?? "") - startedAt) / 1000),
      name: purchase?.item_name ?? "Item",
      icon: purchase?.icon_url ?? null,
      finished: purchase?.tier === 3,
    }))
    .filter((buy) => Number.isFinite(buy.second))
    .sort((x, y) => x.second - y.second);
}

/** The first finished item that is not boots: when a player's build comes online. */
function coreOf(buys: Buy[]): Buy | undefined {
  return buys.find((buy) => buy.finished && !isBoots(buy.name));
}

/**
 * The item sequence as power spikes: per lane, both players' purchases on the
 * game clock (finished items as icons, components as dots) with objectives
 * as dashed lines, and who finished their first core item first. Phones get
 * one lane at a time as a race list. Picking a player shows their build order.
 */
export function ItemSequence({
  playersA,
  playersB,
  purchases,
  events,
  startedAt,
  axisSeconds,
  colors,
  teamIds,
  names,
}: {
  playersA: SequencePlayer[];
  playersB: SequencePlayer[];
  purchases: ItemPurchase[];
  events: MatchEvent[];
  startedAt: number;
  axisSeconds: number;
  colors: [string, string];
  teamIds: [string | undefined, string | undefined];
  names: [string, string];
}) {
  const pairs = Array.from({ length: Math.max(playersA.length, playersB.length) }, (_, index) => ({
    a: playersA[index],
    b: playersB[index],
    lane: playersA[index]?.lane ?? playersB[index]?.lane ?? `Lane ${index + 1}`,
  }));
  const [picked, setPicked] = useState<string | null>(null);
  const [pairIndex, setPairIndex] = useState(0);
  const selectedId = picked ?? playersA[0]?.id ?? playersB[0]?.id ?? null;
  const axis = Math.max(60, axisSeconds);
  const at = (second: number) => `${Math.min(100, (second / axis) * 100)}%`;
  const ticks = minuteTicks(axis);

  const objectives = events
    .filter((event) => OBJECTIVES[event?.event_type ?? ""])
    .map((event) => ({
      second: (Date.parse(event?.occurred_at ?? "") - startedAt) / 1000,
      label: OBJECTIVES[event.event_type] ?? "",
      side: event?.team_id === teamIds[0] ? 0 : 1,
    }))
    .filter((event) => Number.isFinite(event.second) && event.second >= 0 && event.second <= axis);

  const selected = [...playersA, ...playersB].find((player) => player.id === selectedId);
  const selectedSide = playersA.some((player) => player.id === selectedId) ? 0 : 1;
  const selectedBuys = selected ? buysOf(purchases, selected.id, startedAt) : [];

  const raceA = pairs[pairIndex]?.a;
  const raceB = pairs[pairIndex]?.b;
  const race = [
    ...(raceA ? buysOf(purchases, raceA.id, startedAt).map((buy) => ({ ...buy, side: 0 as const })) : []),
    ...(raceB ? buysOf(purchases, raceB.id, startedAt).map((buy) => ({ ...buy, side: 1 as const })) : []),
  ].sort((x, y) => x.second - y.second);
  const raceObjectives = objectives.filter((event) => event.label === "Lord" || event.label === "Turtle");

  const whoButton = (player: SequencePlayer | undefined, side: 0 | 1) =>
    player ? (
      <button
        type="button"
        aria-pressed={player.id === selectedId}
        onClick={() => setPicked(player.id)}
        className="-ml-1.5 flex h-[34px] items-center gap-2 rounded-lg px-1.5 text-left text-[13px] font-semibold text-ink transition-colors hover:bg-cream aria-pressed:bg-ink aria-pressed:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
      >
        <GameIcon src={player.heroIcon} name={player.hero ?? player.nickname} size={24} className="rounded-md" tint={tint(colors[side], 22)} />
        <span className="truncate">{player.nickname}</span>
      </button>
    ) : (
      <span className="h-[34px]" />
    );

  const track = (player: SequencePlayer | undefined, side: 0 | 1) => {
    const buys = player ? buysOf(purchases, player.id, startedAt) : [];
    return (
      <ol aria-label={`${player?.nickname ?? names[side]} purchases in order`} className="relative h-[34px] before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-[#eeecea]">
        {objectives.map((event, index) => (
          <li key={`o${index}`} aria-hidden="true" className="absolute -inset-y-2 w-px bg-[repeating-linear-gradient(var(--color-stone)_0_3px,transparent_3px_6px)]" style={{ left: at(event.second) }} />
        ))}
        {buys.map((buy, index) =>
          buy.finished ? (
            <li
              key={index}
              title={`${buy.name}, ${clock(buy.second)}`}
              className="absolute top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2 rounded-lg border-[1.5px] bg-paper transition-transform hover:scale-115"
              style={{ left: at(buy.second), borderColor: tint(colors[side], 55) }}
            >
              <GameIcon src={buy.icon} name={buy.name} size={26} className="rounded-md" tint={tint(colors[side], 18)} />
              <span className="sr-only">
                {buy.name}, {clock(buy.second)}
              </span>
            </li>
          ) : (
            <li key={index} title={`${buy.name}, ${clock(buy.second)}`} className="absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-graphite">
              <span className="sr-only">
                {buy.name}, {clock(buy.second)}
              </span>
            </li>
          ),
        )}
      </ol>
    );
  };

  return (
    <section aria-labelledby="item-sequence-title" className="overflow-hidden rounded-xl border border-stone bg-paper shadow-subtle">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5 border-b border-stone px-[18px] py-4 max-[640px]:px-3.5">
        <div>
          <h3 id="item-sequence-title" className="font-graphik text-[17px] font-bold leading-snug text-ink">
            Item sequence
          </h3>
          <p className="mt-0.5 max-w-[60ch] text-[13px] text-pencil">
            When each player finished their core items, lane against lane, with the objectives around them. Pick a player for their full build order.
          </p>
        </div>
        <p aria-hidden="true" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-pencil max-[640px]:hidden">
          <span className="inline-flex items-center gap-1.5">
            <i className="size-3.5 rounded border-[1.5px] border-charcoal" />
            Finished item
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="size-[7px] rounded-full bg-graphite" />
            Component
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="h-3.5 w-px bg-[repeating-linear-gradient(var(--color-charcoal)_0_3px,transparent_3px_6px)]" />
            Objective
          </span>
        </p>
      </div>

      {/* Wide screens: every lane on one board. */}
      <div className="px-[18px] pb-2 pt-1 max-[640px]:hidden">
        <div aria-hidden="true" className="grid grid-cols-[168px_minmax(0,1fr)_132px] items-end gap-[18px]">
          <span className="pb-2 text-caption font-semibold text-pencil">Lane</span>
          <div className="relative h-[46px]">
            {objectives.map((event, index) => (
              <span key={index} className="absolute top-1.5 flex -translate-x-1/2 flex-col items-center" style={{ left: at(event.second) }}>
                <b
                  className="whitespace-nowrap rounded-[5px] px-1.5 text-[10px] font-bold"
                  style={{ background: tint(colors[event.side], 16), color: `color-mix(in oklab, ${colors[event.side]} 62%, var(--color-ink))` }}
                >
                  {event.label}
                </b>
                <i className="h-3 w-px bg-stone" />
              </span>
            ))}
          </div>
          <span className="pb-2 text-caption font-semibold text-pencil">First core item</span>
        </div>
        {pairs.map((pair, index) => {
          const coreA = pair.a ? coreOf(buysOf(purchases, pair.a.id, startedAt)) : undefined;
          const coreB = pair.b ? coreOf(buysOf(purchases, pair.b.id, startedAt)) : undefined;
          const first = coreA && coreB ? (coreA.second <= coreB.second ? 0 : 1) : coreA ? 0 : coreB ? 1 : null;
          const firstName = first === 0 ? pair.a?.nickname : first === 1 ? pair.b?.nickname : null;
          const selectedHere = pair.a?.id === selectedId || pair.b?.id === selectedId;
          return (
            <div
              key={index}
              className={`grid grid-cols-[168px_minmax(0,1fr)_132px] items-center gap-[18px] border-t border-[#eeecea] py-2.5 ${
                selectedHere ? "-mx-[18px] bg-[#fdfaf7] px-[18px]" : ""
              }`}
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold tracking-[0.06em] text-pencil">{pair.lane.toUpperCase()}</span>
                {whoButton(pair.a, 0)}
                {whoButton(pair.b, 1)}
              </div>
              <div className="flex flex-col gap-1.5 pt-5">
                {track(pair.a, 0)}
                {track(pair.b, 1)}
              </div>
              <p className="text-caption leading-snug text-pencil">
                {firstName && first != null ? (
                  <b className="block text-[13px] font-semibold" style={{ color: `color-mix(in oklab, ${colors[first]} 60%, var(--color-ink))` }}>
                    {firstName}
                    {coreA && coreB ? ` by ${clock(Math.abs(coreA.second - coreB.second))}` : ""}
                  </b>
                ) : (
                  <b className="block text-[13px] font-semibold text-pencil">No core item yet</b>
                )}
                {[coreA ? `${coreA.name} ${clock(coreA.second)}` : null, coreB ? `${coreB.name} ${clock(coreB.second)}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          );
        })}
        <div aria-hidden="true" className="grid grid-cols-[168px_minmax(0,1fr)_132px] gap-[18px]">
          <span />
          <div className="relative h-[18px] text-[11px] text-pencil">
            {ticks.map((minute) => (
              <span key={minute} className="absolute top-0 -translate-x-1/2 first:translate-x-0" style={{ left: at(minute * 60) }}>
                {minute}:00
              </span>
            ))}
          </div>
          <span />
        </div>
      </div>

      {/* Phones: one lane at a time, both players' purchases in order. */}
      <div className="min-[641px]:hidden">
        <div role="group" aria-label="Lane" className="flex gap-1.5 overflow-x-auto border-b border-[#eeecea] px-3.5 py-3 [scrollbar-width:none]">
          {pairs.map((pair, index) => (
            <button
              key={index}
              type="button"
              aria-pressed={index === pairIndex}
              onClick={() => {
                setPairIndex(index);
                setPicked(pair.a?.id ?? pair.b?.id ?? null);
              }}
              className="min-h-9 shrink-0 rounded-full border border-stone px-3 text-[13px] font-semibold text-charcoal aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
            >
              {pair.lane}
            </button>
          ))}
        </div>
        <p className="grid grid-cols-[minmax(0,1fr)_52px_minmax(0,1fr)] gap-2 px-3.5 pb-1 pt-3 text-caption font-semibold text-pencil">
          <span className="truncate">
            {names[0]} · {raceA?.nickname ?? "—"}
          </span>
          <span />
          <span className="truncate text-right">
            {raceB?.nickname ?? "—"} · {names[1]}
          </span>
        </p>
        <ol
          aria-label={`${pairs[pairIndex]?.lane ?? "Lane"} purchases and objectives in order`}
          className="relative px-3.5 pb-3.5 before:absolute before:bottom-3.5 before:left-1/2 before:top-0 before:w-px before:bg-stone"
        >
          {[
            ...race.map((buy) => ({ kind: "buy" as const, second: buy.second, buy })),
            ...raceObjectives.map((event) => ({ kind: "event" as const, second: event.second, event })),
          ]
            .sort((x, y) => x.second - y.second)
            .map((row, index) =>
              row.kind === "event" ? (
                <li key={index} className="relative grid min-h-10 place-items-center">
                  <span
                    className="z-[1] rounded-md px-2 py-0.5 text-[11px] font-bold"
                    style={{ background: tint(colors[row.event.side], 14), color: `color-mix(in oklab, ${colors[row.event.side]} 62%, var(--color-ink))` }}
                  >
                    {clock(row.second)} · {row.event.label} · {names[row.event.side]}
                  </span>
                </li>
              ) : (
                <li key={index} className="relative grid min-h-10 grid-cols-[minmax(0,1fr)_52px_minmax(0,1fr)] items-center gap-2">
                  <span
                    className={`row-start-1 flex min-w-0 items-center gap-2 ${
                      row.buy.side === 0 ? "justify-end text-right" : ""
                    } ${row.buy.finished ? "text-[13px] font-semibold text-ink" : "text-caption text-pencil"}`}
                    style={{ gridColumn: row.buy.side === 0 ? 1 : 3 }}
                  >
                    {row.buy.side === 1 && row.buy.finished ? (
                      <GameIcon src={row.buy.icon} name={row.buy.name} size={26} className="rounded-md" tint={tint(colors[1], 16)} />
                    ) : null}
                    <span className="truncate">{row.buy.name}</span>
                    {row.buy.side === 0 && row.buy.finished ? (
                      <GameIcon src={row.buy.icon} name={row.buy.name} size={26} className="rounded-md" tint={tint(colors[0], 16)} />
                    ) : null}
                  </span>
                  <time className="z-[1] col-start-2 row-start-1 justify-self-center rounded-md bg-paper px-1.5 py-0.5 text-[11px] font-semibold shadow-[inset_0_0_0_1px_var(--color-stone)]">
                    {clock(row.second)}
                  </time>
                </li>
              ),
            )}
        </ol>
      </div>

      {selected ? (
        <div className="border-t border-stone bg-[#fdfaf7] px-[18px] pb-[18px] pt-4 max-[640px]:px-3.5">
          <div className="mb-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <GameIcon src={selected.heroIcon} name={selected.hero ?? selected.nickname} size={32} className="rounded-lg" tint={tint(colors[selectedSide], 22)} />
            <h4 className="font-graphik text-[15px] font-bold text-ink">
              {selected.nickname}
              {selected.hero ? `, ${selected.hero}` : ""}
            </h4>
            <span className="text-[13px] text-pencil">Build order · {selectedBuys.length} purchases</span>
          </div>
          <ol aria-label={`${selected.nickname} build order`} className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
            {selectedBuys.map((buy, index) => (
              <li key={index} className="flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden="true" className="h-px w-2.5 bg-graphite" /> : null}
                <span
                  className={`flex items-center gap-2 rounded-[10px] border ${
                    buy.finished ? "border-stone bg-paper py-[5px] pl-[5px] pr-2.5" : "border-dashed border-stone px-2 py-1"
                  }`}
                >
                  {buy.finished ? (
                    <GameIcon src={buy.icon} name={buy.name} size={28} className="rounded-md" tint={tint(colors[selectedSide], 16)} />
                  ) : null}
                  <span>
                    <b className={`block leading-tight ${buy.finished ? "text-[13px] font-semibold text-ink" : "text-caption font-medium text-charcoal"}`}>
                      {buy.name}
                    </b>
                    <span className="text-[11px] text-pencil">
                      {clock(buy.second)}
                      {buy.finished ? " · finished" : ""}
                    </span>
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
