# Tasks

Note: `AGENTS.md` bumps `version` in `package.json` on every commit — a minor bump
for this change.

## 1. The scale

- [x] 1.1 Raise the compact values in the module stylesheets: list and meta rows
  17px, section labels 13px, calendar days 16px, weekdays 12px, month 17px,
  buttons 17px, menu items 16px, badges 12px, secondary copy 15px, brand
  description 17px, shortcut labels 16px and chips 14px, status line 13px. Verify
  with the e2e type-scale case updated to the new values.
- [x] 1.2 Raise the compact editor to 18px with 1.3em headings and a 1.55 line
  height, leaving the wide editor at 15px. Verify the computed editor size at
  compact and the unchanged size at 1280px.
- [x] 1.3 Raise the app bar title to 18px and its status line to 13px, keeping
  the 64px bar and the 48px title target, and the navigation bar's label to 13px.
  Verify the bars' measured heights and the e2e bar cases.

## 2. The rows

- [x] 2.1 Set a Files row to 56px, update `COMPACT_ROW_STRIDE` to 58, and make
  the loading skeleton and calendar skeleton follow. Verify with the
  `pageWindow` unit tests and a browser scroll check of a long listing.
- [x] 2.2 Confirm the larger text does not clip: the calendar's 48px cell with a
  16px numeral, the nav destination's 64px with a 13px label, the app bar's
  title and status, and a three-line meta row. Verify in the browser at 390×844
  and on the device.

## 3. The design language

- [x] 3.1 Update `DESIGN.md`'s compact scale and row height to the new values,
  including the 12px floor. Verify nothing it states contradicts the delta spec.

## 4. Integration checks

- [x] 4.1 Run `npx oxlint --fix`, `npm run fmt`,
  `npx oxlint --deny-warnings --format=agent`, `tsc -b`, `npm run build`, and the
  full `npm test`; confirm all are clean.
- [x] 4.2 Run `npm run test:e2e` and confirm the whole suite passes, including the
  updated type-scale and row-target cases.
- [x] 4.3 On the Pixel 9a over `adb reverse`, check the editor, the list, the
  calendar, the app bar, and the navigation bar at the new sizes, plus the
  keyboard case. Regenerate the manifest screenshots, since the phone layout
  changed, and verify the manifest still serves them.

## Workflow follow-up

- Archive the change after the checks pass, syncing the main spec and bumping the
  version again.
- Push `master` to `origin` and `nas`.
