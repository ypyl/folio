# Tasks

## 1. The day menu sets reminders only

- [x] 1.1 Move the five recurrence labels into one `RECURRENCE_LABELS` map, use it for the day menu's items, and drop the day menu's `Remove reminder` item together with the `hasReminder` and `onRemoveReminder` props. Verify the Sidebar tests: the day menu holds exactly the five recurrence items for a page with a rule, and the two day-menu removal tests are gone or rewritten to assert no removal item.
- [x] 1.2 Remove the now-unused `handleRemoveReminder` from App and keep the row menu's `onRemoveReminderFor` route working. Verify the row-menu reminder tests still pass.

## 2. Confirmation before a replacement

- [x] 2.1 Add `ConfirmReminderReplace`, a native `<dialog>` naming the page, the rule being replaced, and the choice being made, with `Cancel` focused, and `Escape`/`Cancel` reporting cancellation. Verify its tests: the dialog opens modal, focus starts on Cancel, Replace and Cancel report once each, and Escape reports cancellation.
- [x] 2.2 Gate `handleRemind` in App on the open page's existing rule: store the pending choice and render the confirmation when a rule exists, write immediately when it does not, and clear the pending choice on cancel. Verify the App integration tests: no-dialog immediate write for a page with no rule, confirmation for a page with a rule, Cancel/Escape leaves `.folio/reminders.md` untouched, and Replace writes only the new rule.

## 3. Docs and version

- [x] 3.1 Update the README's Reminders section: the day menu sets reminders only, replacing an existing one asks first, and removal is on the page's row menu. Bump `version` in `package.json` (minor). Verify the status bar's badge reads the new version.

## 4. Integration verification

- [x] 4.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 4.2 Run the whole e2e suite; verify all green and sweep dev servers with `npm run kill:dev`. Extend the reminders e2e happy path to replace a rule through the confirmation, since the day menu no longer removes it.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
