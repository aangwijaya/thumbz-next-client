"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { fetchSuggestions, queryKeys } from "@/lib/api/endpoints";
import type { SearchSuggestion } from "@/lib/api/types";
import { startNavigationProgress } from "@/components/layout/NavigationProgress";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { initialsOf } from "@/lib/utils/format";

import { Highlight } from "./Highlight";
import { clearRecentSearches, recentSearches, rememberSearch } from "./recent-searches";

interface Option {
  id: string;
  href: string;
  label: string;
  sublabel?: string | null;
  kind: "suggestion" | "search" | "recent";
  suggestion?: SearchSuggestion;
}

const TYPE_PATHS: Record<SearchSuggestion["type"], string> = {
  team: "/teams",
  player: "/players",
  tournament: "/tournaments",
};
const TYPE_LABELS: Record<SearchSuggestion["type"], string> = {
  team: "Team",
  player: "Player",
  tournament: "Tournament",
};

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return (
    !!element &&
    (element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName))
  );
}

/**
 * Header search as a command palette (⌘K / Ctrl+K / "/"): typeahead from
 * /search/suggest, recent searches, full keyboard support and the ARIA
 * combobox pattern. A native <dialog> provides the focus trap, Escape and
 * inert background. Without JavaScript the trigger is a plain link.
 */
export function SearchCommand({ triggerClassName }: { triggerClassName: string }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState<string[]>([]);
  const q = useDebouncedValue(value.trim(), 150);

  const suggestions = useQuery({
    queryKey: queryKeys.suggest(q),
    queryFn: ({ signal }) => fetchSuggestions(q, signal),
    enabled: open && q.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const show = useCallback(() => {
    setRecents(recentSearches());
    setValue("");
    setActive(0);
    setOpen(true);
    dialogRef.current?.showModal();
    // After the dialog is shown so focus lands inside it.
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const hide = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const shortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const slash = event.key === "/" && !isTypingTarget(event.target);
      if ((shortcut || slash) && !dialogRef.current?.open) {
        event.preventDefault();
        show();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show]);

  const trimmed = value.trim();
  const options: Option[] = [];
  if (trimmed.length >= 2) {
    for (const item of suggestions.data ?? []) {
      options.push({
        id: `${item.type}-${item.id}`,
        href: `${TYPE_PATHS[item.type]}/${item.id}`,
        label: item.label,
        sublabel: [TYPE_LABELS[item.type], item.sublabel].filter(Boolean).join(" · "),
        kind: "suggestion",
        suggestion: item,
      });
    }
  }
  if (trimmed.length > 0) {
    options.push({
      id: "search-all",
      href: `/search?q=${encodeURIComponent(trimmed)}`,
      label: `Search for “${trimmed}”`,
      kind: "search",
    });
  } else {
    for (const recent of recents) {
      options.push({
        id: `recent-${recent}`,
        href: `/search?q=${encodeURIComponent(recent)}`,
        label: recent,
        kind: "recent",
      });
    }
  }
  const activeIndex = Math.min(active, Math.max(options.length - 1, 0));
  const activeOption = options[activeIndex];

  function go(option: Option | undefined) {
    if (!option) return;
    if (option.kind !== "suggestion") rememberSearch(option.kind === "search" ? trimmed : option.label);
    else rememberSearch(option.label);
    hide();
    startNavigationProgress();
    router.push(option.href);
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (options.length ? (index + 1) % options.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (options.length ? (index - 1 + options.length) % options.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(activeOption);
    }
  }

  return (
    <>
      <a
        href="/search"
        aria-label="Search (⌘K)"
        aria-haspopup="dialog"
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey) return; // new tab etc.
          event.preventDefault();
          show();
        }}
        className={triggerClassName}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-[18px]">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </a>

      <dialog
        ref={dialogRef}
        aria-label="Search"
        onClose={() => setOpen(false)}
        onClick={(event) => {
          // Clicks on the backdrop land on the dialog element itself.
          if (event.target === dialogRef.current) hide();
        }}
        className="m-0 mx-auto mt-[min(12vh,96px)] w-[min(640px,calc(100vw-24px))] max-w-none rounded-image border border-stone bg-paper p-0 text-ink shadow-button backdrop:bg-ink/30 backdrop:[-webkit-backdrop-filter:blur(2px)] backdrop:[backdrop-filter:blur(2px)] open:motion-safe:animate-rise"
      >
        <div className="flex items-center gap-3 border-b border-stone px-4">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5 shrink-0 text-pencil">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={options.length > 0}
            aria-controls={listId}
            aria-activedescendant={activeOption ? `${listId}-${activeOption.id}` : undefined}
            aria-autocomplete="list"
            aria-label="Search teams, players and tournaments"
            autoComplete="off"
            enterKeyHint="search"
            maxLength={100}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search teams, players, tournaments…"
            className="h-14 min-w-0 flex-1 bg-transparent font-graphik text-body-lg text-ink placeholder:text-graphite focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-stone px-1.5 py-0.5 text-caption text-pencil min-[641px]:inline">
            Esc
          </kbd>
        </div>

        {trimmed.length === 0 && recents.length > 0 ? (
          <div className="flex items-center justify-between px-4 pt-3 text-caption font-semibold text-pencil">
            <span>Recent searches</span>
            <button
              type="button"
              onClick={() => {
                clearRecentSearches();
                setRecents([]);
              }}
              className="rounded-md px-1.5 py-0.5 hover:bg-cream hover:text-ink focus-visible:outline-2 focus-visible:outline-deep-ember"
            >
              Clear
            </button>
          </div>
        ) : null}

        <ul id={listId} role="listbox" aria-label="Suggestions" className="max-h-[60vh] overflow-y-auto p-2">
          {options.map((option, index) => (
            <li
              key={option.id}
              id={`${listId}-${option.id}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseMove={() => setActive(index)}
              onClick={() => go(option)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 ${
                index === activeIndex ? "bg-cream" : ""
              }`}
            >
              {option.suggestion ? (
                option.suggestion.image_url ? (
                  <Image
                    src={option.suggestion.image_url}
                    alt=""
                    width={32}
                    height={32}
                    className={`size-8 shrink-0 object-contain ${option.suggestion.type === "player" ? "rounded-full" : "rounded-md"}`}
                  />
                ) : (
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md bg-cream text-caption font-bold text-deep-ember">
                    {initialsOf(option.label)}
                  </span>
                )
              ) : (
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center text-pencil">
                  {option.kind === "recent" ? "↺" : "↵"}
                </span>
              )}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-graphik text-body font-semibold">
                  {option.kind === "suggestion" ? <Highlight text={option.label} query={trimmed} /> : option.label}
                </span>
                {option.sublabel ? <span className="truncate text-body-sm text-pencil">{option.sublabel}</span> : null}
              </span>
            </li>
          ))}
          {trimmed.length === 0 && recents.length === 0 ? (
            <li role="presentation" className="px-3 py-6 text-center text-body-sm text-pencil">
              Type to search. Tip: press <kbd className="font-semibold">/</kbd> anywhere to open search.
            </li>
          ) : null}
        </ul>
        <p className="sr-only" aria-live="polite">
          {trimmed.length >= 2 && !suggestions.isFetching ? `${options.length - 1} suggestions` : ""}
        </p>
      </dialog>
    </>
  );
}
