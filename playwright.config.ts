import { defineConfig, devices } from "@playwright/test";

/**
 * Cross-browser end-to-end tests against a running stack (API + client).
 * Locally: the client on :3000 talking to the local API (see README). In CI
 * the workflow starts both and points E2E_BASE_URL at the client.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
// Full Chromium in new headless mode (closest to Chrome); sandboxing needs
// kernel features some containers/WSL lack, so it can be switched off.
const chromium = {
  channel: "chromium",
  launchOptions: { args: process.env.E2E_NO_SANDBOX ? ["--no-sandbox"] : [] },
};

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { ...devices["Desktop Chrome"], ...chromium } },
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"], ...chromium },
      dependencies: ["setup"],
    },
    { name: "desktop-safari", use: { ...devices["Desktop Safari"] }, dependencies: ["setup"] },
    { name: "iphone", use: { ...devices["iPhone 14"] }, dependencies: ["setup"] },
    {
      name: "pixel",
      use: { ...devices["Pixel 7"], ...chromium },
      dependencies: ["setup"],
    },
  ],
});
