# Tasks

## 1. The crumb is a control for a journal day

- [x] 1.1 In `StatusBar`, offer the file-name crumb as a button for a journal day as well as a page, with its own prop for the day's locate and an accessible name that names the day (the long date the calendar cell carries) and the action, e.g. `Show October 21, 2026 in the Journal calendar`. Keep the page crumb's name and every board/asset/nothing-open crumb as inert text. Verify `StatusBar.test.tsx`: a journal path renders a control named for the day, activating it reports the locate, and a board, an asset, and no open item keep text.
- [x] 1.2 In `App`, make the crumb's predicate "the open item is a page or a journal day" and give the journal case its own handler, so the page reveal's contracts are untouched. Verify the `App.integration.test.tsx` reveal cases still pass, including a board's crumb staying inert.

## 2. The locate reaches the calendar

- [x] 2.1 In `JournalCalendar`, accept a locate request (the day's date plus a counter so a repeat activation acts again) and, on a new request, move the shown month to that day, scroll its cell into view, and focus it; give each day cell a `data-date` attribute so the focus is one query. Verify `JournalCalendar.integration.test.tsx`: after browsing to another month, a request for the open day re-anchors the grid, and keyboard focus is on that day's cell; an unrelated re-render with the same request does not move focus.
- [x] 2.2 In `Sidebar`, open the Journal section when it is collapsed and forward the request to the calendar on the following render, so the section is open before anything inside it takes focus. Verify `Sidebar.integration.test.tsx`: a locate request against a collapsed Journal section opens it and lands focus on the day.
- [x] 2.3 In `App`, turn `pendingReveal` into a pending locate that names the open item, so a journal day waits for the left navigation the way a page reveal does, and dispatch to the day's locate once the pane is unfolded or the compact navigation view is shown. Verify `App.integration.test.tsx`: activating the crumb on a folded left navigation and on the compact shell unfolds/shows the navigation and focuses the day's cell, and on the wide shell it leaves the open day, its draft, the trail, and the vault untouched.

## 3. Docs, e2e, and version

- [x] 3.1 Add a note to the status bar's `StatusBar` header comment and to the README's status-bar line: a journal day's name locates the day in the Journal calendar, the way a page's name reveals its row. Verify both read correctly and DESIGN.md needs no change (the crumb reuses the existing reveal styling and the global focus outline).
- [x] 3.2 Add an e2e to `tests/e2e/navigation.spec.ts` that opens a journal day, browses the calendar to another month, activates the status bar's file-name crumb, and asserts the day's month is shown and the day's cell has focus. Verify the spec passes on a dev server started with `npm run dev:test`, then sweep with `npm run kill:dev`.
- [x] 3.3 Bump `version` in `package.json` (minor) and verify the status bar's version badge reads the new build.

## 4. Integration verification

- [x] 4.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, `npm run fmt:check`, and `npm run build`; verify all green.
- [x] 4.2 Run the whole e2e suite; verify all green and sweep left-over dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review, syncing the renamed and modified workspace requirement into the main spec.
