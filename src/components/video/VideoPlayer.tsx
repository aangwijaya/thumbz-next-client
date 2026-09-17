"use client";

import { useEffect, useRef, useState } from "react";

import { LiveIndicator } from "../ui/LiveIndicator";

type PlayerState = "loading" | "playing" | "error" | "unavailable";

interface VideoPlayerProps {
  streamUrl: string | null;
  poster?: string | null;
  live?: boolean;
  title?: string;
  className?: string;
}

export function VideoPlayer({
  streamUrl,
  poster,
  live = false,
  title = "Live stream",
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<PlayerState>(
    streamUrl ? "loading" : "unavailable",
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!streamUrl) {
      setState("unavailable");
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let player: { destroy: () => Promise<void> } | null = null;
    setState("loading");

    async function init() {
      try {
        const shaka = (await import("shaka-player")).default;
        if (cancelled || !video) return;
        if (shaka.Player.isBrowserSupported()) {
          const shakaPlayer = new shaka.Player();
          player = shakaPlayer;
          shakaPlayer.addEventListener("error", () => {
            if (!cancelled) setState("error");
          });
          await shakaPlayer.attach(video);
          await shakaPlayer.load(streamUrl ?? "");
          if (cancelled) return;
          setState("playing");
          video.play().catch(() => undefined);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl ?? "";
          video.addEventListener(
            "canplay",
            () => {
              if (!cancelled) {
                setState("playing");
                video.play().catch(() => undefined);
              }
            },
            { once: true },
          );
          video.addEventListener(
            "error",
            () => {
              if (!cancelled) setState("error");
            },
            { once: true },
          );
        } else {
          setState("unavailable");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    }

    init();
    return () => {
      cancelled = true;
      player?.destroy().catch(() => undefined);
    };
  }, [streamUrl, attempt]);

  return (
    <div
      className={`relative aspect-video overflow-hidden rounded-xl border border-page-dark-border bg-black ${className}`}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full"
        poster={poster ?? undefined}
        controls
        muted
        playsInline
        aria-label={title}
      />

      {live && state === "playing" ? (
        <span className="absolute left-4 top-4 rounded bg-black/60 px-3 py-1.5 backdrop-blur-sm">
          <LiveIndicator />
        </span>
      ) : null}

      {state === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
            Loading stream…
          </p>
        </div>
      ) : null}

      {state === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
          <p className="font-display text-xl tracking-tight">
            This stream is unavailable
          </p>
          <p className="text-sm text-text-secondary">
            Something went wrong while loading the broadcast.
          </p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="rounded-full border border-border px-5 py-2 text-sm font-medium transition-colors hover:border-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary"
          >
            Try again
          </button>
        </div>
      ) : null}

      {state === "unavailable" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="font-display text-xl tracking-tight">Stream unavailable</p>
          <p className="text-sm text-text-secondary">
            There is no playable broadcast for this match right now.
          </p>
        </div>
      ) : null}
    </div>
  );
}
