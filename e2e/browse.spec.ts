import { expect, isPhone, test } from "./fixtures";

test.describe("browsing", () => {
  test("home renders and the first tab stop skips to content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/THUMBZ/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main#main")).toBeFocused();
  });

  test("primary navigation works on every viewport", async ({ page }) => {
    await page.goto("/");
    if (isPhone(page)) {
      await page.getByRole("button", { name: "Menu" }).click();
      await page.locator("#header-drawer").getByRole("link", { name: "Tournaments" }).click();
    } else {
      await page.getByRole("navigation").first().getByRole("link", { name: "Tournaments" }).click();
    }
    await expect(page).toHaveURL(/\/tournaments$/);
    await expect(page.getByRole("heading", { name: "Tournaments", level: 1 })).toBeVisible();
  });

  test("search is deep-linkable and fuzzy", async ({ page }) => {
    // Server-rendered from the URL: sharing the link shows the same results.
    await page.goto("/search?q=onik&type=team");
    await expect(page.getByRole("searchbox")).toHaveValue("onik");
    await expect(page.getByRole("heading", { name: /Teams/ })).toBeVisible();
    await expect(page.getByRole("main").getByText(/ONIC/).first()).toBeVisible();

    // Typing updates the URL in place (debounced), without a full reload.
    await page.getByRole("searchbox").fill("falcon");
    await expect(page).toHaveURL(/[?&]q=falcon/);
    await expect(page.getByRole("main").getByText(/Team Falcons/).first()).toBeVisible();
  });

  test("match list pages are numbered and shareable", async ({ page }) => {
    await page.goto("/matches");
    const pages = page.getByRole("navigation", { name: /pages/i });
    await pages.getByRole("link", { name: "Page 2" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(pages.getByRole("link", { name: "Page 2" })).toHaveAttribute("aria-current", "page");

    // The same URL opened fresh shows the same page.
    await page.reload();
    await expect(page.getByRole("navigation", { name: /pages/i }).getByRole("link", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("replays load more as you scroll", async ({ page }) => {
    await page.goto("/videos");
    const cards = page.getByRole("main").getByRole("listitem");
    // The list streams in after the route's loading skeleton.
    await expect(cards.first()).toBeVisible();
    const firstPage = await cards.count();

    // Reaching the end of the list loads the next page (on a tall screen the
    // first page may not fill it, and the next page loads straight away).
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => cards.count(), { timeout: 15_000 }).toBeGreaterThan(Math.min(firstPage, 4));
  });

  test("unknown pages render the not-found page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });
});
