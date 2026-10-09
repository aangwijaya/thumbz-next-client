"use client";

import { useEffect, useState } from "react";

/** Chromium's install prompt event (not in the DOM typings). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = { kind: "hidden" } | { kind: "prompt"; event: BeforeInstallPromptEvent } | { kind: "ios" };

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone/iPad Safari: no install prompt, only Share → Add to Home Screen. */
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

const buttonClass =
  "inline-flex min-h-11 items-center gap-2 rounded-lg border border-stone bg-paper px-4 text-body-sm font-semibold text-ink transition-colors hover:border-ink/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

/** "Install app": the native prompt on Chromium, instructions on iOS, nothing once installed. */
export function InstallApp() {
  const [mode, setMode] = useState<Mode>({ kind: "hidden" });
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (isIosSafari()) setMode({ kind: "ios" });
    const onPrompt = (event: Event) => {
      event.preventDefault(); // keep it for our button instead of the mini-infobar
      setMode({ kind: "prompt", event: event as BeforeInstallPromptEvent });
    };
    const onInstalled = () => setMode({ kind: "hidden" });
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode.kind === "hidden") return null;

  if (mode.kind === "prompt") {
    return (
      <button
        type="button"
        className={`${buttonClass} mt-5`}
        onClick={async () => {
          await mode.event.prompt();
          const choice = await mode.event.userChoice;
          // A prompt event can be used once; accepted installs also fire appinstalled.
          if (choice.outcome === "accepted") setMode({ kind: "hidden" });
        }}
      >
        Install the app
      </button>
    );
  }

  return (
    <div className="mt-5">
      <button type="button" className={buttonClass} aria-expanded={showSteps} onClick={() => setShowSteps((open) => !open)}>
        Install the app
      </button>
      {showSteps ? (
        <p className="mt-2 max-w-[34ch] text-body-sm text-pencil">
          Tap <span className="font-semibold text-ink">Share</span>, then{" "}
          <span className="font-semibold text-ink">Add to Home Screen</span>.
        </p>
      ) : null}
    </div>
  );
}
