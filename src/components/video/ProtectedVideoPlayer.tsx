"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { protectionLabel, selectSource, type PlaybackSource } from "@/lib/player/source";

import { PlayerControls } from "./PlayerControls";
import { PlayerMessage, PlayerShell, playerActionClass } from "./PlayerShell";
import {
  activeHeight,
  loadShaka,
  probeCapabilities,
  qualitiesOf,
  selectQuality,
  type Quality,
  type ShakaPlayer,
} from "./shaka";
import { usePlaybackSession } from "./usePlaybackSession";

type MediaState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "playing" }
  | { status: "unsupported" }
  | { status: "error"; code?: number };

interface ProtectedVideoPlayerProps {
  assetId: string;
  title: string;
  poster?: string | null;
  colors?: Array<string | undefined>;
  className?: string;
}

/** shaka.util.Error codes worth explaining to a viewer. */
const LICENSE_REQUEST_FAILED = 6007;

/**
 * DRM replay player. Picks the strongest path this browser supports —
 * DASH + Widevine/PlayReady (when configured) → DASH + ClearKey → native HLS
 * AES-128 on Safari/iOS → HLS AES-128 through MSE — and sends the rotating
 * playback token with every license request.
 */
export function ProtectedVideoPlayer({ assetId, title, poster, colors, className = "" }: ProtectedVideoPlayerProps) {
  const pathname = usePathname();
  const { state: session, tokenRef, restart } = usePlaybackSession(assetId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ShakaPlayer | null>(null);
  const [media, setMedia] = useState<MediaState>({ status: "idle" });
  const [source, setSource] = useState<PlaybackSource | null>(null);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [quality, setQuality] = useState<number | "auto">("auto");
  const [autoHeight, setAutoHeight] = useState<number | null>(null);

  const ready = session.status === "ready" ? session.session : null;

  useEffect(() => {
    const video = videoRef.current;
    if (!ready || !video) return;
    let cancelled = false;
    setMedia({ status: "loading" });
    setQualities([]);
    setQuality("auto");

    const start = () => {
      if (cancelled) return;
      setMedia({ status: "playing" });
      // Try with sound (the click that opened the page counts as a gesture);
      // fall back to muted autoplay where the browser insists.
      video.muted = false;
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => undefined);
      });
    };
    const fail = (code?: number) => {
      if (!cancelled) setMedia({ status: "error", code });
    };
    const onNativeError = () => fail(video.error?.code);

    async function init() {
      if (!ready || !video) return;
      try {
        const caps = await probeCapabilities(Object.keys(ready.sources.dash?.key_systems ?? {}));
        const picked = selectSource(ready, caps);
        if (cancelled) return;
        setSource(picked);
        if (!picked) {
          setMedia({ status: "unsupported" });
          return;
        }

        if (picked.kind === "native-hls") {
          video.addEventListener("loadedmetadata", start, { once: true });
          video.addEventListener("error", onNativeError, { once: true });
          video.src = picked.manifestUrl;
          return;
        }

        const shaka = await loadShaka();
        if (cancelled) return;
        const player = new shaka.Player();
        playerRef.current = player;
        player.addEventListener("error", (event) => {
          fail((event as Event & { detail?: { code?: number } }).detail?.code);
        });
        player.addEventListener("adaptation", () => setAutoHeight(activeHeight(player)));

        if (picked.kind === "dash") {
          const { keySystem, license } = picked;
          player.configure({
            drm: {
              servers: { [keySystem]: license.license_url },
              ...(license.certificate_url
                ? { advanced: { [keySystem]: { serverCertificateUri: license.certificate_url } } }
                : {}),
            },
          });
          player.getNetworkingEngine()?.registerRequestFilter((type, request) => {
            if (type !== shaka.net.NetworkingEngine.RequestType.LICENSE) return;
            const token = tokenRef.current ?? "";
            if (keySystem === "org.w3.clearkey") {
              request.headers["Authorization"] = `Bearer ${token}`;
              request.headers["Content-Type"] = "application/json";
            } else {
              // Commercial license proxies get the token in their own header.
              for (const name of Object.keys(license.headers ?? {})) request.headers[name] = token;
            }
          });
        }

        await player.attach(video);
        await player.load(picked.manifestUrl);
        if (cancelled) return;
        setQualities(qualitiesOf(player));
        setAutoHeight(activeHeight(player));
        start();
      } catch (error) {
        fail((error as { code?: number } | null)?.code);
      }
    }

    void init();
    return () => {
      cancelled = true;
      video.removeEventListener("loadedmetadata", start);
      video.removeEventListener("error", onNativeError);
      const player = playerRef.current;
      playerRef.current = null;
      if (player) {
        player.destroy().catch(() => undefined);
      } else {
        video.removeAttribute("src");
        video.load();
      }
    };
  }, [ready, tokenRef]);

  // A device the server no longer counts must stop, or the limit means nothing.
  useEffect(() => {
    if (session.status === "evicted") videoRef.current?.pause();
  }, [session.status]);

  function changeQuality(next: number | "auto") {
    setQuality(next);
    if (playerRef.current) selectQuality(playerRef.current, next);
  }

  const playing = media.status === "playing" && session.status === "ready";
  const loginHref = `/login?next=${encodeURIComponent(pathname)}`;

  let overlay: React.ReactNode = null;
  if (session.status === "login") {
    overlay = (
      <PlayerMessage
        title="Sign in to watch this replay"
        body="Full replays are protected and play for signed-in viewers."
        action={
          <Link href={loginHref} className={playerActionClass}>
            Log in
          </Link>
        }
      />
    );
  } else if (session.status === "limit") {
    overlay = (
      <PlayerMessage
        dim
        title="Device limit reached"
        body={`${session.message}. Stop playback on another device, then try again.`}
        action={
          <button type="button" onClick={restart} className={playerActionClass}>
            Try again
          </button>
        }
      />
    );
  } else if (session.status === "evicted") {
    overlay = (
      <PlayerMessage
        dim
        title="Playback paused on this device"
        body="This device stopped checking in, so its slot was released."
        action={
          <button type="button" onClick={restart} className={playerActionClass}>
            Resume
          </button>
        }
      />
    );
  } else if (session.status === "error" || media.status === "error") {
    const licenseDenied = media.status === "error" && media.code === LICENSE_REQUEST_FAILED;
    overlay = (
      <PlayerMessage
        dim
        title={licenseDenied ? "This replay could not be unlocked" : "This replay stopped loading"}
        body={media.status === "error" && media.code ? `Error ${media.code}` : undefined}
        action={
          <button type="button" onClick={restart} className={playerActionClass}>
            Try again
          </button>
        }
      />
    );
  } else if (media.status === "unsupported") {
    overlay = (
      <PlayerMessage
        title="This browser cannot play protected video"
        body="Try a current version of Chrome, Edge, Firefox or Safari."
      />
    );
  } else if (!playing) {
    overlay = (
      <p className="absolute inset-0 grid place-items-center text-body-sm text-paper/80" role="status">
        {session.status === "opening" ? "Starting a secure session…" : "Loading replay…"}
      </p>
    );
  }

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
        <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-ink/60 px-2 py-1 text-caption font-medium text-paper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 1 1 8 0v3" />
          </svg>
          Protected
        </span>
      }
      overlay={overlay}
      controls={
        <PlayerControls
          videoRef={videoRef}
          containerRef={boxRef}
          ready={playing}
          qualities={qualities}
          quality={quality}
          autoHeight={autoHeight}
          onQuality={changeQuality}
          info={source ? protectionLabel(source) : undefined}
        />
      }
    />
  );
}
