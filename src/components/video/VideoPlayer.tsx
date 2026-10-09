"use client";

import { useEffect, useRef, useState } from "react";

import { useMatchLanguage } from "@/components/home/MatchLanguage";
import type { BroadcastSummary } from "@/lib/api/types";
import { formatViewerCount } from "@/lib/utils/format";

import { PlayerControls } from "./PlayerControls";
import { PlayerMessage, PlayerShell, playerActionClass } from "./PlayerShell";
import { activeHeight, loadShaka, qualitiesOf, selectQuality, type Quality, type ShakaPlayer } from "./shaka";

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

/** Public (unprotected) streams — live matches. Protected VOD uses ProtectedVideoPlayer. */
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
  const playerRef = useRef<ShakaPlayer | null>(null);
  const [state, setState] = useState<PlayerState>(url ? "loading" : "unavailable");
  const [attempt, setAttempt] = useState(0);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [quality, setQuality] = useState<number | "auto">("auto");
  const [autoHeight, setAutoHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!url) {
      setState("unavailable");
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    setState("loading");
    setQualities([]);
    setQuality("auto");

    const markPlaying = () => {
      if (cancelled) return;
      setState("playing");
      video.play().catch(() => undefined);
    };
    const markError = () => {
      if (!cancelled) setState("error");
    };

    async function init() {
      try {
        const shaka = await loadShaka();
        if (cancelled || !video) return;
        if (shaka.Player.isBrowserSupported()) {
          const player = new shaka.Player();
          playerRef.current = player;
          player.addEventListener("error", markError);
          player.addEventListener("adaptation", () => setAutoHeight(activeHeight(player)));
          await player.attach(video);
          await player.load(url ?? "");
          if (cancelled) return;
          setQualities(qualitiesOf(player));
          setAutoHeight(activeHeight(player));
          markPlaying();
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = url ?? "";
          video.addEventListener("canplay", markPlaying, { once: true });
          video.addEventListener("error", markError, { once: true });
        } else {
          setState("unavailable");
        }
      } catch {
        markError();
      }
    }

    void init();
    return () => {
      cancelled = true;
      const player = playerRef.current;
      playerRef.current = null;
      player?.destroy().catch(() => undefined);
      video.removeEventListener("canplay", markPlaying);
      video.removeEventListener("error", markError);
    };
  }, [url, attempt]);

  // Jump to the newest part of a live stream.
  function goLive() {
    const video = videoRef.current;
    if (!video || video.seekable.length === 0) return;
    video.currentTime = video.seekable.end(video.seekable.length - 1);
    video.play().catch(() => undefined);
  }

  function changeQuality(next: number | "auto") {
    setQuality(next);
    if (playerRef.current) selectQuality(playerRef.current, next);
  }

  const playing = state === "playing";

  return (
    <PlayerShell
      containerRef={boxRef}
      videoRef={videoRef}
      title={title}
      poster={poster}
      colors={colors}
      showVideo={playing}
      className={className}
      top={
        <>
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
            <span className="rounded-[7px] bg-ink/60 px-2 py-1 text-caption font-medium text-paper">{badge}</span>
          ) : null}
        </>
      }
      overlay={
        state === "loading" ? (
          <p className="absolute inset-0 grid place-items-center text-body-sm text-paper/80">Loading stream…</p>
        ) : state === "unavailable" ? (
          <PlayerMessage
            title={live ? "The stream is not available here yet" : "No stream for this match yet"}
            body={live ? "Chat, moments and live stats below are still updating." : "Check back when the match starts."}
          />
        ) : state === "error" ? (
          <PlayerMessage
            dim
            title="This stream stopped loading"
            action={
              <button type="button" onClick={() => setAttempt((value) => value + 1)} className={playerActionClass}>
                Try again
              </button>
            }
          />
        ) : null
      }
      controls={
        <PlayerControls
          videoRef={videoRef}
          containerRef={boxRef}
          live={live}
          ready={playing}
          qualities={qualities}
          quality={quality}
          autoHeight={autoHeight}
          onQuality={changeQuality}
          onGoLive={goLive}
        />
      }
    />
  );
}
