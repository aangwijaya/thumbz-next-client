"use client";

import { useEffect, useState } from "react";

/** "mm:ss" until `iso`, ticking every second; "00:00" once passed. */
export function useCountdown(iso: string | null | undefined): { label: string; expired: boolean } {
  const target = iso ? new Date(iso).getTime() : NaN;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (Number.isNaN(target)) return;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [target]);
  if (Number.isNaN(target)) return { label: "", expired: false };
  const remaining = Math.max(0, Math.floor((target - now) / 1000));
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  return { label: `${minutes}:${seconds}`, expired: remaining === 0 };
}
