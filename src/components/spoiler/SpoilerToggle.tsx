"use client";

import { EyeIcon, EyeOffIcon } from "@/components/spoiler/icons";
import { useSpoilers } from "@/components/spoiler/SpoilerProvider";

interface SpoilerToggleProps {
  /** icon: header button, button: outlined text button, switch: labelled switch. */
  variant: "icon" | "button" | "switch";
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

// One preference for the whole site: hide scores and results.
export function SpoilerToggle({ variant }: SpoilerToggleProps) {
  const { hidden, setHidden } = useSpoilers();
  const toggle = () => setHidden(!hidden);

  if (variant === "switch") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={hidden}
        onClick={toggle}
        className={`inline-flex items-center gap-2.5 rounded-lg text-body-sm font-medium text-charcoal ${focusRing}`}
      >
        <span
          aria-hidden="true"
          className={`relative h-5 w-9 rounded-full transition-colors ${hidden ? "bg-ink" : "bg-stone"}`}
        >
          <span
            className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-paper shadow-[0_1px_2px_rgb(37_34_30/0.2)] transition-transform ${
              hidden ? "translate-x-4" : ""
            }`}
          />
        </span>
        Hide scores
      </button>
    );
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        aria-pressed={hidden}
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-stone bg-paper px-3 py-[7px] text-body-sm font-semibold text-ink transition-colors hover:border-charcoal aria-pressed:border-transparent aria-pressed:bg-mint-wash aria-pressed:text-forest ${focusRing}`}
      >
        Hide scores
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={hidden}
      aria-label="Hide scores and results"
      title="Hide scores and results"
      onClick={toggle}
      className={`grid size-11 place-items-center min-[641px]:size-10 rounded-lg text-pencil transition-colors hover:bg-cream hover:text-ink aria-pressed:bg-cream aria-pressed:text-ink ${focusRing}`}
    >
      {hidden ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  );
}
