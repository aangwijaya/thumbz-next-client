"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { createPlaybackSession, endPlaybackSession, heartbeatPlaybackSession } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import type { PlaybackSession } from "@/lib/api/types";
import { useSupabaseSession } from "@/lib/supabase/useSession";

export type SessionStatus =
  | { status: "checking" }
  | { status: "login" }
  | { status: "opening" }
  | { status: "ready"; session: PlaybackSession }
  /** The account is at its concurrent-stream limit. */
  | { status: "limit"; message: string }
  /** The server stopped counting this device (missed heartbeats or ended elsewhere). */
  | { status: "evicted" }
  | { status: "error" };

export interface PlaybackSessionHandle {
  state: SessionStatus;
  /** Always the latest playback token (rotated by every heartbeat). */
  tokenRef: RefObject<string | null>;
  restart: () => void;
}

/**
 * Owns one playback session for the mounted player (contract §17): opens it,
 * heartbeats it (rotating the token), and frees the device slot on unmount,
 * page hide or bfcache entry — and reopens it when the page comes back.
 */
export function usePlaybackSession(assetId: string): PlaybackSessionHandle {
  const { session: user, ready } = useSupabaseSession();
  const userId = user?.userId ?? null;
  // The access token refreshes hourly; that must not restart playback.
  const userTokenRef = useRef<string | null>(null);
  userTokenRef.current = user?.token ?? null;

  const tokenRef = useRef<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<SessionStatus>({ status: "checking" });

  useEffect(() => {
    if (!ready) return;
    if (!userId || !userTokenRef.current) {
      setState({ status: "login" });
      return;
    }

    let cancelled = false;
    let sessionId: string | null = null;
    // This run's token: a late-resolving earlier run must not clear a newer one.
    let ownToken: string | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    setState({ status: "opening" });

    const release = () => {
      clearInterval(timer);
      if (sessionId && userTokenRef.current) endPlaybackSession(sessionId, userTokenRef.current);
      sessionId = null;
      if (tokenRef.current === ownToken) tokenRef.current = null;
    };

    createPlaybackSession(assetId, userTokenRef.current)
      .then((session) => {
        sessionId = session.session_id;
        if (cancelled) {
          release();
          return;
        }
        ownToken = session.token;
        tokenRef.current = ownToken;
        setState({ status: "ready", session });
        timer = setInterval(() => {
          const userToken = userTokenRef.current;
          if (!sessionId || !userToken) return;
          heartbeatPlaybackSession(sessionId, userToken)
            .then((next) => {
              if (cancelled) return;
              ownToken = next.token;
              tokenRef.current = ownToken;
            })
            .catch((error: unknown) => {
              if (isApiError(error) && error.status === 404 && !cancelled) {
                clearInterval(timer);
                sessionId = null;
                setState({ status: "evicted" });
              }
              // Anything else is transient: the next beat retries well before
              // the server's three-missed-beats cutoff.
            });
        }, session.heartbeat_seconds * 1000);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (isApiError(error) && error.status === 409) {
          setState({ status: "limit", message: error.message });
        } else if (isApiError(error) && error.status === 401) {
          setState({ status: "login" });
        } else {
          setState({ status: "error" });
        }
      });

    // Leaving the page (incl. into the bfcache) frees the slot; coming back reopens.
    const onPageHide = () => release();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setAttempt((value) => value + 1);
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      release();
    };
  }, [assetId, userId, ready, attempt]);

  return { state, tokenRef, restart: () => setAttempt((value) => value + 1) };
}
