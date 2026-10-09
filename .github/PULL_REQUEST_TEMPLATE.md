## What & why

<!-- The change and the problem it solves. Link the issue/task. -->

## Screenshots

<!-- Desktop + phone for UI changes. -->

## Checks

- [ ] `npm run lint && npm run typecheck && npm run test:cov`
- [ ] `npm run build`
- [ ] Follows `design/design.md`; works at phone width (no horizontal scroll), keyboard reachable, visible focus
- [ ] Uses the API only as documented in `../thumbz-server/docs/API-CONTRACT.md` (no guessed fields)
- [ ] Loading, empty and error states handled
- [ ] Cross-browser e2e (`npm run test:e2e`) for user-facing flows; preview checks green
