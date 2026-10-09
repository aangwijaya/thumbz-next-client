import type { Page } from "@playwright/test";

import { API_URL, expect, test } from "./fixtures";

/** Width of the decoded picture: > 0 once the key was released and frames decode. */
const decodedWidth = (page: Page) => page.evaluate(() => document.querySelector("video")?.videoWidth ?? 0);

/** A replay served as a protected (DRM) asset, if this environment registered one. */
async function protectedVideoId(): Promise<string | null> {
  const response = await fetch(`${API_URL}/videos?pageSize=50`);
  const videos = ((await response.json()) as { data?: Array<{ id: string; media?: unknown }> }).data ?? [];
  return videos.find((video) => video.media)?.id ?? null;
}

test.describe("protected replay (DRM)", () => {
  test("asks signed-out visitors to sign in", async ({ page }) => {
    const id = await protectedVideoId();
    test.skip(!id, "no protected replay registered (scripts/media/register.ts)");
    await page.goto(`/videos/${id}`);
    await expect(page.getByText("Protected").first()).toBeVisible();
    await expect(page.getByText("Sign in to watch this replay")).toBeVisible();
  });

  test("plays with a per-session key and enforces the device limit", async ({ freshUser: page, browserName }, testInfo) => {
    // Real iOS plays this through native HLS (AVFoundation). Playwright's
    // iPhone project is Linux WebKit with an iPhone UA: no native HLS, and its
    // ManagedMediaSource never streams the decrypted segments, so it cannot
    // stand in for iOS here. Desktop Safari (WebKit, plain MSE) covers the
    // HLS AES-128 path; verify iOS on a device or a macOS runner.
    test.skip(testInfo.project.name === "iphone", "iOS DRM path is native HLS; not reproducible on Linux WebKit");
    const id = await protectedVideoId();
    test.skip(!id, "no protected replay registered (scripts/media/register.ts)");
    const keyRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/drm/clearkey/license")) keyRequests.push(request.headers()["authorization"] ? "license+token" : "license");
      if (url.includes("/drm/hls/key")) keyRequests.push(url.includes("token=") ? "hls-key+token" : "hls-key");
    });

    await page.goto(`/videos/${id}`);
    // Chromium: DASH + ClearKey via EME. Linux WebKit has no ClearKey CDM for
    // this content and takes HLS AES-128 through MSE; real Safari plays HLS natively.
    await expect.poll(() => decodedWidth(page), { timeout: 30_000 }).toBeGreaterThan(0);
    // The protection label is part of the controls on wider screens only.
    if ((page.viewportSize()?.width ?? 0) > 480) await expect(page.getByText(/DASH · |HLS · /)).toBeVisible();
    const minimum = browserName === "webkit" ? 0 : 0.5; // see live-match.spec.ts (GStreamer clock)
    await expect
      .poll(() => page.evaluate(() => document.querySelector("video")?.currentTime ?? 0), { timeout: 30_000 })
      .toBeGreaterThan(minimum);
    expect(keyRequests.length).toBeGreaterThan(0);
    expect(keyRequests.every((kind) => kind.endsWith("+token"))).toBe(true);

    // Two devices may stream at once; the third is turned away with a reason.
    const second = await page.context().newPage();
    await second.goto(`/videos/${id}`);
    await expect.poll(() => decodedWidth(second), { timeout: 30_000 }).toBeGreaterThan(0);
    const third = await page.context().newPage();
    await third.goto(`/videos/${id}`);
    await expect(third.getByText("Device limit reached")).toBeVisible();
  });
});
