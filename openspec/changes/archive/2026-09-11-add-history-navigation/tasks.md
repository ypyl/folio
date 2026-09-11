## 1. The visit log and its cursor

- [x] 1.1 Replace the stack in `src/history.ts` with a log-and-cursor model: state `{ entries, cursor }`, an append that returns the state unchanged when the path already sits at the cursor and otherwise truncates everything ahead of the cursor before appending, a cap that drops from the head and shifts the cursor by the number dropped, and a clamped step for Back and Forward; verify `src/history.test.ts` covers append, repeat-at-cursor, truncation after a step, the cap shift, and stepping at both ends.
- [x] 1.2 Move `App`'s trail state to the new model and keep the single recording effect keyed on the open page; verify an `App.test.tsx` case opens three pages, steps Back, opens a fourth, and finds the trail truncated to the new line with Forward unavailable.
- [x] 1.3 Add a suppression ref that the Back/Forward handlers set and the recording effect consumes, so a step moves the cursor without appending; verify an `App.test.tsx` case asserts Back then Forward leaves the trail's entries unchanged and the open page correct.
- [x] 1.4 Derive Back and Forward availability from the cursor and expose the two handlers; verify `App.test.tsx` cases for both controls disabled at the start of a session, Back enabled after two opens, and Forward disabled again after a new navigation from a backed-out position.

## 2. The control row, and removing the section

- [x] 2.1 Remove the History accordion from `Sidebar`, along with the `history` prop, the `HistoryRow` type, and the dimmed row style; verify the sidebar's History cases in `Sidebar.test.tsx` are gone and the suite passes without them.
- [x] 2.2 Add the sticky control row as the sidebar's first child, above the Journal section, holding Back and Forward buttons with accessible names, disabled states, and the app's focus treatment; verify `Sidebar.test.tsx` cases for placement (the row precedes both sections), the sticky treatment, the accessible names, and the disabled states, and that activating a control calls its handler with the right direction.
- [x] 2.3 Confirm nothing references the removed section or the old pill/empty-state copy anywhere in the app or its tests; verify `npx oxlint --deny-warnings` and a repo-wide search for the removed identifiers come back clean.

## 3. Windowing the Pages list

- [x] 3.1 Add a pure range function (total, stride, viewport height, scroll offset, list offset, overscan, index to keep) returning the rendered range and the two spacer heights; verify unit tests cover an empty list, a list shorter than the viewport (everything rendered, no spacers), a long list (bounded rows, spacers summing to the full extent), a deep scroll, and a kept index that sits outside the range.
- [x] 3.2 Wire the range into `Sidebar`: measure the container in a layout effect, recompute on scroll with `requestAnimationFrame` coalescing and update state only when the range changes, and notice layout changes above the list with a `ResizeObserver`; verify a `Sidebar.test.tsx` case with a stubbed viewport height and a large synthetic vault renders a bounded row count with both spacers, and that a scroll event changes which rows render.
- [x] 3.3 Keep the listing complete for assistive technology and for the open page: list semantics with total size and position on each row, and the open page's row always rendered; verify `Sidebar.test.tsx` cases assert the position and size attributes on the first, middle, and last rendered rows and that the active row is present when it is outside the computed range.
- [x] 3.4 Re-check what windowing can break — calendar month change, accordion toggles, pinned reordering, folder switch, and the sidebar's single scroll region — and verify each with a focused test where it is cheap and by hand in task 4.1 where it needs layout.

## 4. Measure

- [x] 4.1 Re-run the `add-page-history` harness (production build, 10,000-page OPFS vault, Chromium via `playwright-cli`, CDP profile) and record the Pages listing's mount cost and per-navigation render before and after windowing, plus the scroll extent and end-of-list behaviour; verify the numbers are written into `design.md`.
- [x] 4.2 Profile the trail's own cost — a Back/Forward step, including the suppression path — and record that a step does not re-render the editor or rebuild anything vault-sized; verify the numbers (or the profile) are written into `design.md`.

## 5. Finish

- [x] 5.1 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify no warnings and no formatting diff.
- [x] 5.2 Run `npm run build` and `npm test`; verify the whole suite passes with the new log, control-row, and windowing tests included.
- [x] 5.3 Add the change as numbered task 23 in `PLAN.md` and delete the "Sidebar mount cost at vault scale" Later-ideas bullet, since this change is the work that bullet was waiting for; verify both edits read correctly against task 22, which is the section this change removes.
- [x] 5.4 Confirm no ADR is needed (no vault state, no persistence, no security or cross-ADR boundary) and note the confirmation in the change summary.
