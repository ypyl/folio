# Tasks

## 1. Search layer: the window walk

- [x] 1.1 Change `snippetSegments` to return one entry per window (`{ from, to, segments }`) instead of one segment run, keeping the existing hit/non-hit splitting inside each window. Verify: the existing `snippetSegments` tests are updated to the new shape and pass; a single-match page yields one window whose segments match today's output.
- [x] 1.2 Collect line starts once per call and index into them, so no window does its own `text.slice(...).split('\n')` or line `reduce`. Verify: a unit test over a text with several windows, and no full-text scan per window in the implementation.
- [x] 1.3 Implement the walk: `MERGE_GAP = 4` lines joins a match to the current window, `WINDOW_MAX = 8` lines bounds it, a match already inside the current window is skipped, and a new window starts at `max(previous end + 1, match line - 1)`. Verify: unit tests for the list case (hits on 3, 5, 6, 7 → one window), the sparse case (hits on 3 and 300 → two windows), and the dense walk (hits every line from 3 to 100 → non-overlapping windows).
- [x] 1.4 Guarantee every occurrence lands in exactly one window. Verify: a unit test asserting the windows' hits, unioned, equal the input ranges, and that no two windows overlap.
- [x] 1.5 Keep the title-only path unchanged: no ranges yields the page's opening lines as one window with no hits. Verify: the existing opening-lines test passes unchanged in shape.

## 2. Row rendering

- [x] 2.1 `MatchBody` renders each window as its own block, and when the windows exceed its `limit` renders a trailing `+N more on this page` line with N counting the occurrences in the unshown windows. Verify: component tests for two windows shown, and for five windows with a limit of two showing `+3 more on this page`.
- [x] 2.2 Memoize the window walk in `MatchBody` on `(text, ranges)` identity, so a re-render that changes neither recomputes nothing. Verify: a test that re-rendering with the same `result` object leaves the walk's call count unchanged.
- [x] 2.3 Confirm a snippet never hides an occurrence it covers: no clamp, no truncation of a window's text. Verify: a component test with hits on consecutive lines asserting every one renders highlighted.

## 3. Both surfaces

- [x] 3.1 Add a `limit` prop to `MatchBody`; the dropdown passes 2 and the results view passes 5. Verify: `SearchSpotlight` and `SearchResultsView` suites assert each surface's cap, including the same four-occurrence page showing four snippets in the view and two plus a note in the dropdown.

## 4. Styles

- [x] 4.1 Remove `-webkit-line-clamp` from `.snip`; make each window its own block with a gap between windows and the `+N more` line's type. Verify: a stylesheet test reading `MatchBody.module.css` from disk, in the style of `src/components/locatedBlockFrame.test.ts`, asserting the clamp is gone and the window rule exists.
- [x] 4.2 Add the multi-window row rule to DESIGN.md's Search section, including that a snippet is never clamped in a way that hides a match. Verify: the DESIGN.md text exists and names the clamp rule.

## 5. Records

- [x] 5.1 Bump `version` in `package.json` (minor: a new user-facing capability).
- [x] 5.2 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npx tsc -b`, the full suite, and `npm run build`. Verify: lint exit 0, type-check clean, build clean, and only the pre-existing date-dependent test failures remain.
