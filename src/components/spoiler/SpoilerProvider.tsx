"use client";

import { createContext, useContext, useState } from "react";

import { useToast } from "@/components/ui/Toast";
import { SPOILER_COOKIE } from "@/lib/spoiler";

interface SpoilerContextValue {
  /** True when the visitor chose to hide scores and results. */
  hidden: boolean;
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

interface SpoilerProviderProps {
  /** Read from the cookie on the server, so the first paint is already correct. */
  initialHidden: boolean;
  children: React.ReactNode;
}

export function SpoilerProvider({ initialHidden, children }: SpoilerProviderProps) {
  const toast = useToast();
  const [hidden, setHiddenState] = useState(initialHidden);
  const [revealed, setRevealed] = useState<string[]>([]);

  function setHidden(next: boolean) {
    setHiddenState(next);
    setRevealed([]);
    document.cookie = `${SPOILER_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
    toast(
      next
        ? "Scores and results are hidden. Use Show score on any match to reveal just that one."
        : "Scores and results are visible again.",
    );
  }

  const value: SpoilerContextValue = {
    hidden,
    isVisible: (matchId) => !hidden || revealed.includes(matchId),
    reveal: (matchId) =>
      setRevealed((ids) => (ids.includes(matchId) ? ids : [...ids, matchId])),
    setHidden,
  };

  return <SpoilerContext.Provider value={value}>{children}</SpoilerContext.Provider>;
}
