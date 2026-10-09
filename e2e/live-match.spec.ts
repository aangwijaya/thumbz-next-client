import { expect, firstLiveMatchId, isPhone, test } from "./fixtures";

test.describe("live match page", () => {
  test("plays the stream and shows real series and per-game stats", async ({ page, browserName }) => {
    const id = await firstLiveMatchId();
    test.skip(!id, "no live match in this environment");
    await page.goto(`/matches/${id}`);

    // Public stream through shaka (MSE) or native HLS: frames decode and time moves.
    // Linux WebKit (Playwright) renders media with GStreamer, whose clock stalls
    // after the first frames on CI/WSL hosts; real Safari uses AVFoundation. So
    // on WebKit we assert decoding started, elsewhere that playback advances.
    const minimum = browserName === "webkit" ? 0 : 0.5;
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const video = document.querySelector("video");
            return video && video.videoWidth > 0 ? video.currentTime : -1;
          }),
        { timeout: 30_000 },
      )
      .toBeGreaterThan(minimum);
    await expect(page.getByText(/Game \d of \d/)).toBeVisible();

    // Live data is a spoiler: hidden until the viewer asks.
    const reveal = page.getByRole("button", { name: "Show for this match" }).first();
    if (await reveal.isVisible()) await reveal.click();
    if (isPhone(page)) {
      await page.getByRole("tab", { name: "Stats" }).click();
    }
    const stats = page.locator("section[aria-labelledby=live-stats-title]");
    await expect(stats.getByRole("heading", { name: /^Game \d/ })).toBeVisible();
    // Player rows carry nickname, hero and level from the live snapshots.
    await expect(stats.getByText(/ · Lv \d+/).first()).toBeVisible();
  });

  test("phone tabs stay reachable under the sticky header", async ({ page }) => {
    test.skip(!isPhone(page), "phone layout only");
    const id = await firstLiveMatchId();
    test.skip(!id, "no live match in this environment");
    await page.goto(`/matches/${id}`);
    const tabs = page.getByRole("tablist", { name: "Match" });
    // A tall panel, then scroll into it: the bar should pin under the header.
    // (Touch WebKit has no wheel events, so scroll the page directly.)
    await tabs.getByRole("tab", { name: "Stats" }).click();
    await page.evaluate(() => window.scrollBy(0, 700));
    await expect(tabs).toBeInViewport();
    const [header, bar] = await Promise.all([page.locator("header").boundingBox(), tabs.boundingBox()]);
    expect(bar!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);

    // Keyboard: arrows move between tabs (WAI-ARIA tabs pattern).
    await tabs.getByRole("tab", { selected: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.getByRole("tab", { name: "More" })).toHaveAttribute("aria-selected", "true");
  });
});
