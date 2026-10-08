"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

import { useToast } from "@/components/ui/Toast";
import { spoilerStore, type SpoilerState } from "@/lib/spoiler-store";

interface SpoilerContextValue {
  /** True when the visitor chose to hide scores and results. */
  hidden: boolean;
  /**
   * False only while server-rendering/hydrating without the cookie (static
   * pages): consumers then render both states and let CSS pick (see Spoiler).
   */
  known: boolean;
  /** Whether this match's score may be shown: hiding is off, or it was revealed. */
  isVisible: (matchId: string) => boolean;
  reveal: (matchId: string) => void;
  setHidden: (hidden: boolean) => void;
}

const SpoilerContext = createContext<SpoilerContextValue | null>(null);

export function useSpoilers(): SpoilerContextValue {
  const value = useContext(SpoilerContext);
  if (!value) throw new Error("useSpoilers must be used inside SpoilerProvider");
  return value;
}

const noSubscription = () => () => {};

interface SpoilerProviderProps {
  /**
   * The cookie value when the page read it on the server (dynamic pages),
   * so their first paint is exact. Omitted on static pages.
   */
  initialHidden?: boolean;
  children: React.ReactNode;
}

export function SpoilerProvider({ initialHidden, children }: SpoilerProviderProps) {
  const toast = useToast();
  const serverState = useMemo<SpoilerState>(
    () => ({ hidden: initialHidden ?? false, revealed: [] }),
    [initialHidden],
  );
  const state = useSyncExternalStore(
    spoilerStore.subscribe,
    spoilerStore.getSnapshot,
    () => serverState,
  );
  const hydrated = useSyncExternalStore(noSubscription, () => true, () => false);

  const value: SpoilerContextValue = {
    hidden: state.hidden,
    known: hydrated || initialHidden !== undefined,
    isVisible: (matchId) => !state.hidden || state.revealed.includes(matchId),
    reveal: spoilerStore.reveal,
    setHidden: (next) => {
      spoilerStore.setHidden(next);
      toast(
        next
          ? "Scores and results are hidden. Use Show score on any match to reveal just that one."
          : "Scores and results are visible again.",
      );
    },
  };

  return <SpoilerContext.Provider value={value}>{children}</SpoilerContext.Provider>;
}
