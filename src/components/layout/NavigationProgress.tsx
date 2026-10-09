"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Navigations faster than this (prefetched routes) never show the bar. */
const SHOW_DELAY_MS = 150;
const START_EVENT = "thumbz:navigation-start";

/** Lets programmatic navigations (router.push in forms) show the bar too. */
export function startNavigationProgress() {
  window.dispatchEvent(new Event(START_EVENT));
}

function isInternalNavigation(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const anchor = (event.target as Element | null)?.closest?.("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // Same page (or only the hash changes): no route load happens.
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

/**
 * A thin top progress bar for route transitions: starts on internal link
 * clicks, trickles toward 90 %, completes when the URL changes. No library.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<number | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigating = useRef(false);

  useEffect(() => {
    function start() {
      if (navigating.current) return;
      navigating.current = true;
      showTimer.current = setTimeout(() => {
        setProgress(12);
        trickle.current = setInterval(() => {
          // Ease toward 90 %: big steps first, ever smaller after.
          setProgress((value) => (value === null ? null : value + (90 - value) * 0.12));
        }, 250);
      }, SHOW_DELAY_MS);
    }
    function onClick(event: MouseEvent) {
      if (isInternalNavigation(event)) start();
    }
    document.addEventListener("click", onClick, true);
    window.addEventListener(START_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(START_EVENT, start);
    };
  }, []);

  // The URL changed: the navigation committed.
  useEffect(() => {
    if (!navigating.current) return;
    navigating.current = false;
    if (showTimer.current) clearTimeout(showTimer.current);
    if (trickle.current) clearInterval(trickle.current);
    setProgress((value) => (value === null ? null : 100));
    const hide = setTimeout(() => setProgress(null), 300);
    return () => clearTimeout(hide);
  }, [pathname, searchParams]);

  if (progress === null) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        className={`h-full origin-left bg-deep-ember shadow-[0_0_8px_var(--color-ember-red)] motion-safe:transition-[transform,opacity] motion-safe:duration-300 ${
          progress >= 100 ? "opacity-0" : "opacity-100"
        }`}
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
