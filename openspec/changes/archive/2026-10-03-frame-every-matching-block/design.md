# Design

## Context

A search result carries `ranges`: every exact occurrence of the term in the page's text, as file-absolute character offsets. `searchDocs` collects them all and then keeps only one thing about them — `firstMatchBlock`, the top-level block holding the earliest range — because the mark was a single block. Everything needed to frame the rest is already in the result.

The mark itself is a list of line ranges held by a state field and mapped through document changes (frame-the-located-block), and a table's frame rides on the table widget because a replaced table has no line to frame.

Two callers locate: a search result, which has ranges, and a Contents row, which has a heading's block index.

## Goals / Non-Goals

**Goals:**

- Every block that holds a match is framed, in one gesture.
- The reader still lands on the first match.
- No re-scan, no re-search, and no new per-keystroke cost that scales with the page.

**Non-Goals:**

- Marking the matched word inside a block, or every occurrence of it.
- Capping or ranking the frames, or reporting how many there are.
- Changing what the result rows show.

## Decisions

### D1. The blocks come from the ranges the search already computed

`matchBlocks(text, ranges)` replaces `firstMatchBlock`: it walks the ranges, maps each to its block with the same block-start rule the frames use, and returns the distinct blocks in document order. One pass over the ranges plus one over the block starts, both already in memory. `SearchResult.block` becomes `blocks`, which is empty when the match is only in the title.

Rejected: re-running the search from the editor. It would duplicate the scanner, and the editor is not where search lives (ADR-0010).

### D2. Every frame is the same

The first block is distinguished by the scroll that brings it into view, not by its frame. A lighter frame for the rest, or a different token, would be a second treatment of one concept, which DESIGN.md warns about for links and is no better here.

### D3. No cap

A page whose term appears in twenty blocks frames twenty. The alternative — a cap, or a "and 12 more" — would need a rule for which to drop, and would hide the answer the frames exist to give. A one-letter term frames most of the page; that is what that search found.

### D4. The mark holds a list, and maps it

The highlight field keeps an array of ranges rather than one. A document change maps each range with the same association as before, so every frame stays with the text it marks; a locate replaces the array. Mapping is O(matches) per change, bounded by the matches of the open page rather than by the document, and it allocates nothing per visited item beyond the mapped pair. The per-line decorations are rebuilt only when the array changes, which is a locate.

Rejected: a single range spanning first match to last. It would frame every block between them, including the ones with no match.

### D5. A table is framed when any located range overlaps it

The table field's flag was "the located range overlaps this table" and becomes "any of them does", which is the same comparison in a loop. A table's frame is still its own outline, because a replaced table has no line for the line frame.

### D6. The seam takes a set

`EditorAdapter.highlightBlock(index)` becomes `highlightBlocks(blocks: number[])`, and an empty list clears. The pane passes what `App` holds for the open page, and `App` holds `{ path, blocks, nonce }`. The Contents caller passes one block, which is all a heading is.

### D7. Ranges can be stale, and this is not new

The ranges describe the page as the index last read it. If the page has unsaved edits, the offsets can be off, and with every block framed the error is more visible than it was with one. It is the same class of staleness the single block already had, it is bounded by the draft being edited, and fixing it would mean re-running the match against the draft, which D1 rejects. Recorded rather than solved.

## Risks / Trade-offs

- **A dense page.** A common term frames many blocks and the page can read as striped. It is honest, and the frames are replaced by the next locate, but it is the first thing to look at in a browser.
- **Many ranges on every change.** Mapping is proportional to the matches of the open page. A page with hundreds of matches does that much work per keystroke, which is still far below the cost of re-scanning the text, and the frames themselves are only rebuilt on a locate.
- **One table among many frames.** A table's frame is an outline 6px outside its box, while a text block's is 8px to the sides of its lines. Both read as the same mark, but they are not pixel-identical, and a page with both is worth an eye.
- **Stale ranges.** D7.
