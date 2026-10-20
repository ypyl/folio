# Tasks

## 1. The row menu's reminder item

- [x] 1.1 Add `reminderTargets?: ReadonlySet<string>` and `onRemoveReminderFor?: (path: string) => void` to `Sidebar`'s props, and build the page row menu's items as favorite, `Remove reminder` when `remindersEnabled` and `reminderTargets` holds the row's lowercased label, then `Present`. Verify the Sidebar integration tests: the item appears for a page with a rule in that order, and is absent with no rule and with the feature off.
- [x] 1.2 Add an App integration test: with page A holding a rule and page B open, activating `Remove reminder` on A's row removes only A's rule (`.folio/reminders.md` no longer names A), leaves B's, and leaves the open page and editor unchanged. Verify the test passes.

## 2. Wiring and one write path

- [x] 2.1 In App, memoize `reminderTargets` from `reminders` (lowercased targets) and add `handleRemoveReminderFor(path)` that resolves the row's page title the way `reminderTarget` does; route both it and the day menu's `handleRemoveReminder` through one rule-filtering helper. Pass the set and the handler to `Sidebar`. Verify the existing reminder App tests still pass.
- [x] 2.2 Add an App integration test that the item is absent while the flag is off although the rule file names the page, and that the rule still applies (a later day still materializes). Verify the test passes.

## 3. Docs and version

- [x] 3.1 Note in the README's Reminders section that a reminder can also be removed from the page's own row menu, next to `Favorite`/`Unfavorite`, and bump `version` in `package.json` (minor). Verify the status bar's badge reads the new version.

## 4. Integration verification

- [x] 4.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 4.2 Run the whole e2e suite; verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
