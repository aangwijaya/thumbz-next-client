// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MatchReminders } from "./MatchReminders";

const api = vi.hoisted(() => ({
  fetchPushConfig: vi.fn(),
  savePushSubscription: vi.fn(),
  deletePushSubscription: vi.fn(),
  sendTestPush: vi.fn(),
}));
vi.mock("@/lib/api/endpoints", () => api);
vi.mock("@/lib/supabase/useSession", () => ({
  useSupabaseSession: () => ({ ready: true, session: { userId: "u1", token: "jwt", initial: "D" } }),
}));

const KEY = Buffer.from(Uint8Array.from({ length: 65 }, (_, i) => (i === 0 ? 4 : i))).toString("base64url");
const subscriptionJson = { endpoint: "https://push.example/1", keys: { p256dh: "p", auth: "a" } };

function installBrowser({ permission = "default", existing = false }: { permission?: NotificationPermission; existing?: boolean }) {
  const subscription = { endpoint: subscriptionJson.endpoint, toJSON: () => subscriptionJson, unsubscribe: vi.fn() };
  const pushManager = {
    getSubscription: vi.fn().mockResolvedValue(existing ? subscription : null),
    subscribe: vi.fn().mockResolvedValue(subscription),
  };
  const registration = { pushManager };
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { getRegistration: vi.fn().mockResolvedValue(registration), register: vi.fn() },
  });
  vi.stubGlobal("PushManager", class {});
  vi.stubGlobal(
    "Notification",
    Object.assign(class {}, { permission, requestPermission: vi.fn().mockResolvedValue("granted") }),
  );
  return { pushManager, subscription };
}

describe("MatchReminders", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production"); // the worker exists in production builds only
    api.fetchPushConfig.mockResolvedValue({ enabled: true, public_key: KEY });
    api.savePushSubscription.mockResolvedValue(undefined);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it("asks permission, subscribes with the server's VAPID key and saves the subscription", async () => {
    const { pushManager } = installBrowser({});
    render(<MatchReminders />);
    fireEvent.click(await screen.findByRole("button", { name: "Turn on" }));

    expect(await screen.findByText(/On for this device/)).toBeTruthy();
    const options = pushManager.subscribe.mock.calls[0][0];
    expect(options.userVisibleOnly).toBe(true);
    expect(Buffer.from(options.applicationServerKey).toString("base64url")).toBe(KEY);
    expect(api.savePushSubscription).toHaveBeenCalledWith(subscriptionJson, "jwt");
  });

  it("re-saves an existing subscription (another account may have used this browser) and turns off", async () => {
    const { subscription } = installBrowser({ permission: "granted", existing: true });
    api.deletePushSubscription.mockResolvedValue(undefined);
    render(<MatchReminders />);
    fireEvent.click(await screen.findByRole("button", { name: "Turn off" }));

    expect(await screen.findByRole("button", { name: "Turn on" })).toBeTruthy();
    expect(api.savePushSubscription).toHaveBeenCalledWith(subscriptionJson, "jwt");
    expect(api.deletePushSubscription).toHaveBeenCalledWith(subscriptionJson.endpoint, "jwt");
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });

  it("does not touch the push service before permission is granted", async () => {
    const { pushManager } = installBrowser({ permission: "default" });
    render(<MatchReminders />);
    expect(await screen.findByRole("button", { name: "Turn on" })).toBeTruthy();
    expect(pushManager.getSubscription).not.toHaveBeenCalled();
  });

  it("gives up on a push service that never answers", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { pushManager } = installBrowser({ permission: "granted" });
    pushManager.getSubscription.mockReturnValue(new Promise(() => undefined));
    render(<MatchReminders />);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(await screen.findByText(/not available on this device/)).toBeTruthy();
    vi.useRealTimers();
  });

  it("explains blocked notifications instead of offering a dead button", async () => {
    installBrowser({ permission: "denied" });
    render(<MatchReminders />);
    expect(await screen.findByText(/Notifications are blocked/)).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("tells iPhone Safari users to install the app first", async () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    );
    Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: undefined });
    delete (navigator as { serviceWorker?: unknown }).serviceWorker;
    render(<MatchReminders />);
    expect(await screen.findByText(/add THUMBZ to your Home Screen first/)).toBeTruthy();
  });
});
