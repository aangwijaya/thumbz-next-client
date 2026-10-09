"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * The visitor's time zone. The server and the first client render use UTC,
 * so they match (no hydration mismatch); right after hydration this switches
 * to the visitor's own zone.
 */
export function useTimeZone(): string {
  return useSyncExternalStore(
    noSubscription,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => "UTC",
  );
}

/** YYYY-MM-DD of `date` in `timeZone` (sortable, groupable). */
export function dateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}
