## 1. Search core: uncapped results

- [x] 1.1 Refactor `src/search/core.ts` so `searchDocs` returns the full relevance-sorted match list without per-group capping, and move `PER_GROUP` slicing into a caller helper (e.g. `topPerGroup`); update `core.test.ts` to cover the uncapped list and the per-group slice
- [x] 1.2 Verify `npm test` passes with the refactored search core, keeping existing matcher behavior (AND terms, exact ranges, snippet segments) byte-for-byte

## 2. Dropdown: see-all row

- [x] 2.1 In `SearchBox.tsx`, replace the passive "Showing up to 20 matches per section." note with a pinned see-all row ("See all N results" where N is the total match count) shown whenever a query has matches; keep per-group capping via the new slice helper
- [x] 2.2 Invoke an `onSeeAll` callback prop when the row is activated (click or Enter); update SearchBox tests: replace the note assertion with the see-all row, add cases for "row present when query matches" and "row returns after a result was opened"

## 3. Pane mode and shared query state

- [x] 3.1 In `App.tsx`, add a content mode (page vs results) at the main-pane slot plus lifted query/result state shared with `SearchBox`; verify a query run feeds both the dropdown (top N per group) and the results view (full list) from the same `searchDocs` call
- [x] 3.2 In `App.tsx`, wire `openPath` so opening a result from either surface switches to page mode for that path (reusing the calendar's blank-day materialization for journal results); verify navigation parity with the dropdown and sidebar

## 4. Search results view

- [x] 4.1 Create `SearchResultsView` component (main pane): Pages then Journal groups with sticky headers, labels (pretty dates for journal), match snippets with highlights, count summary and range line
- [x] 4.2 Add pagination at 50 rows/page (Previous/Next, page numbers, range line; hidden when the set fits one page; scroll resets on page change) using DESIGN.md tokens and the project's CSS conventions
- [x] 4.3 Add keyboard handling (arrows move active row within the page, Enter opens, Escape closes back to the previously open page) and zero-match handling (close the view, show the dropdown empty state)

## 5. Tests and polish

- [x] 5.1 Add component tests for `SearchResultsView`: uncapped listing beyond the dropdown cap, pagination on a >50 match set, opening a result (incl. uncreated journal day), Escape return, query-edit re-run, and transient behavior (no vault writes)
- [x] 5.2 Verify integration in `App.test`/related tests: pane-mode switch, return-to-results via the dropdown see-all row, meta panel empty in results mode
- [x] 5.3 Run `npm run lint`, `npm test`, and `npm run build`; fix any failures

## 6. ADR note and spec sync

- [x] 6.1 Add a consequences note to ADR-0005 (the main pane can host a transient, non-file search results mode, per this change) and commit it with the implementation
- [x] 6.2 Run `openspec validate --change search-results-view` and confirm zero validation errors before archiving