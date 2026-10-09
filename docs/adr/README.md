# Architecture decision records (frontend)

| # | Decision |
| --- | --- |
| [0001](0001-rendering-and-caching.md) | Static/ISR where the content is public, dynamic only where it is personal |
| [0002](0002-hand-written-service-worker.md) | A small hand-written service worker instead of a PWA framework |
| [0003](0003-cross-browser-testing.md) | Cross-browser end-to-end tests against real builds, with known engine limits |

System-wide decisions (realtime, payments, DRM, caching…) live in the server
repo: `thumbz-server/docs/adr/`.
