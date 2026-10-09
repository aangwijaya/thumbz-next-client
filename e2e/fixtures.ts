import { test as base, expect, type Page } from "@playwright/test";

// Inside test-results/ (git-ignored, cleared at the start of every run): it holds a session token.
export const AUTH_STATE = "test-results/.auth/demo.json";
/** Demo account created by the API seed (local stack / staging only). */
export const DEMO_USER = {
  email: process.env.E2E_EMAIL ?? "demo@thumbz.local",
  password: process.env.E2E_PASSWORD ?? "thumbz-demo-123",
};
export const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001/api/v1";

/** Phones collapse the header nav into a menu; tests branch on it rather than guess. */
export const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1280) <= 900;

/** A live match that has a stream to play (some go live before a stream exists). */
export async function firstLiveMatchId(): Promise<string | null> {
  const response = await fetch(`${API_URL}/matches/live?pageSize=10`);
  const live = ((await response.json()) as { data?: Array<{ id: string }> }).data ?? [];
  for (const { id } of live) {
    const detail = await fetch(`${API_URL}/matches/${id}`);
    const match = ((await detail.json()) as { data?: { stream_url?: string | null } }).data;
    if (match?.stream_url) return id;
  }
  return null;
}

/**
 * Signs up a brand-new account through the register form (local Supabase does
 * not ask for email confirmation). For flows with per-user limits, like
 * buying tickets, so repeated runs and parallel browsers never collide.
 */
async function signUpFreshUser(page: Page): Promise<void> {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@thumbz.local`;
  await page.goto("/login?mode=register&next=/profile");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(`pw-${Math.random().toString(36).slice(2)}-E2e!`);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/profile$/, { timeout: 20_000 });
  // Sign-up ends in a full navigation; let it finish before the test navigates.
  await expect(page.getByText("Member since")).toBeVisible();
}

export const test = base.extend<{ signedIn: Page; freshUser: Page }>({
  /** A page signed in as a new, empty account. */
  freshUser: async ({ browser, contextOptions }, use) => {
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    await signUpFreshUser(page);
    await use(page);
    await context.close();
  },
  /** A page whose context carries the demo user's session. */
  signedIn: async ({ browser, contextOptions }, use) => {
    const context = await browser.newContext({ ...contextOptions, storageState: AUTH_STATE });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
