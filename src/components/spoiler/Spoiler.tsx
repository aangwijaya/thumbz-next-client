"use client";

import { EyeIcon } from "@/components/spoiler/icons";
import { useSpoilers } from "@/components/spoiler/SpoilerProvider";

interface SpoilerProps {
  matchId: string;
  /** What to show while this match's score is hidden. */
  safe?: React.ReactNode;
  children: React.ReactNode;
}

// Shows its children, or `safe` while scores are hidden for this match.
// On pages without a cookie-aware provider it briefly renders both inside
// <span>s, so keep it out of table rows there (only phrasing content).
export function Spoiler({ matchId, safe = null, children }: SpoilerProps) {
  const { isVisible, known } = useSpoilers();
  if (!known) {
    // Static page before hydration: the preference is only on <html>, so
    // render both and let CSS show the right one (no flash either way).
    return (
      <>
        <span className="spoiler-shown">{children}</span>
        <span className="spoiler-safe">{safe}</span>
      </>
    );
  }
  return <>{isVisible(matchId) ? children : safe}</>;
}

// A blurred stand-in for a hidden value. Screen readers hear "Hidden".
export function HiddenValue({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span aria-hidden="true" className="select-none blur-[6px]">
        {children}
      </span>
      <span className="sr-only">Hidden</span>
    </>
  );
}

const sizeClasses = {
  sm: "px-2 py-[3px] text-caption",
  md: "px-3.5 py-2 text-body-sm",
};

interface RevealButtonProps {
  matchId: string;
  size?: keyof typeof sizeClasses;
  /** Positioning only. */
  className?: string;
  children: React.ReactNode;
}

// Only appears while this match's score is hidden; reveals just this match.
export function RevealButton({
  matchId,
  size = "sm",
  className = "",
  children,
}: RevealButtonProps) {
  const { isVisible, reveal } = useSpoilers();
  if (isVisible(matchId)) return null;

  return (
    <button
      type="button"
      onClick={() => reveal(matchId)}
      className={`relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-stone bg-paper font-semibold text-ink transition-colors hover:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember ${sizeClasses[size]} ${className}`}
    >
      <EyeIcon className="size-[13px]" />
      {children}
    </button>
  );
}
