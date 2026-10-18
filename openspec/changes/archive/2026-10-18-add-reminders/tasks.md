# Tasks

## 1. Reminder rules in the vault index

- [x] 1.1 Add a pure rule parser (`parseReminders`) and renderer for `.folio/reminders.md` in `src/vault/`, reusing the existing reference scanner for the page token; unit tests cover the five recurrences, a single- and multi-word page, and a malformed line ignored. Verify `npm run test` passes the new cases.
- [x] 1.2 Read the reminders file in `buildIndex` the way `readPins` reads pins, add `reminders` to `VaultIndex`, and add an `upsertReminders` writer through `VaultStorage`; an index integration test writes a rule, rescans, and reads it back. Verify the test passes and no keystroke-path code changes.
- [x] 1.3 Add a pure `ruleMatches(rule, day)` with the skip rule for short months and Feb 29; unit tests cover once, daily, weekly, monthly, yearly, the 31st in a 30-day month, and Feb 29 in a common year. Verify the tests pass.

## 2. Derive a day's reminders

- [x] 2.1 Add a pure `dayReminders(graph, rules, day)` in `src/rows.ts` returning, one row per rule, a recorded row when the day references the rule's page and a pending row when the rule matches and is not referenced, keyed by page; unit tests cover pending, recorded, a non-matching rule, and the dedupe. Verify the tests pass.
- [x] 2.2 Memoize the derivation in `App` keyed to the graph and open-day identity, and assert with a call-count test that typing does not rebuild it. Verify the new case and the existing "stays off the typing path" cases pass.

## 3. The Reminders section

- [x] 3.1 Add a Reminders section to `MetaPanel`, shown only while a journal day is open, listing the rows with a pending action and an empty state; component tests cover a journal day, a non-journal page, and a board. Verify the component tests pass.
- [x] 3.2 Follow `DESIGN.md` for the section's tokens and the scroll-region rules, and add the section to the scroll-region test's region list. Verify `src/scrollRegions.test.ts` passes and the built stylesheet carries the section's rules.

## 4. Set a reminder

- [x] 4.1 Add an "Add reminder" control and inline form to the section: a page field backed by the reference candidate pool, a recurrence select, and the anchor defaulting to the open day; saving writes one rule. Component tests cover the form, the write, and the default anchor. Verify the tests pass.
- [x] 4.2 Add an integration test asserting that setting a reminder writes one rule and creates no page or note file. Verify the test passes.

## 5. Act on a pending reminder

- [x] 5.1 Wire a pending row's action to insert its reference at the end of the open day's note through the editor adapter's insertion path, so the normal draft-and-save writes it; an App integration test asserts the line lands, one occurrence, and the reminder page's backlinks then list the day. Verify the test passes.
- [x] 5.2 Add an integration test asserting that opening, closing, and scrolling the day and its reminder list leave the note unchanged. Verify the test passes.

## 6. Remove a reminder

- [x] 6.1 Add the row menu on reminder rows with a "Remove reminder" item that rewrites `.folio/reminders.md` without that line through `upsertReminders`; component tests cover the menu on a reminder row and the rewritten file. Verify the tests pass.
- [x] 6.2 Add an integration test asserting that removal stops future occurrences, keeps the day's note and the reminder page's backlinks, and leaves a readable header-only rule file when the last rule goes. Verify the test passes.

## 7. Badge

- [x] 7.1 Set and clear `navigator.setAppBadge` from the pending count when the API exists; a unit test with a stubbed badge covers the count, the zero case, and an absent API. Verify the test passes.

## 8. Docs and ADR

- [x] 8.1 Confirm ADR-0031 (`adr/0031-reminders-are-derived-from-rules.md`), already written with this change, still matches the shipped behavior, and that `adr/README.md` lists it; verify the table row and the MADR shape.
- [x] 8.2 Update `README.md` to name reminders among the app's features, and bump `version` in `package.json` (minor). Verify the version reads as a distinct build.

## 9. Integration verification

- [x] 9.1 Run the whole suite plus `npx tsc`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 9.2 Add and run a real-Chromium Playwright spec (`tests/e2e/reminders.spec.ts`): set a daily reminder on the open day, confirm the pending row, activate it, confirm the written line and the recorded row, then remove the reminder and confirm the schedule clears while the written line stays. Run the whole e2e suite and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review, and mark any completed `PLAN.md` task it closes.
