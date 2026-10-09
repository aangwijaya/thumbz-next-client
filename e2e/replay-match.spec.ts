import { API_URL, expect, isPhone, test } from "./fixtures";

/** A completed series with more than one game, if any. */
async function multiGameReplayId(): Promise<string | null> {
  const response = await fetch(`${API_URL}/matches?status=completed&pageSize=20`);
  const matches =
    ((await response.json()) as { data?: Array<{ id: string; score_a: number | null; score_b: number | null }> }).data ?? [];
  return matches.find((match) => (match.score_a ?? 0) + (match.score_b ?? 0) > 1)?.id ?? null;
}

test.describe("completed match", () => {
  test("shows every game's stats, build and item sequence", async ({ page }) => {
    const id = await multiGameReplayId();
    test.skip(!id, "no completed series in this environment");
    await page.goto(`/matches/${id}?tab=stats`);

    const reveal = page.getByRole("button", { name: "Show for this match" }).first();
    if (await reveal.isVisible()) await reveal.click();
    if (isPhone(page)) await page.getByRole("tab", { name: "Stats" }).click();

    const stats = page.locator("section[aria-labelledby=live-stats-title]");
    const games = stats.getByRole("tablist", { name: "Games" });
    await expect(games.getByRole("tab")).not.toHaveCount(0);

    // WAI-ARIA tabs: Home selects game 1, and the heading follows.
    await games.getByRole("tab", { selected: true }).focus();
    await page.keyboard.press("Home");
    await expect(games.getByRole("tab", { name: "Game 1" })).toHaveAttribute("aria-selected", "true");
    await expect(stats.getByRole("heading", { name: /^Game 1, \d{2}:\d{2}$/ })).toBeVisible();

    // Final build per player, and the purchases in order with their times.
    await expect(stats.getByRole("img", { name: /^Items: / }).first()).toBeVisible();
    const sequence = stats.locator("section[aria-labelledby=item-sequence-title]");
    const firstPlayer = sequence.getByRole("list", { name: /'s purchases$/ }).first();
    await expect(firstPlayer.getByRole("listitem").first()).toContainText(/, \d{2}:\d{2}$/);

    await games.getByRole("tab", { name: "Game 2" }).click();
    await expect(stats.getByRole("heading", { name: /^Game 2, / })).toBeVisible();
  });
});
