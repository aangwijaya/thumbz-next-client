"use client";

import { startInstall, useInstall } from "@/components/pwa/install-store";

const buttonClass =
  "inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone bg-paper px-4 text-body-sm font-semibold text-ink transition-colors hover:border-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

/** "Install the app" in the footer: the native prompt on Chromium, the steps sheet on iPhone. */
export function InstallApp() {
  const { mode } = useInstall();
  if (mode === "hidden") return null;
  return (
    <button type="button" className={`${buttonClass} mt-5`} onClick={() => void startInstall()}>
      Install the app
    </button>
  );
}

/** The header's "Install" pill, on phones and small tablets only. */
export function InstallPill() {
  const { mode } = useInstall();
  if (mode === "hidden") return null;
  return (
    <button
      type="button"
      onClick={() => void startInstall()}
      className="mr-0.5 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-stone px-3 text-sm font-semibold text-ink transition-colors hover:border-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember min-[901px]:hidden"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[15px] fill-none stroke-deep-ember stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
        <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
      </svg>
      Install
    </button>
  );
}

/** "Install the app" as a row of the phone menu. */
export function InstallDrawerRow({ className }: { className: string }) {
  const { mode } = useInstall();
  if (mode === "hidden") return null;
  return (
    <button type="button" className={`${className} w-full text-left`} onClick={() => void startInstall()}>
      Install the app
      <span className="text-body-sm font-medium text-cobalt-link">{mode === "ios" ? "How to" : "Install"}</span>
    </button>
  );
}
