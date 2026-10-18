# Tasks

## 1. Reshape the day's reminders

- [x] 1.1 Add a pure `matchingRules(rules, day)` to `src/vault/reminders.ts` returning the rules that match a day; unit tests cover the five recurrences and the skip edges. Verify `npm run test` passes the new cases.
- [x] 1.2 Replace `dayReminders`/`ReminderRow` in `src/rows.ts` with `unreferencedRules(graph, rules, day)`, the matching rules whose page the day's note does not reference, deduped by page; unit tests cover a written line suppressing a rule and an unwritten one not suppressing. Verify the tests pass.

## 2. Set a reminder from the calendar day

- [x] 2.1 Add an `onDayContextMenu(event, date)` prop to `JournalCalendar` and call it from each day cell; a component test asserts the callback fires with the cell's date and the event. Verify the test passes.
- [x] 2.2 Give `Sidebar` the day menu: state, `RowContextMenu` with the recurrence items and `Remove reminder` when the open page has a rule, and no reminder items when no page is open. Component tests cover the items for no rule, for an existing rule, and with no open page. Verify the tests pass.
- [x] 2.3 Move the reminder handlers in `App` to the day menu (`onRemind(day, recurrence)` sets or replaces the open page's one rule, `onRemoveReminder` deletes it), and pass the open page's name and whether it has a rule. App integration tests cover set, replace, remove, and no open page. Verify the tests pass.

## 3. Remove the panel section

- [x] 3.1 Delete the Reminders body, form, candidate list, row menu, and props from `MetaPanel` and its CSS, returning the panel to Contents and Links; update or remove the panel's reminder tests. Verify `MetaPanel.test.tsx` passes and no reminder prop remains.
- [x] 3.2 Drop the now-unused reminder candidates, memos, and handlers from `App`, and the panel wiring. Verify `npx tsc -b` is clean and the panel renders without a Reminders section.

## 4. Materialize a due reminder on open

- [x] 4.1 When a journal day's editor mounts, append one reference line per `unreferencedRules` match through `appendMarkdown`, so the note gains the line and the normal save writes it; an App integration test asserts the line lands, exactly once, and that reopening adds nothing. Verify the test passes.
- [x] 4.2 Add an integration test asserting a non-matching day is untouched and a day whose note already references the page is untouched. Verify the test passes.

## 5. Badge

- [x] 5.1 Count the open day's `matchingRules` for the badge, written or not; a unit test with a stubbed badge covers the count, the zero case, and an absent API. Verify the test passes.

## 6. ADR

- [x] 6.1 Write ADR-0032 recording that a due reminder is written into the day's note when the day is opened, and mark ADR-0031 `Superseded by 0032` with a link; list 0032 in `adr/README.md`. Verify the table rows and the MADR shape.

## 7. Docs and version

- [x] 7.1 Update the README's Reminders section: creation from the Journal calendar's day menu, one rule per page, and occurrence lines written on open. Bump `version` in `package.json` (minor). Verify the version reads as a distinct build.

## 8. Integration verification

- [x] 8.1 Update the reminder e2e spec to the day-menu flow and run the whole e2e suite; verify all green and sweep dev servers with `npm run kill:dev`.
- [x] 8.2 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
