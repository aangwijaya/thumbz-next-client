"use client";

import { useEffect, useState, type RefObject } from "react";

import { LiveDot } from "@/components/ui/LiveDot";
import { formatDuration } from "@/lib/utils/format";

import type { Quality } from "./shaka";

/** WebKit-only video/element APIs (iOS has no element fullscreen). */
interface WebKitVideo extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
  webkitSupportsPresentationMode?: (mode: string) => boolean;
  webkitSetPresentationMode?: (mode: "inline" | "picture-in-picture" | "fullscreen") => void;
  webkitPresentationMode?: string;
}
interface WebKitElement extends HTMLElement {
  webkitRequestFullscreen?: () => void;
}
interface WebKitDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
}

interface PlayerControlsProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  live?: boolean;
  /** Controls stay disabled until media is ready. */
  ready: boolean;
  qualities?: Quality[];
  quality?: number | "auto";
  /** Height currently playing while on auto, for the "Auto (720p)" label. */
  autoHeight?: number | null;
  onQuality?: (quality: number | "auto") => void;
  onGoLive?: () => void;
  /** Small trailing label, e.g. the protection in use. */
  info?: string;
}

const iconClass = "size-[18px]";
const control =
  "grid size-[34px] place-items-center rounded-lg text-paper transition-colors hover:bg-paper/15 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-paper disabled:opacity-50";

