"use client";

import type { ReactNode, RefObject } from "react";

interface PlayerShellProps {
  containerRef: RefObject<HTMLDivElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  title: string;
  poster?: string | null;
  /** Team colours tint the backdrop while there is no picture. */
  colors?: Array<string | undefined>;
  /** The <video> is hidden until it has a picture to show. */
  showVideo: boolean;
  top?: ReactNode;
  overlay?: ReactNode;
  controls?: ReactNode;
  className?: string;
}

/**
 * The frame both players share: a 16:9 box (focusable, so keyboard shortcuts
 * work), an inline `playsInline` video for iOS, and slots for badges,
 * state overlays and controls.
 */
export function PlayerShell({
  containerRef,
  videoRef,
  title,
  poster,
  colors = [],
  showVideo,
  top,
  overlay,
  controls,
  className = "",
}: PlayerShellProps) {
  const first = colors[0] || "var(--color-graphite)";
  const second = colors[1] || colors[0] || "var(--color-teal-dusk)";

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label={`Video player: ${title}`}
      className={`relative aspect-video overflow-hidden bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember ${className}`}
      style={{
        backgroundImage: `radial-gradient(55% 65% at 28% 42%, color-mix(in oklab, ${first} 42%, transparent), transparent 70%), radial-gradient(50% 60% at 76% 64%, color-mix(in oklab, ${second} 36%, transparent), transparent 70%), repeating-linear-gradient(135deg, rgb(255 255 255 / 0.04) 0 1px, transparent 1px 40px), linear-gradient(160deg, #2c332d, #191b1d 58%, #262033)`,
      }}
    >
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full ${showVideo ? "" : "invisible"}`}
        poster={poster ?? undefined}
        muted
        playsInline
        controlsList="nodownload"
        aria-label={title}
        onClick={(event) => {
          const video = event.currentTarget;
          if (video.paused) video.play().catch(() => undefined);
          else video.pause();
        }}
      />
      {top ? (
        <div className="absolute inset-x-2.5 top-2.5 flex items-center gap-2 min-[641px]:inset-x-3.5 min-[641px]:top-3.5">
          {top}
        </div>
      ) : null}
      {overlay}
      {controls}
    </div>
  );
}

/** Centered message over the player, optionally with one action. */
export function PlayerMessage({
  title,
  body,
  action,
  dim = false,
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  dim?: boolean;
}) {
  return (
    <div
      role="status"
      className={`absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-paper ${dim ? "bg-ink/70" : ""}`}
    >
      <div>
        <p className="font-graphik text-body-lg font-bold">{title}</p>
        {body ? <p className="mt-1 text-body-sm text-paper/75">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export const playerActionClass =
  "inline-flex min-h-11 items-center rounded-lg border border-paper/50 px-4 text-body-sm font-semibold text-paper transition-colors hover:border-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper";
