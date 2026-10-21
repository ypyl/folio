# Tasks

## 1. A menu item with a description

- [x] 1.1 Add `description?: string` to `RowMenuItem`, render it as a second span under the label inside the same button, wire `aria-describedby` with ids from `useId`, and style the caption as a small muted line. Verify the `RowContextMenu` tests: the label stays the accessible name, the caption is the accessible description, an item without a description is unchanged, and the keyboard model still skips disabled items.
- [x] 1.2 In Sidebar, pass `Remove reminder` as the label and `describeSchedule(rule)` as the description. Verify the Sidebar tests: the item's name is exactly `Remove reminder`, the caption reads `every day from October 6, 2026` for a daily rule and `once, on October 20, 2026` for a one-off, and activation still removes the row's rule.

## 2. App, e2e, docs, version

- [x] 2.1 Update the App reminder tests to query the item by its exact name again and assert the caption text; update the e2e reminders path the same way. Verify the tests pass.
- [x] 2.2 Update the README's removal sentence to describe the label plus the caption beneath it. Bump `version` in `package.json` (minor). Verify the status bar's badge reads the new version.

## 3. Integration verification

- [x] 3.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 3.2 Run the whole e2e suite and check the two-line item in a real browser; verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
