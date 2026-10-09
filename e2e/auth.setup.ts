import { test as setup, expect } from "@playwright/test";

import { AUTH_STATE, DEMO_USER } from "./fixtures";

setup("sign in as the demo user", async ({ page }) => {
  await page.goto("/login?next=/profile");
  await page.getByLabel(/email/i).fill(DEMO_USER.email);
  await page.getByLabel(/password/i).fill(DEMO_USER.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByText("Member since")).toBeVisible();
  await page.context().storageState({ path: AUTH_STATE });
});
