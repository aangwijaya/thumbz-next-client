"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { GoldSnapshot } from "@/lib/api/types";
import { formatViewerCount } from "@/lib/utils/format";

// Data newer than this is held back so the panel never runs ahead of the
// stream. The real delay is not in the API yet, so this is an assumption.
/** Live data newer than the stream delay stays hidden so nothing runs ahead of the video. */
export function holdBackMs(match?: { stream_delay_seconds?: number } | null): number {
  return (match?.stream_delay_seconds ?? 30) * 1000;
}

export interface LeadPoint {
  seconds: number;
  lead: number;
}

// Match clock: time since the first recorded snapshot or event.
export function clock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function goldLabel(lead: number): string {
  return `+${formatViewerCount(Math.abs(lead))}`;
}

interface ChartProps {
  points: LeadPoint[];
  nameA: string;
  nameB: string;
  /** Pixel height of the chart. */
  height?: number;
  /** Fills for the area where team A leads and where team B leads. */
  fills?: [string, string];
}

const PAD_TOP = 8;
const PAD_BOTTOM = 22;

export function GoldLeadChart({
  points,
  nameA,
  nameB,
  height: HEIGHT = 150,
  fills = ["#fde2d6", "var(--color-sky-wash)"],
}: ChartProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId().replace(/:/g, "");

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width) || 600);
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const last = points[points.length - 1];
  const maxSeconds = Math.max(last?.seconds ?? 0, 60);
  const maxAbs = Math.max(...points.map((point) => Math.abs(point.lead)), 0);
  const yMax = Math.max(2000, Math.ceil((maxAbs * 1.15) / 1000) * 1000);

  const x = (seconds: number) => (seconds / maxSeconds) * width;
  const y = (lead: number) =>
    PAD_TOP + (1 - (lead + yMax) / (2 * yMax)) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
  const zero = y(0);

  const line = points
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${x(point.seconds).toFixed(1)} ${y(point.lead).toFixed(1)}`,
    )
    .join("");
  const area = `${line}L${x(last?.seconds ?? 0).toFixed(1)} ${zero}L0 ${zero}Z`;

  const ticks = [0, 1 / 3, 2 / 3, 1].map((share) => share * maxSeconds);
  const active = hover != null ? points[hover] : null;

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const seconds = ((event.clientX - rect.left) / rect.width) * maxSeconds;
    let nearest = 0;
    points.forEach((point, index) => {
      if (Math.abs(point.seconds - seconds) < Math.abs((points[nearest]?.seconds ?? 0) - seconds)) {
        nearest = index;
      }
    });
    setHover(nearest);
  }

  const leader = (lead: number) => (lead >= 0 ? nameA : nameB);

  return (
    <div ref={boxRef} className="relative">
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`Gold difference over the match. ${leader(last?.lead ?? 0)} leads by ${Math.abs(last?.lead ?? 0).toLocaleString("en-US")} gold at ${clock(last?.seconds ?? 0)}.`}
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
        style={{ height: HEIGHT }}
        className="block w-full touch-pan-y"
      >
        <defs>
          <clipPath id={`${clipId}-above`}>
            <rect x="0" y="0" width={width} height={zero} />
          </clipPath>
          <clipPath id={`${clipId}-below`}>
            <rect x="0" y={zero} width={width} height={HEIGHT - zero} />
          </clipPath>
        </defs>
        <line x1="0" x2={width} y1={zero} y2={zero} stroke="var(--color-stone)" strokeWidth="1" />
        <path d={area} fill={fills[0]} clipPath={`url(#${clipId}-above)`} />
        <path d={area} fill={fills[1]} clipPath={`url(#${clipId}-below)`} />
        <path
          d={line}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <text x="4" y={PAD_TOP + 10} className="fill-pencil text-[11px]">
          {nameA} ahead
        </text>
        <text x="4" y={HEIGHT - PAD_BOTTOM - 4} className="fill-pencil text-[11px]">
          {nameB} ahead
        </text>
        {ticks.map((seconds, index) => (
          <text
            key={seconds}
            x={index === ticks.length - 1 ? width : x(seconds)}
            y={HEIGHT - 4}
            textAnchor={index === ticks.length - 1 ? "end" : "start"}
            className="fill-pencil text-[11px]"
          >
            {clock(seconds)}
          </text>
        ))}
        {last ? (
          <circle
            cx={x(last.seconds)}
            cy={y(last.lead)}
            r="4"
            fill="var(--color-ink)"
            stroke="var(--color-paper)"
            strokeWidth="2"
          />
        ) : null}
        {active ? (
          <line
            x1={x(active.seconds)}
            x2={x(active.seconds)}
            y1={PAD_TOP}
            y2={HEIGHT - PAD_BOTTOM}
            stroke="var(--color-graphite)"
            strokeWidth="1"
          />
        ) : null}
      </svg>
      {active ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2 py-1.5 text-caption text-paper"
          style={{
            left: Math.min(width - 80, Math.max(80, x(active.seconds))),
            top: y(active.lead) - 10,
          }}
        >
          {clock(active.seconds)} ·{" "}
          {active.lead === 0 ? "even" : `${leader(active.lead)} ${goldLabel(active.lead)} gold`}
        </div>
      ) : null}
    </div>
  );
}

// Gold lead of team A over team B at each snapshot, in seconds since `origin`.
export function leadPoints(
  snapshots: GoldSnapshot[],
  teamAId: string | undefined,
  teamBId: string | undefined,
  origin: number,
): LeadPoint[] {
  const goldByTime = new Map<number, { a?: number; b?: number }>();
  for (const snapshot of snapshots) {
    const time = Date.parse(snapshot?.recorded_at ?? "");
    if (!Number.isFinite(time)) continue;
    const entry = goldByTime.get(time) ?? {};
    if (snapshot.team_id === teamAId) entry.a = snapshot.gold;
    if (snapshot.team_id === teamBId) entry.b = snapshot.gold;
    goldByTime.set(time, entry);
  }
  const points: LeadPoint[] = [];
  let lastA: number | undefined;
  let lastB: number | undefined;
  for (const time of [...goldByTime.keys()].sort((a, b) => a - b)) {
    const entry = goldByTime.get(time);
    lastA = entry?.a ?? lastA;
    lastB = entry?.b ?? lastB;
    if (lastA != null && lastB != null) {
      points.push({ seconds: (time - origin) / 1000, lead: lastA - lastB });
    }
  }
  return points;
}
