# Proposal

## Why

A search result row shows one snippet: a window around the **first** occurrence of the query in that page. The search already knows every occurrence (`SearchResult.ranges` collects all of them, uncapped) and every top-level block holding one (`SearchResult.blocks`, from frame-every-matching-block). The row shows the first and says nothing about the rest, so a reader asking "where else does this page say it?" gets one answer and no hint that others exist. The page is where that question is answered, and the row is the only place to see it before committing to open the page.

## What Changes

- A result row shows a snippet for **every** place the query occurs in the page, not only the first.
- Occurrences are grouped into **windows**: a window is a run of nearby matches, anchored on the matches themselves, with one line of context each side, bounded so a dense page does not collapse into one enormous excerpt.
- Each surface caps how many windows a row shows — the dropdown **2**, the results view **5** — and notes the remainder with a `+N more on this page` line, where N counts the occurrences not shown.
- The row's `-webkit-line-clamp: 3` is **removed**. A top clamp would cut the hits out of a window that holds more than one, which is the failure this change exists to fix; height is bounded by the window cap instead.
- Rows stay **one per page**. "N matches", the per-group cap, the see-all count, and paging keep counting pages, not occurrences.
- A page with a single match renders as it does today, one line shorter (context narrows from two lines to one).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `search`: "Results are grouped by kind with labels and match snippets" — a row's snippet is no longer a single window around the first match, but every place the query occurs, capped per surface and noted when capped.
- `search`: "Search results view shows the full match set" — the view's rows carry the same multi-window snippets, with its own cap.

## Non-goals

- **Not one row per occurrence.** The page does not repeat down the list; the row stays one result and its count keeps counting pages. (This is the Logseq-style block-per-result design, deliberately not chosen.)
- **Not touching ranking, grouping, paging, or counts.** The match set is computed exactly as it is today.
- **Not changing what opening a result does.** It still scrolls to the first match's block and frames every matching block; the windows are the row's view of the matches, and the frames are the page's. They may differ in count.
- **Not reading any file.** Assets and boards keep their label-only rows; a title-only match keeps its opening-lines snippet.
- **Not reintroducing a line-number badge** on result rows.
- **Not changing the editor, the vault, or any file on disk.** This is presentation over the index the app already holds.

## Impact

- `src/search/core.ts` — `snippetSegments` returns windows instead of one segment run; the merge walk is new.
- `src/components/MatchBody.tsx` — renders a row's windows and the `+N more on this page` line.
- `src/components/MatchBody.module.css` — the clamp moves off `.snip`; each window is its own block.
- `src/components/SearchSpotlight.tsx` / `SearchResultsView.tsx` — pass their window cap.
- `DESIGN.md` — the multi-window row rule.
- Tests: `src/search/core.test.ts` (the walk and the cap), `MatchBody` and both surfaces.
- No new dependency, no ADR change, no vault write. Relates to ADR-0001/0009 (derived data only), ADR-0022 (a file's bytes are never read), ADR-0006 (keep it small).
