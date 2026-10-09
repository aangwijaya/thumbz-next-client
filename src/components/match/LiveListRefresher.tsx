"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

import { useRealtimeRoom } from "@/lib/realtime/hooks";

const MIN_INTERVAL_MS = 10_000;

/** Re-renders a live list when a match goes live, ends or changes (throttled). */
export function LiveListRefresher() {
  const router = useRouter();
  const last = useRef(0);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  function refresh() {
    const wait = last.current + MIN_INTERVAL_MS - Date.now();
    if (wait <= 0) {
      last.current = Date.now();
      router.refresh();
    } else {
      pending.current ??= setTimeout(() => {
        pending.current = null;
        last.current = Date.now();
        router.refresh();
      }, wait);
    }
  }

  useRealtimeRoom("live", { "live:changed": refresh }, refresh);
  return null;
}
