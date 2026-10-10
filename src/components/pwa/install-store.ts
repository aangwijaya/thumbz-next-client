"use client";

import { useSyncExternalStore } from "react";

import { isIos, isStandalone } from "@/lib/platform";

/** Chromium's install prompt event (not in the DOM typings). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** "prompt": Chromium can install now · "ios": Share → Add to Home Screen · "hidden": installed or not installable. */
export type InstallMode = "prompt" | "ios" | "hidden";

interface InstallState {
  mode: InstallMode;
  /** The iPhone steps sheet is open. */
  stepsOpen: boolean;
}

const HIDDEN: InstallState = { mode: "hidden", stepsOpen: false };
let state: InstallState = HIDDEN;
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function set(next: Partial<InstallState>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

// Listen at load: Chromium fires beforeinstallprompt once, often before the
// buttons that use it have mounted. Several buttons share this one event.
if (typeof window !== "undefined") {
  if (!isStandalone() && isIos()) state = { ...state, mode: "ios" };
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); // keep it for our buttons instead of the mini-infobar
    deferred = event as BeforeInstallPromptEvent;
    set({ mode: "prompt" });
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    set({ mode: "hidden", stepsOpen: false });
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstall(): InstallState {
  return useSyncExternalStore(subscribe, () => state, () => HIDDEN);
}

/** The native prompt on Chromium, the steps sheet on iPhone. */
export async function startInstall() {
  if (state.mode === "ios") {
    set({ stepsOpen: true });
    return;
  }
  if (!deferred) return;
  const event = deferred;
  // A prompt event can be used once, whatever the answer.
  deferred = null;
  set({ mode: "hidden" });
  await event.prompt();
}

export function closeInstallSteps() {
  set({ stepsOpen: false });
}
