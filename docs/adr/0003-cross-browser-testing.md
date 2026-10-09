# 0003 — Cross-browser end-to-end tests, and their limits

**Status:** accepted (2026-10)

## Context
Users are on Chrome and Safari, desktop and phone. Unit tests cannot catch
layout, media, auth-redirect or engine-specific bugs.

## Decision
- Playwright projects: Desktop Chrome, Desktop Safari (WebKit), iPhone 14
  (WebKit), Pixel 7 (Chromium), run against a production build and a real API
  (locally, or the Vercel preview of each PR via `preview-checks.yml`).
- Flows with per-user limits sign up a fresh account per test, so parallel
  browsers and repeated runs never collide.
- Lighthouse CI budgets on the main pages: accessibility, best practices and
  SEO ≥ 95, CLS ≤ 0.1 and ≤ 300 KB of JS block; LCP/TBT warn.

## Known limits (documented in the specs)
Playwright's WebKit is WebKit on Linux, not Safari on Apple hardware:
- media decodes with GStreamer, whose clock stalls after the first frames on
  CI/WSL hosts, so WebKit tests assert that decoding started, Chromium that
  playback advances;
- no native HLS, so the iPhone project cannot exercise the iOS DRM path
  (native HLS AES-128); Desktop Safari covers HLS AES-128 through MSE;
- no push service, so subscribing to Web Push is covered by component tests
  and a CDP-delivered push to the service worker.

Real-device checks (iOS Safari, macOS Safari) stay part of release QA.

## Consequences
This suite already found real bugs: a stale-redirect login loop in production
builds, a profile-creation race (409s) on the API, a sticky tab bar that
scrolled away on phones, and a hung push probe.
