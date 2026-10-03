"use client";

import { useEffect, useRef, useState } from "react";

import { useMatchLanguage } from "@/components/home/MatchLanguage";
import { LiveDot } from "@/components/ui/LiveDot";
import type { BroadcastSummary } from "@/lib/api/types";
import { formatViewerCount } from "@/lib/utils/format";

type PlayerState = "loading" | "playing" | "error" | "unavailable";

interface VideoPlayerProps {
  /** The match's default stream. */
  streamUrl: string | null;
  /** Language variants; the one picked in the commentary switch plays when it has a URL. */
  broadcasts?: BroadcastSummary[];
  poster?: string | null;
  live?: boolean;
  viewers?: number;
  title: string;
  /** Shown behind the player when there is no picture yet. */
  colors?: Array<string | undefined>;
  /** Top-right label, e.g. the game and its clock. */
  badge?: React.ReactNode;
  className?: string;
}

const iconClass = "size-[18px]";

export function VideoPlayer({
  streamUrl,
  broadcasts = [],
  poster,
  live = false,
  viewers = 0,
  title,
  colors = [],
  badge,
  className = "",
}: VideoPlayerProps) {
  const { language } = useMatchLanguage();
  const picked = broadcasts.find((item) => item?.language === language)?.stream_url;
  const url = picked || streamUrl;

  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PlayerState>(url ? "loading" : "unavailable");
  const [attempt, setAttempt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!url) {
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
          await shakaPlayer.load(url ?? "");
          if (cancelled) return;
          setState("playing");
          video.play().catch(() => undefined);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url ?? "";
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
  }, [url, attempt]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  // Jump to the newest part of a live stream.
  function goLive() {
    const video = videoRef.current;
    if (!video || video.seekable.length === 0) return;
    video.currentTime = video.seekable.end(video.seekable.length - 1);
    video.play().catch(() => undefined);
  }

  function toggleFullscreen() {
    const box = boxRef.current;
    if (!box) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else box.requestFullscreen?.().catch(() => undefined);
  }

  const first = colors[0] || "var(--color-graphite)";
  const second = colors[1] || colors[0] || "var(--color-teal-dusk)";
  const playing = state === "playing";
  const control =
    "grid size-[34px] place-items-center rounded-lg text-paper transition-colors hover:bg-paper/15 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-paper disabled:opacity-50";

  return (
    <div
      ref={boxRef}
      className={`relative aspect-video overflow-hidden bg-ink ${className}`}
      style={{
        backgroundImage: `radial-gradient(55% 65% at 28% 42%, color-mix(in oklab, ${first} 42%, transparent), transparent 70%), radial-gradient(50% 60% at 76% 64%, color-mix(in oklab, ${second} 36%, transparent), transparent 70%), repeating-linear-gradient(135deg, rgb(255 255 255 / 0.04) 0 1px, transparent 1px 40px), linear-gradient(160deg, #2c332d, #191b1d 58%, #262033)`,
      }}
    >
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full ${playing ? "" : "invisible"}`}
        poster={poster ?? undefined}
        muted
        playsInline
        aria-label={title}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        onClick={togglePlay}
      />

      <div className="absolute inset-x-2.5 top-2.5 flex items-center gap-2 min-[641px]:inset-x-3.5 min-[641px]:top-3.5">
        {live ? (
          <span className="rounded-md bg-deep-ember px-2 py-1 text-[11px] font-bold tracking-[0.08em] text-paper">
            LIVE
          </span>
        ) : null}
        {live && viewers > 0 ? (
          <span className="rounded-[7px] bg-ink/60 px-2 py-1 text-caption font-medium text-paper">
            {formatViewerCount(viewers)} watching
          </span>
        ) : null}
        <span className="flex-1" />
        {badge ? (
          <span className="rounded-[7px] bg-ink/60 px-2 py-1 text-caption font-medium text-paper">
            {badge}
          </span>
        ) : null}
      </div>

      {state === "loading" ? (
        <p className="absolute inset-0 grid place-items-center text-body-sm text-paper/80">
          Loading stream…
        </p>
      ) : null}
      {state === "unavailable" ? (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-paper">
          <div>
            <p className="font-graphik text-body-lg font-bold">
              {live ? "The stream is not available here yet" : "No stream for this match yet"}
            </p>
            <p className="mt-1 text-body-sm text-paper/75">
              {live ? "Chat, moments and live stats below are still updating." : "Check back when the match starts."}
            </p>
          </div>
        </div>
      ) : null}
      {state === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink/70 px-6 text-center text-paper">
          <p className="font-graphik text-body-lg font-bold">This stream stopped loading</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="min-h-11 rounded-lg border border-paper/50 px-4 text-body-sm font-semibold transition-colors hover:border-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
          >
            Try again
          </button>
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/85 to-transparent px-2.5 pb-2 pt-7 min-[641px]:px-4 min-[641px]:pb-3 min-[641px]:pt-9">
        {live ? <div className="mb-2 h-1 rounded-full bg-ember-red min-[641px]:mb-3" /> : null}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={control}
            onClick={togglePlay}
            disabled={!playing}
            aria-label={paused ? "Play" : "Pause"}
          >
            {paused ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden="true">
                <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className={control}
            onClick={toggleMute}
            disabled={!playing}
            aria-label={muted ? "Unmute" : "Mute"}
            aria-pressed={!muted}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={iconClass}
              aria-hidden="true"
            >
              <path d="M4 9v6h4l5 4V5L8 9z" />
              {muted ? <path d="m17 9 4 6m0-6-4 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7" />}
            </svg>
          </button>
          {live ? (
            <button
              type="button"
              onClick={goLive}
              disabled={!playing}
              className="ml-1 inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-1.5 text-caption font-bold tracking-[0.06em] text-paper transition-colors hover:bg-paper/15 focus-visible:outline-2 focus-visible:outline-paper"
            >
              <LiveDot />
              LIVE
            </button>
          ) : null}
          <span className="flex-1" />
          <button
            type="button"
            className={control}
            onClick={toggleFullscreen}
            aria-label="Full screen"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              className={iconClass}
              aria-hidden="true"
            >
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
