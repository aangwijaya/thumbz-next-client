"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { listen, pingPresence, realtimeStatus, type Handler } from "./connection";

const PRESENCE_PING_MS = 30_000;

export function useRealtimeStatus() {
  return useSyncExternalStore(
    realtimeStatus.subscribe,
    realtimeStatus.getSnapshot,
    realtimeStatus.getServerSnapshot,
  );
}

/** True when pushes are flowing, so REST polling can stand down. */
export function useRealtimeConnected(): boolean {
  return useRealtimeStatus() === "connected";
}

/**
 * Listens to a room while mounted. Handlers may change between renders
 * without resubscribing. `resync` runs when messages may have been missed.
 */
export function useRealtimeRoom(
  room: string | null,
  handlers: Partial<Record<string, Handler>>,
  resync?: () => void,
) {
  const latest = useRef({ handlers, resync });
  latest.current = { handlers, resync };

  useEffect(() => {
    if (!room) return;
    const stop = listen(room, {
      handlers: new Proxy({} as Partial<Record<string, Handler>>, {
        get: (_target, event: string) => latest.current.handlers[event],
      }),
      resync: () => latest.current.resync?.(),
    });
    if (!room.startsWith("match:")) return stop;
    const ping = setInterval(() => {
      if (document.visibilityState === "visible") pingPresence();
    }, PRESENCE_PING_MS);
    return () => {
      clearInterval(ping);
      stop();
    };
  }, [room]);
}
