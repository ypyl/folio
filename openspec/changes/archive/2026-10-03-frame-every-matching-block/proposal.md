# Proposal

## Why

Clicking a search result frames one block: the one holding the first match. The result row already knows every occurrence — `SearchResult.ranges` holds them all — and the page shows none of the others, so a reader asking "where else does this appear?" still has to read the page. The page is the place that question is answered, and the frames cost nothing to draw: the ranges are already computed, and no text is re-scanned.

## What Changes

- A locate carries the set of top-level blocks that hold a match, and every one of them is framed. The first match's block is still the one scrolled into view.
- The frames are identical. Nothing distinguishes the first except the scroll that brings it into view, because a second treatment for one concept is how a design drifts.
- No cap. A page whose term appears in twenty blocks shows twenty frames, which is the truth about that page; a term that appears everywhere frames everything.
- The Contents panel still locates a single block, its heading, so the seam takes a set and that caller passes one.
- `SearchResult.block` becomes `blocks`: the search already computes every range and kept only the first one's block.
- The table's frame follows the same rule: a table is framed when any located block's range overlaps it.

Not in scope: the result rows, the ranking, the snippet, and anything about how a match is marked inside a row.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: the locate requirement frames every top-level block that holds a match, not only the first, and names the first as the one scrolled to.
- `search`: its "Selecting a result opens the page" states which blocks the opening frames.

## Impact

- `src/search/core.ts`: `firstMatchBlock` becomes `matchBlocks`, and `SearchResult.block` becomes `blocks`.
- `src/App.tsx`, `src/components/EditorPane.tsx`, `src/editor/editor.ts`: the locate carries a set of blocks rather than one.
- `src/editor/codemirror.ts`: the mark holds a list of ranges, and a table is framed when any of them overlaps it.
- `DESIGN.md`: the Search match rule says every matching block is framed.
- Cost: one mapped range per match on a document change, bounded by the matches of the open page. Nothing is re-scanned, nothing is read from disk, and the frames are rebuilt only when a locate arrives.
