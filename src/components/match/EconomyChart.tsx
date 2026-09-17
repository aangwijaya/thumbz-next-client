"use client";

import { useMemo } from "react";

import { useMatchEconomy } from "@/lib/api/endpoints";
import type { GoldSnapshot, TeamSummary } from "@/lib/api/types";
import { formatViewerCount } from "@/lib/utils/format";

import { EmptyState } from "../ui/EmptyState";
import { Skeleton } from "../ui/Skeleton";

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 52, bottom: 24, left: 12 };

interface EconomyChartProps {
  matchId: string;
  live: boolean;
  teamA?: TeamSummary | null;
  teamB?: TeamSummary | null;
  className?: string;
}

function buildSeries(
  snapshots: GoldSnapshot[],
  teamId: string | undefined,
): GoldSnapshot[] {
  if (!teamId) return [];
  return snapshots
    .filter((snapshot) => snapshot?.team_id === teamId)
    .sort((a, b) => (a?.recorded_at ?? "").localeCompare(b?.recorded_at ?? ""));
}

function pathFrom(points: Array<{ x: number; y: number }>): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
}

export function EconomyChart({
  matchId,
  live,
  teamA,
  teamB,
  className = "",
}: EconomyChartProps) {
  const economy = useMatchEconomy(matchId, live);
  const snapshots = useMemo(() => economy.data ?? [], [economy.data]);

  const seriesA = useMemo(() => buildSeries(snapshots, teamA?.id), [snapshots, teamA?.id]);
  const seriesB = useMemo(() => buildSeries(snapshots, teamB?.id), [snapshots, teamB?.id]);

  const chart = useMemo(() => {
    const all = [...seriesA, ...seriesB];
    if (all.length === 0) return null;
    const times = all.map((snapshot) => new Date(snapshot?.recorded_at ?? "").getTime());
    const golds = all.map((snapshot) => snapshot?.gold ?? 0);
    const minT = Math.min(...times);
    const maxT = Math.max(...times, minT + 60_000);
    const maxG = Math.max(...golds, 1) * 1.08;
    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const x = (time: number) => PAD.left + ((time - minT) / (maxT - minT)) * innerW;
    const y = (gold: number) => PAD.top + innerH - (gold / maxG) * innerH;
    const toPoints = (series: GoldSnapshot[]) =>
      series.map((snapshot) => ({
        x: x(new Date(snapshot?.recorded_at ?? "").getTime()),
        y: y(snapshot?.gold ?? 0),
      }));
    const ticks = Array.from({ length: 5 }).map((_, index) => {
      const time = minT + ((maxT - minT) / 4) * index;
      return { x: x(time), label: `${Math.round((time - minT) / 60_000)}m` };
    });
    const grid = Array.from({ length: 4 }).map((_, index) => {
      const gold = (maxG / 4) * (index + 1);
      return { y: y(gold), label: formatViewerCount(Math.round(gold)) };
    });
    return { a: toPoints(seriesA), b: toPoints(seriesB), ticks, grid };
  }, [seriesA, seriesB]);

  const latestA = seriesA.at(-1)?.gold ?? null;
  const latestB = seriesB.at(-1)?.gold ?? null;
  const diff = latestA != null && latestB != null ? latestA - latestB : null;
  const leader = diff == null || diff === 0 ? null : diff > 0 ? teamA : teamB;
  const total = (latestA ?? 0) + (latestB ?? 0);
  const shareA = total > 0 && latestA != null ? Math.round((latestA / total) * 100) : null;

  const colorA = teamA?.color_primary ?? "#f5a623";
  const colorB = teamB?.color_primary ?? "#a0b5eb";

  const loading = economy.isLoading;
  const empty = !loading && snapshots.length === 0;

  return (
    <section
      className={`flex flex-col gap-4 rounded-xl border border-page-dark-border bg-page-dark-surface p-4 sm:p-5 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary">
          Gold economy
        </h2>
        {diff != null ? (
          <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: colorA }} />
              {formatViewerCount(latestA ?? 0)}
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: colorB }} />
              {formatViewerCount(latestB ?? 0)}
            </span>
            <span className={diff === 0 ? "text-text-secondary" : ""} style={leader ? { color: leader.color_primary } : undefined}>
              {diff === 0
                ? "Even"
                : `+${formatViewerCount(Math.abs(diff))} ${leader?.name ?? ""}`}
            </span>
          </div>
        ) : null}
      </div>

      {loading ? (
        <Skeleton className="h-56 w-full" />
      ) : empty || !chart ? (
        <EmptyState
          title="No economy data yet"
          description="The gold trend appears once snapshots are recorded."
        />
      ) : (
        <>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full"
            role="img"
            aria-label="Gold economy trend for both teams"
          >
            {chart.grid.map((line) => (
              <g key={line.y}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={line.y}
                  y2={line.y}
                  stroke="#2b2723"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={WIDTH - PAD.right + 8}
                  y={line.y + 4}
                  fill="#797776"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                >
                  {line.label}
                </text>
              </g>
            ))}
            {chart.ticks.map((tick) => (
              <text
                key={tick.x}
                x={tick.x}
                y={HEIGHT - 6}
                fill="#797776"
                fontSize="11"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
              >
                {tick.label}
              </text>
            ))}
            <path
              d={pathFrom(chart.a)}
              fill="none"
              stroke={colorA}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={pathFrom(chart.b)}
              fill="none"
              stroke={colorB}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            {chart.a.length > 0 ? (
              <circle
                cx={chart.a.at(-1)?.x}
                cy={chart.a.at(-1)?.y}
                r="3.5"
                fill={colorA}
              />
            ) : null}
            {chart.b.length > 0 ? (
              <circle
                cx={chart.b.at(-1)?.x}
                cy={chart.b.at(-1)?.y}
                r="3.5"
                fill={colorB}
              />
            ) : null}
          </svg>

          {shareA != null ? (
            <div
              className="flex h-1 w-full overflow-hidden rounded-full bg-page-dark"
              role="img"
              aria-label={`Gold share ${shareA}% to ${100 - shareA}%`}
            >
              <span style={{ width: `${shareA}%`, backgroundColor: colorA }} />
              <span className="flex-1" style={{ backgroundColor: colorB }} />
            </div>
          ) : null}
        </>
      )}

      {economy.isError && snapshots.length > 0 ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-warning">
          Reconnecting…
        </p>
      ) : null}
    </section>
  );
}
