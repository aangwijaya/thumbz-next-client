"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

const TABS = ["chat", "moments", "stats", "more"] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | null): value is Tab {
  return (TABS as readonly string[]).includes(value ?? "");
}

interface WatchLayoutProps {
  stage: React.ReactNode;
  chat: React.ReactNode;
  moments: React.ReactNode;
  stats: React.ReactNode;
  more: React.ReactNode;
}

const tabClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border-b-2 border-transparent px-3.5 font-graphik text-[15px] font-bold text-pencil transition-colors hover:text-ink aria-selected:border-ink aria-selected:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-deep-ember";

// Desktop: the player with chat and moments beside it, stats and more below.
// Phones: the player, then tabs that switch between all four.
export function WatchLayout({ stage, chat, moments, stats, more }: WatchLayoutProps) {
  const searchParams = useSearchParams();
  const initial = searchParams.get("tab");
  const [tab, setTabState] = useState<Tab>(isTab(initial) ? initial : "chat");

  // Deep-linkable (?tab=stats) without a server round trip: the native
  // History API updates the URL and Next keeps useSearchParams in sync.
  function setTab(next: Tab) {
    setTabState(next);
    const params = new URLSearchParams(window.location.search);
    if (next === "chat") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }
  // WAI-ARIA tabs: one tab stop per list; arrows/Home/End move and select.
  function onTabKeys(event: React.KeyboardEvent<HTMLButtonElement>, ids: Tab[], active: Tab) {
    const index = ids.indexOf(active);
    const next =
      event.key === "ArrowRight"
        ? ids[(index + 1) % ids.length]
        : event.key === "ArrowLeft"
          ? ids[(index - 1 + ids.length) % ids.length]
          : event.key === "Home"
            ? ids[0]
            : event.key === "End"
              ? ids[ids.length - 1]
              : null;
    if (!next) return;
    event.preventDefault();
    setTab(next);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]");
    buttons?.[ids.indexOf(next)]?.focus();
  }

  // The side panel only has Chat and Moments; Stats and More are on the page.
  const side = tab === "moments" ? "moments" : "chat";
  const onPhoneOnly = (shown: boolean) => (shown ? "" : "max-[900px]:hidden");

  const tabs: Array<{ id: Tab; label: string; panel: string }> = [
    { id: "chat", label: "Chat", panel: "watch-chat" },
    { id: "moments", label: "Moments", panel: "watch-moments" },
    { id: "stats", label: "Stats", panel: "watch-stats" },
    { id: "more", label: "More", panel: "watch-more" },
  ];

  return (
    <>
      <div className="mx-auto grid w-full max-w-[1376px] min-[901px]:grid-cols-[minmax(0,1fr)_320px] min-[901px]:gap-4 min-[901px]:px-6 lg:px-8 min-[1181px]:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label="Stream" className="min-w-0">
          {stage}
        </section>

        <div
          role="tablist"
          aria-label="Match"
          className="sticky top-(--header-h) z-30 mt-3.5 flex border-b border-stone/50 bg-paper px-2.5 min-[901px]:hidden"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls={item.panel}
              tabIndex={tab === item.id ? 0 : -1}
              onClick={() => setTab(item.id)}
              onKeyDown={(event) => onTabKeys(event, TABS.slice(), tab)}
              className={`${tabClass} flex-1 px-1.5 text-sm`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <aside
          aria-label="Chat and moments"
          className={`flex min-h-0 flex-col overflow-hidden min-[901px]:rounded-xl min-[901px]:border min-[901px]:border-stone min-[901px]:bg-paper min-[901px]:shadow-subtle ${onPhoneOnly(
            tab === "chat" || tab === "moments",
          )}`}
        >
          <div
            role="tablist"
            aria-label="Side panel"
            className="flex shrink-0 gap-1 border-b border-stone/50 px-1.5 pt-1.5 max-[900px]:hidden"
          >
            {tabs.slice(0, 2).map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={side === item.id}
                aria-controls={item.panel}
                tabIndex={side === item.id ? 0 : -1}
                onClick={() => setTab(item.id)}
                onKeyDown={(event) => onTabKeys(event, ["chat", "moments"], side)}
                className={tabClass}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div
            id="watch-chat"
            role="tabpanel"
            aria-label="Live chat"
            hidden={side !== "chat"}
            className="flex min-h-0 flex-1 flex-col"
          >
            {chat}
          </div>
          <div
            id="watch-moments"
            role="tabpanel"
            aria-label="Moments"
            hidden={side !== "moments"}
            className="flex min-h-0 flex-1 flex-col"
          >
            {moments}
          </div>
        </aside>
      </div>

      <div id="watch-stats" className={onPhoneOnly(tab === "stats")}>
        {stats}
      </div>
      <div id="watch-more" className={onPhoneOnly(tab === "more")}>
        {more}
      </div>
    </>
  );
}
