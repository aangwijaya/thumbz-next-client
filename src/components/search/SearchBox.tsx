"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

import { rememberSearch } from "./recent-searches";

/**
 * The search input on /search. The URL is the state: typing updates `?q=`
 * (debounced, history-replacing, inside a transition so results stream in
 * without blocking input), which makes every result page shareable.
 */
export function SearchBox({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const debounced = useDebouncedValue(value.trim(), 300);
  const lastPushed = useRef(initialQuery);

  // Back/forward navigation changed ?q=: reflect it in the input.
  useEffect(() => {
    if (initialQuery !== lastPushed.current) {
      lastPushed.current = initialQuery;
      setValue(initialQuery);
    }
  }, [initialQuery]);

  function navigate(q: string, mode: "replace" | "push") {
    if (q === lastPushed.current) return;
    lastPushed.current = q;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("page");
    if (q) next.set("q", q);
    else next.delete("q");
    const query = next.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      if (mode === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    });
  }

  useEffect(() => {
    if (debounced.length === 0 || debounced.length >= 2) navigate(debounced, "replace");
    // navigate is stable enough for this purpose; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const q = value.trim();
        if (q) rememberSearch(q);
        navigate(q, "push");
      }}
      className="relative"
    >
      <label htmlFor="search-page-input" className="sr-only">
        Search teams, players, tournaments, matches and videos
      </label>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-pencil"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id="search-page-input"
        type="search"
        autoFocus={!initialQuery}
        autoComplete="off"
        enterKeyHint="search"
        maxLength={100}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search ONIC, Kairi, MPL ID…"
        className="h-14 w-full rounded-lg border border-stone bg-paper pl-12 pr-12 font-graphik text-body-lg text-ink shadow-subtle placeholder:text-graphite focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
      />
      <span
        role="status"
        aria-live="polite"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-caption text-pencil"
      >
        {pending ? (
          <span className="inline-block size-4 rounded-full border-2 border-stone border-t-deep-ember motion-safe:animate-spin">
            <span className="sr-only">Searching…</span>
          </span>
        ) : null}
      </span>
    </form>
  );
}
