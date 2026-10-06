# Tasks

## 1. Issue-reporting line on the brand screen

- [x] 1.1 In `src/components/EditorPane.tsx`, replace the standalone repository
  link with a line stating that bugs and feature requests are reported on the
  repository, with the repository link inline. Verify: with no folder open the
  brand screen shows the line and the link, and the link still opens in a new
  tab with the accessible name "Folio on GitHub".
- [x] 1.2 Style the line in `src/components/EditorPane.module.css` so it sits
  with the brand screen's centered measure. Verify: a dev-server look at the
  no-folder screen and `npx oxlint --deny-warnings`.

## 2. Tests for the line

- [x] 2.1 Extend `src/components/EditorPane.integration.test.tsx`: the brand
  screen shows the issue-reporting line, and the repository link keeps its href,
  target, and accessible name. Verify: `npm run test:integration` passes.
- [x] 2.2 Adjust `src/App.integration.test.tsx` for the new line. Verify: the
  suite passes.
- [x] 2.3 Extend `tests/e2e/workspace.spec.ts` to assert the line is visible on
  the no-folder screen. Verify: `npm run test:e2e` passes.

## 3. Record and land

- [x] 3.1 Add a shipped entry to `PLAN.md` and bump `version` in `package.json`
  (minor: new user-facing content). Verify: the status bar badge names the new
  version.
- [x] 3.2 Run `npx tsc -b`, `npm run test:unit`, `npm run test:integration`,
  `npm run test:e2e`, and `npm run build`. Verify: all pass.
- [x] 3.3 Run `npx oxlint --fix`, `npm run fmt`, then
  `npx oxlint --deny-warnings --format=agent`. Verify: clean.
