# Tasks

## 1. Brand-screen copy and tour reference

- [x] 1.1 In `src/components/EditorPane.tsx`, add the description, the facts
  paragraph, and the tour-reference block to the no-folder brand screen, gated
  on `emptyHint !== 'notes'`, and add an optional `onTour?: () => void` prop
  rendered as the `Take the tour` control only when present. Verify: with no
  folder open the pane shows the description and facts, and shows the control
  only when `onTour` is supplied.
- [x] 1.2 Style the block in `src/components/EditorPane.module.css`: the
  description keeps the tagline's centered measure, and the tour control follows
  DESIGN.md's single link behavior (brand ink, no underline, hover tint). Verify:
  a dev-server look at the no-folder screen and `npx oxlint --deny-warnings`.
- [x] 1.3 In `src/App.tsx`, pass the rail's tour callback to `EditorPane` only
  when `!compact`, so the brand screen's control opens the tour on wide
  viewports and is absent on compact. Verify: the control opens the tour on a
  wide viewport and is absent at or below the compact breakpoint.

## 2. Tests for the new screen

- [x] 2.1 Extend `src/App.integration.test.tsx`: the no-folder state shows the
  description and facts; on a wide viewport it shows the `Take the tour` control
  and activating it opens the tour; at or below the compact breakpoint it shows
  neither. Verify: `npm run test:integration` passes.
- [x] 2.2 Adjust `src/components/EditorPane.integration.test.tsx` for the new
  copy and the `onTour` presence/absence. Verify: the suite passes.
- [x] 2.3 Extend `tests/e2e/workspace.spec.ts`: the no-folder screen shows the
  description, and its `Take the tour` control opens the app tour. Verify:
  `npm run test:e2e` passes.

## 3. Record and land

- [x] 3.1 Add a shipped entry to `PLAN.md` and bump `version` in `package.json`
  (minor: new user-facing content). Verify: the status bar badge names the new
  version.
- [x] 3.2 Run `npx tsc -b`, `npm run test:unit`, `npm run test:integration`,
  `npm run test:e2e`, and `npm run build`. Verify: all pass.
- [x] 3.3 Run `npx oxlint --fix`, `npm run fmt`, then
  `npx oxlint --deny-warnings --format=agent`. Verify: clean.
