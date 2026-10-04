# Design

## Context

`snippetSegments(text, ranges)` (`src/search/core.ts`) is a pure function that both search surfaces share through `MatchBody`. Today it merges `ranges`, takes the **first** merged range, computes the line it sits on, takes a window of ±2 lines around that line, and splits that one window into hit/non-hit segments. `ranges` already holds every exact occurrence in the page (`exactRanges`), uncapped, and `blocks` already names every top-level block holding one (frame-every-matching-block). Nothing upstream discards occurrences; the snippet function picks the first and stops.

Two constraints shape everything below. The row is a `<button>`, so nothing inside it may be interactive. And `.snip` carries `-webkit-line-clamp: 3`, which clamps from the top.

## Goals / Non-Goals

**Goals:**

- Every place the query occurs in a page is visible in that page's row, on both surfaces, without opening the page.
- A row stays one result. Counts, grouping, ranking, and paging do not move.
- A snippet never hides an occurrence it covers.
- The per-render cost stays linear in the page text plus the occurrences shown, not their product.

**Non-Goals:**

- One row per occurrence.
- Touching `searchDocs`, ranking, `matchBlocks`, or the locate/frame path.
- Reading any file (assets, boards).
- A line-number badge.

## Decisions

### D1 — Both surfaces, with different snippet budgets

The two surfaces answer different questions. The dropdown is a launcher (≤20 rows per group, keyboard-driven, closes on select); the results view is the survey surface (50 rows per page, a pager). Both render `MatchBody`, so the behavior lands in both by default; the difference is a cap.

- Dropdown: **2** snippets per row.
- Results view: **5** snippets per row.

Chosen over "popup only" (would leave the survey surface the one place that does *not* show every place, inverting its purpose) and over one shared cap (either makes the launcher tall or the survey surface shallow). The `MatchBody` component already takes a `compact` prop for exactly this kind of per-surface difference; a `limit` prop joins it.

### D2 — The unit is the occurrence, grouped into bounded windows

A window is a run of nearby matches:

1. Walk the merged ranges in document order.
2. A match already inside the current window is covered; skip it.
3. A match within `MERGE_GAP = 4` lines of the current window's end joins it, unless that would push the window past `WINDOW_MAX = 8` lines.
4. Otherwise close the current window and open a new one, starting at `max(previous window end + 1, match line - 1)`.

Each window carries one line of context on each side of the matches it covers. The algorithm guarantees every occurrence is inside exactly one window and no two windows overlap.

Worked examples (lines are markdown source lines):

```
hits on 3, 5, 6, 7                     hits on 3 and 300
  3 -> window [2,4]                      3   -> [2,4]
  5 -> within gap, joins                300 -> far, not covered
  6 -> [2,7]                                  -> close [2,4]
  7 -> [2,8]                                  -> open [299,301]
  => one window, 4 hits highlighted      => two windows, no repeat

hits on every line from 3 to 100
  [2,9] [10,17] [18,25] ...   forward walk, no overlap, every hit covered
```

Alternatives considered:

- **One window per matching block** (1:1 with the frames). Dies on the big block: a fenced code block with a match on line 40 is one block, and a window anchored on the block's first line shows none of it.
- **One window per occurrence, unmerged.** In a list, ±2 windows around adjacent lines overlap almost completely; with a cap of 2 you see two 80%-identical snippets, which reads as a bug.
- **Merge first→last match.** A page with matches on lines 3 and 300 becomes one 300-line excerpt.

`WINDOW_MAX = 8` bounds a window; `MERGE_GAP = 4` is what "nearby" means. Both are constants next to `PER_GROUP` and `RESULTS_PER_PAGE`.

### D3 — The row clamp comes off; the cap bounds height

`.snip`'s `-webkit-line-clamp: 3` clamps from the top. A window is anchored on its matches, so a window with two hits has the second on line 4 and a 3-line clamp eats it — the exact failure this change exists to fix. So the clamp is removed and the snippet cap (D1) bounds row height instead: 2 windows of at most 8 lines in the dropdown.

Each window becomes its own block with the label's type scale and a gap between windows, so two windows do not read as one run of text.

### D4 — The remainder is a plain text line counting occurrences

A capped row ends with `+N more on this page`, where N is the number of **occurrences** not shown, not the number of hidden windows. It is plain text, not a control, because the row is already a button. Occurrences is the more informative number and pairs with any future count in the label.

### D5 — `snippetSegments` returns windows, not one segment run

The function's contract changes from `Segment[]` (one window) to one entry per window, each carrying its segments and its line span:

```
type SnippetWindow = { from: number; to: number; segments: Segment[] }
snippetSegments(text, ranges): SnippetWindow[]
```

`MatchBody` renders the first `limit` windows and the `+N more` line. Everything about how a window is split into hit/non-hit segments is unchanged, so a single-match page renders exactly as today apart from one line less of context.

### D6 — One line-offset pass, not one per window

Today the function does `text.slice(0, offset).split('\n')` and a `reduce` over lines per snippet, which is `O(text)` per row. Doing that per window would make a row `O(windows × text)`. The walk collects line starts once per call and indexes into that array, so a row is `O(text + occurrences)`. This matters more than it looks: `MatchBody` is not memoized, and the list re-renders on every `mouseEnter` (it moves the active row), so every visible row re-slices its text on every mouse move across the list. The window walk should be memoized in `MatchBody` on `(text, ranges)` identity as part of this change.

## Risks / Trade-offs

- **[Rows get taller, so the dropdown shows fewer results at once]** → Accepted and deliberate; that is what "show every place" costs. Bounded by D1's cap of 2 and `WINDOW_MAX`. If it reads too tall in the browser, the lever is `WINDOW_MAX` (8 → 6), one constant, no redesign.
- **[The popup's snippets are no longer 1:1 with the blocks the page frames]** → Accepted. A block with two far-apart matches gets one frame and two snippets. The frame answers "which region of the page"; the snippet answers "where are the words". Forcing them equal is what killed the per-block window.
- **[Dense pages produce many short windows]** → Accepted, and honest: the page does mention the term that many times. The `+N more` note keeps the row bounded and says so.
- **[A page with many occurrences shows a window per run, so the popup row can still be 16 lines]** → Accepted at the cap of 2; the `WINDOW_MAX` lever applies.
- **[Ranges describe the indexed text, not the draft]** → Unchanged from today and not solved here. A page with unsaved edits can put a snippet slightly off, exactly as the located-block frame can.
- **[`MatchBody` now computes more per render]** → Mitigated by D6's memoization; the visible-row count is what bounds it, not the vault size.
