"use client";

import { useEffect, useState } from "react";

import { deletePushSubscription, fetchPushConfig, savePushSubscription, sendTestPush } from "@/lib/api/endpoints";
import { isIosSafari, isStandalone, vapidKeyBytes } from "@/lib/platform";
import { useSupabaseSession } from "@/lib/supabase/useSession";

type Status =
  | "checking"
  /** Browser, build or server cannot do push at all. */
  | "unavailable"
  /** iOS Safari tab: web push only works from the installed app. */
  | "install-first"
  | "blocked"
  | "off"
  | "on";

const buttonClass =
  "inline-flex min-h-11 items-center rounded-lg px-4 text-body-sm font-semibold transition-colors disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-ember";

async function workerRegistration(): Promise<ServiceWorkerRegistration | null> {
  // The worker is registered by production builds only (see ServiceWorkerRegister).
  if (process.env.NODE_ENV !== "production") return null;
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/**
 * Opt-in for match reminders (contract §18): a push ~15 minutes before
 * followed teams play. Each browser/device subscribes separately.
 */
export function MatchReminders() {
  const { session } = useSupabaseSession();
  const token = session?.token ?? null;
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        setStatus(isIosSafari() && !isStandalone() ? "install-first" : "unavailable");
        return;
      }
      const [config, registration] = await Promise.all([fetchPushConfig(), workerRegistration()]);
      if (cancelled) return;
      if (!config?.enabled || !registration) return setStatus("unavailable");
      if (Notification.permission === "denied") return setStatus("blocked");
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        // Re-save: another account may have used this browser since.
        await savePushSubscription(existing.toJSON(), token);
      }
      if (!cancelled) setStatus(existing ? "on" : "off");
    })().catch(() => {
      if (!cancelled) setStatus("unavailable");
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function enable() {
    if (!token) return;
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "off");
        return;
      }
      const [config, registration] = await Promise.all([fetchPushConfig(), workerRegistration()]);
      if (!config?.public_key || !registration) {
        setStatus("unavailable");
        return;
      }
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyBytes(config.public_key),
      });
      await savePushSubscription(subscription.toJSON(), token);
      setStatus("on");
    } catch {
      setMessage("Could not turn reminders on. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (!token) return;
    setBusy(true);
    setMessage(null);
    try {
      const registration = await workerRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await deletePushSubscription(subscription.endpoint, token);
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch {
      setMessage("Could not turn reminders off. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    if (!token) return;
    setBusy(true);
    try {
      await sendTestPush(token);
      setMessage("Test sent — it should arrive in a few seconds.");
    } catch {
      setMessage("Could not send a test notification.");
    } finally {
      setBusy(false);
    }
  }

  const copy: Record<Status, string> = {
    checking: "Checking this device…",
    unavailable: "Reminders are not available on this device or browser.",
    "install-first": "On iPhone and iPad, add THUMBZ to your Home Screen first (Share → Add to Home Screen), then turn reminders on from the app.",
    blocked: "Notifications are blocked for THUMBZ. Allow them in your browser's site settings, then come back.",
    off: "Get a notification 15 minutes before teams you follow play.",
    on: "On for this device. You'll hear from us 15 minutes before your teams play.",
  };

  return (
    <section aria-labelledby="reminders-title" className="flex flex-col gap-3 rounded-image border border-stone bg-paper p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="reminders-title" className="font-graphik text-body-lg font-bold text-ink">
          Match reminders
        </h2>
        {status === "off" ? (
          <button type="button" onClick={() => void enable()} disabled={busy} className={`${buttonClass} bg-ink text-paper hover:bg-ink/90`}>
            {busy ? "Turning on…" : "Turn on"}
          </button>
        ) : status === "on" ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => void test()} disabled={busy} className={`${buttonClass} border border-stone text-ink hover:bg-cream`}>
              Send a test
            </button>
            <button type="button" onClick={() => void disable()} disabled={busy} className={`${buttonClass} text-pencil hover:bg-cream hover:text-deep-ember`}>
              Turn off
            </button>
          </div>
        ) : null}
      </div>
      <p className="text-body-sm text-pencil" aria-live="polite">
        {copy[status]}
      </p>
      {message ? (
        <p role="status" className="text-body-sm text-ink">
          {message}
        </p>
      ) : null}
    </section>
  );
}
