import { expect, test } from "./fixtures";

test.describe("installable app", () => {
  test("serves a manifest and the meta iOS needs", async ({ page, request }) => {
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest).toMatchObject({ display: "standalone", start_url: expect.stringMatching(/^\//) });
    expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === "maskable")).toBe(true);

    await page.goto("/");
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /viewport-fit=cover/);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  });

  test("works offline from the service worker", async ({ page, context, browserName }) => {
    test.skip(process.env.E2E_SW !== "1", "needs a production build (set E2E_SW=1)");
    test.skip(browserName === "webkit", "Playwright cannot toggle offline for WebKit service workers reliably");
    await page.goto("/tournaments");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // now controlled, so the page is cached
    await context.setOffline(true);
    await page.goto("/tournaments");
    await expect(page.getByRole("heading", { name: "Tournaments", level: 1 })).toBeVisible();
    await page.goto("/teams");
    await expect(page.getByRole("heading", { name: "You're not connected" })).toBeVisible();
  });
});
