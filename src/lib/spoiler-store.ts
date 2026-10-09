import { SPOILER_COOKIE } from "@/lib/spoiler";

export interface SpoilerState {
  /** The visitor chose to hide scores and results. */
  hidden: boolean;
  /** Matches revealed one by one while hiding is on. */
  revealed: readonly string[];
}

/**
 * One spoiler state per tab, shared by every SpoilerProvider (the root one
 * and page-level ones that know the cookie on the server), so toggling in
 * the header updates everything. Seeded from the <html data-hide-scores>
 * attribute the head script sets from the cookie before first paint.
 */
let state: SpoilerState | null = null;
const listeners = new Set<() => void>();

function current(): SpoilerState {
  state ??= {
    hidden: document.documentElement.dataset.hideScores === "1",
    revealed: [],
  };
  return state;
}

function emit(next: SpoilerState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const spoilerStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: current,
  setHidden(hidden: boolean) {
    document.cookie = `${SPOILER_COOKIE}=${hidden ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
    if (hidden) document.documentElement.dataset.hideScores = "1";
    else delete document.documentElement.dataset.hideScores;
    emit({ hidden, revealed: [] });
  },
  reveal(matchId: string) {
    const { hidden, revealed } = current();
    if (!revealed.includes(matchId)) emit({ hidden, revealed: [...revealed, matchId] });
  },
};

/**
 * Runs in <head> before the body paints: mirrors the cookie onto <html> so
 * CSS can hide scores on statically rendered pages before hydration.
 */
export const SPOILER_HEAD_SCRIPT = `try{if((";"+document.cookie).replace(/ /g,"").indexOf(";${SPOILER_COOKIE}=1")>-1)document.documentElement.dataset.hideScores="1"}catch(e){}`;
