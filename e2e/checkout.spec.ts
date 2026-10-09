import { API_URL, expect, test } from "./fixtures";

/** An upcoming or live match with QRIS ticket sales open (sandbox gateway), if any. */
async function matchOnSale(): Promise<string | null> {
  const lists = await Promise.all(
    ["/matches/upcoming?pageSize=20", "/matches/live?pageSize=10"].map(async (path) => {
      const response = await fetch(`${API_URL}${path}`);
      return ((await response.json()) as { data?: Array<{ id: string }> }).data ?? [];
    }),
  );
  const matches = lists.flat();
  for (const match of matches) {
    const ticket = await fetch(`${API_URL}/matches/${match.id}/ticket`);
    if (!ticket.ok) continue;
    const info = (await ticket.json()) as { data?: { on_sale?: boolean; payment_methods?: Array<{ method: string }> } };
    if (info.data?.on_sale && info.data.payment_methods?.some((option) => option.method === "qris")) return match.id;
  }
  return null;
}

test.describe("checkout (sandbox gateway)", () => {
  test("QRIS order is paid in real time and issues ticket QR codes", async ({ freshUser: page }) => {
    const id = await matchOnSale();
    test.skip(!id, "no match with QRIS ticket sales in this environment");
    await page.goto(`/matches/${id}?tab=more#tickets`);
    const panel = page.locator("#tickets");
    await panel.scrollIntoViewIfNeeded();
    await panel.locator("label", { hasText: "QRIS" }).click();
    await panel.getByRole("button", { name: /^Reserve/ }).click();

    await expect(panel.getByRole("img", { name: /QRIS code/ })).toBeVisible();
    await panel.getByRole("button", { name: /Simulate payment/ }).click();
    // The paid state arrives over the realtime channel (polling as fallback).
    await expect(panel.getByText("Payment received")).toBeVisible({ timeout: 20_000 });
    await expect(panel.getByText("Ticket 1")).toBeVisible();
  });
});
