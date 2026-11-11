# Tasks

Note: `AGENTS.md` bumps `version` in `package.json` on every commit — a minor bump
for this change.

## 1. The navigation bar

- [x] 1.1 Add `CompactNavBar` and its stylesheet: a 64px footer (plus the bottom
  safe-area inset) holding a `<nav>` with three equal destinations, each a
  full-height third with a 24px icon, a 12px label, a 56×32 indicator behind the
  active icon, brand ink when active, `aria-current="page"` on the active one,
  and no status text. Verify with unit tests: the three labels in order, the
  active indicator on exactly one destination, `aria-current` agreeing with the
  indicator, and a click reporting its view.
- [x] 1.2 Give the three destinations distinct line icons (Notes, Page, Details)
  drawn inline, and verify the active state is not colour alone (the indicator is
  present on exactly one destination).

## 2. The app's view selection

- [x] 2.1 Render the navigation bar at compact and the wide status bar above it,
  passing the shown view and a selection callback. Remove the compact props from
  `StatusBar` and its compact branch, `PanelsIcon`, and compact CSS; keep the wide
  path, save state, vault group, and version. Verify with unit tests for the wide
  bar and integration tests for the compact footer.
- [x] 2.2 Implement selection: the shown destination does nothing; the editor
  destination returns to the editor (popping a pushed entry); selecting either
  other view from the editor pushes one entry; switching directly between Notes
  and Details pushes none. Verify with integration tests for each case and for
  Back returning to the editor in one step.

## 3. The save state in the app bar

- [x] 3.1 Extract the save-state label into a shared helper and give `CompactBar`
  a 64px height, a 12px status line under the title (outside the 48px title
  control, announced as a status), and no status line on the brand screen. Verify
  with unit tests for the copy and the announcement, and an integration test that
  the app bar shows "Unsaved changes" while the navigation bar shows only the
  three destinations.
- [x] 3.2 Keep the wide status bar's save state and loading label unchanged, and
  verify the wide e2e case still sees them.

## 4. The phone layout

- [x] 4.1 Offset the compact layers below the 64px app bar and above the 64px
  navigation bar, and confirm no sideways scroll at 390×844 and no clipped
  destination with the bottom inset. Verify in the e2e suite and on the device.
- [x] 4.2 Check the keyboard case: the app bar and the navigation bar stay
  visible, and the caret's line is not covered.

## 5. The design language

- [x] 5.1 In `DESIGN.md`, replace the two-view-control description with the
  three-destination navigation bar (64px, equal segments, indicator) and move the
  save state to the app bar's status line. Verify nothing it states contradicts
  the delta spec.

## 6. Integration checks

- [x] 6.1 Run `npx oxlint --fix`, `npm run fmt`,
  `npx oxlint --deny-warnings --format=agent`, `tsc -b`, `npm run build`, and the
  full `npm test`; confirm all are clean.
- [x] 6.2 Run `npm run test:e2e` and confirm the whole suite passes, including the
  updated compact cases and the wide composition case.
- [x] 6.3 On the Pixel 9a over `adb reverse`, check the three destinations, the
  56×32 indicator, the 64px bar heights, the app bar's save state, the four views
  from the navigation bar, Back returning to the editor, and the keyboard. Sweep
  the server and the tunnel afterwards.

## Workflow follow-up

- Archive the change after the checks pass, syncing the main spec and bumping the
  version again.
- Push `master` to `origin` and `nas`.