function fullscreenElement(): Element | null {
  const doc = document as WebKitDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function canPictureInPicture(video: WebKitVideo | null): boolean {
  if (!video) return false;
  if (typeof document !== "undefined" && document.pictureInPictureEnabled) return true;
  return video.webkitSupportsPresentationMode?.("picture-in-picture") ?? false;
}

/**
 * Shared player chrome: play/pause, mute, seek (VOD), quality, PiP and
 * fullscreen, plus YouTube-style shortcuts on the focused player
 * (space/k, f, m, ←/→ 5 s, j/l 10 s).
 */
export function PlayerControls({
  videoRef,
  containerRef,
  live = false,
  ready,
  qualities = [],
  quality = "auto",
  autoHeight = null,
  onQuality,
  onGoLive,
  info,
}: PlayerControlsProps) {
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Mirror the media element's state; it stays the source of truth.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sync = () => {
      setPaused(video.paused);
      setMuted(video.muted);
      setTime(video.currentTime);
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      const ranges = video.buffered;
      setBuffered(ranges.length ? ranges.end(ranges.length - 1) : 0);
    };
    const events = ["play", "pause", "volumechange", "timeupdate", "durationchange", "progress", "loadedmetadata"];
    for (const name of events) video.addEventListener(name, sync);
    sync();
    setPipSupported(canPictureInPicture(video));
    return () => {
      for (const name of events) video.removeEventListener(name, sync);
    };
  }, [videoRef]);

  useEffect(() => {
    const onChange = () => setFullscreen(fullscreenElement() !== null);
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

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
  }

  function seekBy(seconds: number) {
    const video = videoRef.current;
    if (!video || live || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), video.duration);
  }

  function toggleFullscreen() {
    const box = containerRef.current as WebKitElement | null;
    const video = videoRef.current as WebKitVideo | null;
    const doc = document as WebKitDocument;
    if (fullscreenElement()) {
      if (doc.exitFullscreen) doc.exitFullscreen().catch(() => undefined);
      else doc.webkitExitFullscreen?.();
      return;
    }
    if (box?.requestFullscreen && document.fullscreenEnabled) {
      box.requestFullscreen().catch(() => undefined);
    } else if (box?.webkitRequestFullscreen) {
      box.webkitRequestFullscreen();
    } else {
      // iPhone: only the video element itself can go fullscreen.
      video?.webkitEnterFullscreen?.();
    }
  }

  async function togglePictureInPicture() {
    const video = videoRef.current as WebKitVideo | null;
    if (!video) return;
    try {
      if (document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else await video.requestPictureInPicture();
      } else if (video.webkitSetPresentationMode) {
        video.webkitSetPresentationMode(
          video.webkitPresentationMode === "picture-in-picture" ? "inline" : "picture-in-picture",
        );
      }
    } catch {
      // PiP can be refused (e.g. no user gesture); nothing to recover.
    }
  }

  // Shortcuts apply while focus is inside the player, never page-wide.
  useEffect(() => {
    const box = containerRef.current;
    if (!box || !ready) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      const onButton = target.closest("button, [role=menuitemradio], input, select");
      const key = event.key.toLowerCase();
      if ((key === " " || key === "enter") && onButton) return; // let the control act
      if (target.matches("input[type=range]") && (key === "arrowleft" || key === "arrowright")) return;
      const actions: Record<string, () => void> = {
        " ": togglePlay,
        k: togglePlay,
        f: toggleFullscreen,
        m: toggleMute,
        arrowleft: () => seekBy(-5),
        arrowright: () => seekBy(5),
        j: () => seekBy(-10),
        l: () => seekBy(10),
      };
      const action = actions[key];
      if (!action) return;
      event.preventDefault();
      action();
    };
    box.addEventListener("keydown", onKey);
    return () => box.removeEventListener("keydown", onKey);
  });

  const qualityLabel =
    quality === "auto" ? (autoHeight ? `Auto (${autoHeight}p)` : "Auto") : `${quality}p`;
  const showSeek = !live && duration > 0;

  return (
    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/85 to-transparent px-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-7 min-[641px]:px-4 min-[641px]:pb-3 min-[641px]:pt-9">
      {live ? <div className="mb-2 h-1 rounded-full bg-ember-red min-[641px]:mb-3" /> : null}
      {showSeek ? (
        <div className="relative mb-1.5 flex h-5 items-center">
          <div className="pointer-events-none absolute inset-x-0 h-1 overflow-hidden rounded-full bg-paper/20" aria-hidden="true">
            <span className="absolute inset-y-0 left-0 bg-paper/35" style={{ width: `${(buffered / duration) * 100}%` }} />
            <span className="absolute inset-y-0 left-0 bg-ember-red" style={{ width: `${(time / duration) * 100}%` }} />
          </div>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={time}
            disabled={!ready}
            onChange={(event) => {
              const video = videoRef.current;
              if (video) video.currentTime = Number(event.target.value);
            }}
            aria-label="Seek"
            aria-valuetext={`${formatDuration(time)} of ${formatDuration(duration)}`}
            className="player-seek relative h-5 w-full cursor-pointer appearance-none bg-transparent"
          />
        </div>
      ) : null}
      <div className="flex items-center gap-1.5">
        <button type="button" className={control} onClick={togglePlay} disabled={!ready} aria-label={paused ? "Play" : "Pause"}>
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
          disabled={!ready}
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
            onClick={onGoLive}
            disabled={!ready}
            className="ml-1 inline-flex min-h-[34px] items-center gap-1.5 rounded-lg px-1.5 text-caption font-bold tracking-[0.06em] text-paper transition-colors hover:bg-paper/15 focus-visible:outline-2 focus-visible:outline-paper"
          >
            <LiveDot />
            LIVE
          </button>
        ) : showSeek ? (
          <span className="ml-1 text-caption tabular-nums text-paper/85">
            {formatDuration(time)} / {formatDuration(duration)}
          </span>
        ) : null}
        <span className="flex-1" />
        {info ? <span className="hidden text-[11px] font-medium text-paper/60 min-[481px]:inline">{info}</span> : null}
        {qualities.length > 1 && onQuality ? (
          <div className="relative">
            <button
              type="button"
              className="inline-flex min-h-[34px] items-center rounded-lg px-2 text-caption font-semibold text-paper transition-colors hover:bg-paper/15 focus-visible:outline-2 focus-visible:outline-paper disabled:opacity-50"
              onClick={() => setMenuOpen((open) => !open)}
              disabled={!ready}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Quality: ${qualityLabel}`}
            >
              {qualityLabel}
            </button>
            {menuOpen ? (
              <div
                role="menu"
                aria-label="Quality"
                className="absolute bottom-full right-0 mb-2 min-w-32 rounded-lg bg-ink/95 p-1 shadow-subtle"
                onKeyDown={(event) => {
                  if (event.key === "Escape") setMenuOpen(false);
                }}
              >
                {(["auto", ...qualities.map((item) => item.height)] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={quality === value}
                    onClick={() => {
                      onQuality(value);
                      setMenuOpen(false);
                    }}
                    className={`flex min-h-9 w-full items-center rounded-md px-3 text-left text-caption font-medium transition-colors hover:bg-paper/15 focus-visible:outline-2 focus-visible:outline-paper ${
                      quality === value ? "text-paper" : "text-paper/70"
                    }`}
                  >
                    {value === "auto" ? "Auto" : `${value}p`}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        {pipSupported ? (
          <button type="button" className={control} onClick={() => void togglePictureInPicture()} disabled={!ready} aria-label="Picture in picture">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" className={iconClass} aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <rect x="12" y="11" width="7" height="6" rx="1" fill="currentColor" />
            </svg>
          </button>
        ) : null}
        <button type="button" className={control} onClick={toggleFullscreen} aria-label={fullscreen ? "Exit full screen" : "Full screen"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className={iconClass} aria-hidden="true">
            {fullscreen ? (
              <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
            ) : (
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
