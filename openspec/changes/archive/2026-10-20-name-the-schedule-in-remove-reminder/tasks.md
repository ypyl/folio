# Tasks

## 1. The rule reaches the row menu

- [x] 1.1 In App, replace the memoized `reminderTargets` set with a memoized `ReadonlyMap` from lowercased page name to `{ recurrence, anchor }`, built from `reminders`, and pass it to `Sidebar`. Verify the existing row-menu reminder tests still pass.
- [x] 1.2 In Sidebar, take that map, look the row's rule up once per menu open, and build the removal item's label as `Remove reminder (<schedule>)` with `describeSchedule`. Verify the Sidebar tests: a daily rule reads `Remove reminder (every day from October 6, 2026)`, a once rule reads `Remove reminder (once, on October 20, 2026)`, a page with no rule has no item, and activating the item still calls `onRemoveReminderFor` with the row's path.
- [x] 1.3 Update the App and e2e expectations that match the item by its exact old name, and add an App case asserting the labelled item appears for a page with a rule. Verify the tests pass.

## 2. Docs and version

- [x] 2.1 Update the README's removal sentence to say the item names the schedule it removes. Bump `version` in `package.json` (minor). Verify the status bar's badge reads the new version.

## 3. Integration verification

- [x] 3.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 3.2 Run the whole e2e suite; verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
