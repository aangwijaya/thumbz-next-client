"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { closeInstallSteps, startInstall, useInstall } from "@/components/pwa/install-store";

const DISMISS_KEY = "thumbz-install-dismissed";
const DISMISS_DAYS = 14;

function dismissedRecently(): boolean {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

/**
 * Phones: a "Get the THUMBZ app" card at the bottom edge (dismissed for two
 * weeks on "Not now") and, on iPhone, the Add to Home Screen steps.
 */
export function InstallPrompt() {
  const { mode, stepsOpen } = useInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(dismissedRecently());
  }, []);

  useEffect(() => {
    if (!stepsOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeInstallSteps();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepsOpen]);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private mode: the card simply comes back next visit.
    }
  }

  if (mode === "hidden") return null;

  if (stepsOpen) {
    return (
      <section
        role="dialog"
        aria-labelledby="install-steps-title"
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-[18px] border-t border-stone bg-paper px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-5 shadow-[0_-12px_40px_rgba(37,34,30,0.18)] motion-safe:animate-rise"
      >
        <h2 id="install-steps-title" className="font-graphik text-[19px] font-bold text-ink">
          Add THUMBZ to your Home Screen
        </h2>
        <ol className="mt-3.5 flex flex-col gap-3 text-[15px] text-ink">
          {[
            "Tap Share in the browser bar",
            "Choose Add to Home Screen",
            "Open THUMBZ from your Home Screen",
          ].map((step, index) => (
            <li key={step} className="flex items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cream text-[13px] font-bold">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-body-sm text-pencil">Match reminders work once it&apos;s installed.</p>
        <button
          type="button"
          autoFocus
          onClick={() => {
            closeInstallSteps();
            dismiss();
          }}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-stone bg-paper text-base font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
        >
          Got it
        </button>
      </section>
    );
  }

  if (dismissed) return null;

  return (
    <aside
      aria-label="Install the app"
      className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-40 grid grid-cols-[44px_minmax(0,1fr)_auto_36px] items-center gap-3 rounded-[14px] border border-stone bg-paper py-2.5 pl-2.5 pr-1.5 shadow-[0_14px_19px_-9px_rgba(37,34,30,0.07),0_10px_48px_rgba(37,34,30,0.18)] motion-safe:animate-rise min-[901px]:hidden"
    >
      <Image src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-[11px]" />
      <div className="min-w-0">
        <b className="block font-graphik text-[15px] font-bold leading-tight text-ink">Get the THUMBZ app</b>
        <span className="block text-caption leading-snug text-pencil">Reminders before your teams play, full-screen player.</span>
      </div>
      <button
        type="button"
        onClick={() => void startInstall()}
        className="inline-flex min-h-10 items-center rounded-lg bg-deep-ember px-3.5 text-sm font-semibold text-paper hover:bg-[#b42d1b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
      >
        {mode === "ios" ? "How to" : "Install"}
      </button>
      <button
        type="button"
        aria-label="Not now"
        onClick={dismiss}
        className="grid h-10 w-9 place-items-center rounded-lg text-pencil hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-3.5 fill-none stroke-current stroke-2 [stroke-linecap:round]">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </aside>
  );
}
