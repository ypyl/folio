## Context

See `proposal.md` for why. Facts that shape the approach:

- The pane is `main.pane` (`overflow-y: auto`, a grid item that fills the workspace's row), holding `article.document` (`padding: 4px 32px 4px`, `position: relative` for the gutter), which holds the gutter (`position: absolute`, `pointer-events: none`) and the editor host `div.editor`, which holds ProseMirror's contenteditable.
- `.editor :global(.ProseMirror)` is `min-height: 8em` and otherwise content-height, so everything below the content is `article`/`main` background: a click there never reaches the document.
- ProseMirror already resolves a click below its content correctly — `posAtCoords` returns the nearest text position, which for a point past the last line is the document's end — so the caret placement this needs is the editor's own behavior, not something to implement.
- The gutter pass measures `.ProseMirror > *` blocks against the gutter host's top, and the document's first block carries a `margin-top: 0` reset so headings do not push the first line below the outboard columns' start line. Both are position-dependent and must survive the surface growing.
- The empty page's hint is a `::before` on the document's first paragraph, gated by `[data-empty]`, floated with `height: 0` so it stays out of layout.

## Goals / Non-Goals

**Goals:**

- The whole empty area below a page's content is part of the document: a click there puts the caret at the end, and the user can type.
- Nothing that users perceive as the document's position or width moves.
- No JavaScript, no seam change, no per-keystroke cost.

**Non-Goals:**

- No pane-level click handler and no new `EditorAdapter` method: the caret placement is already the editor's own behavior, and the surface is the only thing standing in its way.
- No document or Markdown change: no filler block, no empty paragraph appended by clicking.
- No change to the pane's padding, the readable column width, the gutter, the placeholder, drag-and-drop, paste, or reference activation.
- No "add a block here" affordance: the click places the caret, which is what typing then uses.

## Decisions

### D1 The surface fills the pane by stylesheet geometry

`article.document` becomes a flex column that is at least the pane's height (`min-height: 100%`), the editor host grows into the remaining space (`flex: 1`), and ProseMirror's own box grows with it (`flex: 1`, keeping `min-height: 8em` as the floor). The click target therefore reaches the pane's bottom edge, and the click lands inside the editable surface, where ProseMirror resolves it to the document's end.

Rejected: a click handler on the pane that asks the editor to move the caret to the end. It needs a new method on the `EditorAdapter` seam (a new contract with its own spec and tests) to do what the editor already does when the click reaches it, and it would have to reproduce the editor's own idea of "the end" (last text block vs last node) slightly differently.

Rejected: appending an empty block to the document on click. It writes to the file (an empty paragraph in the Markdown) for a gesture that only meant to continue typing, and it conflicts with the document-tail rule, which already maintains a paragraph only after a trailing code block.

Rejected: growing the pane's padding rather than the editable surface. Padding on the article is outside the editable surface, so clicks there would still miss the document.

### D2 What must not move, and how it is kept

- The first block's start line: the article keeps its `4px` top padding and the `margin-top: 0` reset on the first child, and the surface's growth is `flex: 1` (downward), never a top inset.
- The readable column: the article keeps its `32px` side padding; the editor host and ProseMirror are full-width children, so the prose box is unchanged.
- The gutter: it stays absolutely positioned in the article, and the numbers are placed from measured block positions, so a taller surface changes no number.
- The placeholder: the `::before` still sits on the first paragraph of the empty document, which is still at the top of the surface.

The tasks verify these by measuring the first block's top, the gutter numbers, and the prose box before and after, rather than by trusting the stylesheet.

### D3 Cost

None on the typing path: the change is four declarations in one stylesheet, with no JavaScript, no new per-transaction work, and no new measurement. The resize observer's gutter pass already runs when the pane resizes, which is when this geometry can change.

## Risks / Trade-offs

- [A tall editable surface means a click far below the text still moves the caret] → That is the requested behavior: the space below the last block reads as the page's own.
- [Dragging a selection from below the content selects to the end] → ProseMirror's own behavior for a drag that starts inside its surface, and a natural extension of the same gesture.
- [The pane's scrollbar could change if the surface adds height above the content] → It cannot: the growth is `flex: 1` below the content, and a document taller than the pane keeps its own height (min-height only raises a short document to the pane's height).
- [An empty page's placeholder moves if the surface's growth changes the first paragraph's position] → It does not: the paragraph stays the surface's first child at its top; the empty page's box was already taller than the pane.

## Migration Plan

None. Stylesheet geometry only, no persisted state.
