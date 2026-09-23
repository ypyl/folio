## Why

The editor's line-number rail exists, by its own rationale, so a search result's `· line N` finds a number in the gutter when the page opens. But the number never takes the reader there: opening a result navigates and the pane scrolls to the top, and a long page leaves the reader to hunt for the match themselves. The rail's numbers are otherwise noise. Better to keep the rail only for the fold controls and mark the actual match on the page when a result is opened.

## What Changes

- **Opening a search result locates the match.** Selecting a page or journal result scrolls the matched block into view and marks it with a transient highlight, in both the spotlight dropdown and the full results view. The highlight fades after about two seconds and is cleared at once by the next edit or navigation. It is presentational: the page's Markdown and the file never change.
- **The matched block travels with the result.** A result carries the index of the top-level block holding its first text match, so the editor can find it. A title-only match (or an asset/board) carries none and opens at the top, as today.
- **The line-number rail goes away.** The editor no longer renders line numbers, and search rows no longer show `· line N`. The rail keeps the fold controls and narrows to the control column.
- **No document or storage change.** The highlight is a decoration, not content (ADR-0001, ADR-0009); fold behavior and ADR-0020/ADR-0026 are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: removes the block-line-numbers requirement and the line-number re-glue requirement; adds a requirement that the editor locates and transiently marks a block on request and re-glues the rail's fold controls after a fold; narrows the fold-bounded-work requirement to the controls (no numbers).
- `search`: removes the "search results report the match's line" requirement; changes "selecting a result opens the page" so opening scrolls to and marks the matched block.

## Impact

- `src/search/core.ts`: `SearchResult` gains the matched block index; `firstMatchLine` becomes `firstMatchBlock`.
- `src/components/MatchBody.tsx`: drops the `· line N` label.
- `src/components/SearchResultsView.tsx`, `SearchSpotlight.tsx`: pass the match's block when they open a page.
- `src/App.tsx`: `handleSelect` carries the block and holds the pending highlight for the pane.
- `src/components/EditorPane.tsx`: applies the highlight after content settles and re-measures the rail (no numbers).
- `src/editor/editor.ts`, `milkdown.ts`, `fakeEditor.ts`: `getBlockLines` leaves the seam; a `highlightBlock` method joins it.
- New `src/editor/searchHighlight.ts` (the highlight decoration plugin); `src/editor/gutter.ts` becomes `src/editor/rail.ts` (arrow-only).
- `src/components/EditorPane.module.css`: the rail narrows, the number rule goes, the match mark's wash is added.
- `DESIGN.md`: the line-number entry becomes the rail's fold-control entry, and search matches get a rule.
- No change to `VaultStorage`, the index, references, the serializer, or any saved bytes.
