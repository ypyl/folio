# Tasks

## 1. A disabled menu item

- [x] 1.1 Add `disabled?: boolean` to `RowMenuItem`, render it as the button's native `disabled` attribute, focus the first available item on open (falling back to the menu container with `tabIndex={-1}`), and move the arrow keys/`Home`/`End` only over available items. Verify the `RowContextMenu` tests: a disabled item cannot be activated, takes no focus, and is skipped by the keyboard.
- [x] 1.2 Verify the page row menu is unchanged: run the existing row-menu tests green.

## 2. The day menu on any day

- [x] 2.1 Drop the `date < today` guard from `Sidebar.openDayMenu` and mark `Once, on this day` disabled when `date < today`. Verify the Sidebar integration tests: a past day opens the menu with `Once` disabled and the other items enabled, choosing a recurrence on a past day calls `onRemind` with that day, and `Remove reminder` still appears for a page with a rule.
- [x] 2.2 Flip the App integration test that expects no menu on a past day: the menu now opens with `Once, on this day` disabled, and activating an enabled recurrence on a past day writes that anchor to `.folio/reminders.md`. Verify the test passes.

## 3. Docs and version

- [x] 3.1 Update the README's Reminders section: the day menu works for any day, and `Once, on this day` is unavailable for a day before today. Bump `version` in `package.json` (minor). Verify the status bar's badge reads the new version.

## 4. Integration verification

- [x] 4.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 4.2 Run the whole e2e suite; verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
