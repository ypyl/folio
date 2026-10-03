# Design

## Context

Opening a search result, or activating a Contents row, calls the editor's `highlightBlock(index)`. Today that resolves the block's start line, drops a `Decoration.line` class on it, scrolls the line to the centre, and clears the mark on a two-second timer or on the next document change.

Three facts shape this change.

- The token is the problem. `--brand-tint` (`#EEF2F7`) is DESIGN.md's lightest fill, defined for a chip that must recede, and the stylesheet's keyframes animate it from there to transparent. So the mark is faint when it appears and invisible when the reader arrives.
- A line is not a block. `blockStartLines` gives a block's start, and a block can span many lines: a wrapped paragraph is one line box with many rows, and a list is one block of many lines. `Decoration.line` therefore paints a column-wide band that happens to start where the block starts.
- The mark must not reflow. The requirement forbids moving or reflowing the page's text, and a CSS `border` on a line narrows that line's content box, which re-wraps a long line.

Both callers are in the specs: page-editing owns the requirement, the search capability names it for result clicks, and page-contents defers to "the editor's existing block-locate highlight".

## Goals / Non-Goals

**Goals:**

- A located block is unmistakable at a glance and stays that way.
- The extent is the block, not its first line.
- Drawing the mark changes no text position, no wrapping, and no file.
- The cost is nothing on the typing path.

**Non-Goals:**

- Marking the matched word inside the block, or every occurrence of it.
- Moving the caret or the selection to the match.
- Revealing source that a construct hides (an image reference, a link destination, a table's rows), because the frame always lands whether or not the match's own text is rendered.
- Changing the result rows, the ranking, or what activating a link opens.

## Decisions

### D1. The mark is a frame around the block's extent

The frame encloses the block's lines: its sides on every line, its top on the first, its bottom on the last, and radius on the corners. The extent comes from the block-start rule the search and the Contents panel already share, as start-line through the line before the next anchor, minus trailing blank lines. A pure helper beside `blockStartLines` in `src/lineAnchors.ts` keeps one rule in one place.

A frame says "this block" in a way a band cannot: it has visible edges, so a reader sees where the region begins and ends even when the block wraps onto many rows. It is also the shape the requirement's word "mark" reads as once the mark is not a fill.

Rejected: continuing to mark only the first line, because a wrapped paragraph's first row is not what the reader searched for. Rejected: capping the extent for tall blocks (a thirty-item list), because an extent that changes with the block's shape is its own kind of noise, and the scroll already lands at the frame's top.

### D2. Drawn without layout

`border` is out: it grows the line's box, moving text and re-wrapping long lines. `outline` is out: applied per line it draws one closed box per line, which reads as a stack of stacked boxes rather than one frame. The frame is drawn with inset `box-shadow`, which occupies no layout:

```
  first line    inset 0 1px 0   (top)   + inset 1px 0 0 (left)
                + inset -1px 0 0 (right)
  middle lines  inset 1px 0 0 and inset -1px 0 0            (sides only)
  last line     the sides + inset 0 -1px 0 (bottom)
  every line    the sides and the radius offset on the two end lines
```

Adjacent lines are contiguous in CodeMirror, so the sides join into one continuous edge. `box-shadow` insets take the same tokens as a border, so DESIGN.md's rule about solid colours and named tokens holds.

### D3. `--brand` at 1px

A frame is the "you are here" mark, and the app's strongest ink for that is `--brand`. Considered and rejected: keeping the `--brand-tint` fill without the fade, which is consistent with how the sidebar marks the open page, but a fill inside body text recolours the prose and, at that token's lightness, remains a whisper. Rejected: `--border`, because that is the table grid's and the divider's colour, and a located block would read as structure. 1px keeps it a region rather than a control; if it reads as a control in the browser, the token is a one-line change.

### D4. Nothing clears it but a later locate

The two-second timer goes, and with it `HIGHLIGHT_MS` and the stylesheet's keyframes. A later location request replaces the frame, so there is at most one, and a page opened without a locate is unmarked. This is the whole clearing rule.

Rejected: clearing on the next document change, which was the old rule and is the same disappointment as the fade, one step later. Rejected: an explicit dismissal gesture, which needs a rule for what counts as one and adds a gesture to a mark that exists to be found.

### D5. It survives edits by mapping, not by re-deriving

The frame is held as a line range and mapped through document changes (`DecorationSet.map` / a mapped position pair), so it stays with the text it marks. It is not re-derived from the block index: an index names the n-th block of the current text, which an edit above the block invalidates, and re-deriving it means re-reading the document on every keystroke, which the typing budget forbids. Mapping a two-position range is O(1).

Accepted consequence: a large edit inside the frame, such as splitting a paragraph or pasting a document into it, leaves the frame covering what the change grew or split it into. The requirement says the frame stays with the text it marks, which is exactly this behaviour.

### D6. It belongs to the page, not to the visit

`App` holds `{ path, block, nonce }` and passes a highlight to the pane only when the open page is that path. A navigation naming no block stops clearing the state, so leaving the located page and returning, including through Back and Forward, finds the frame still there. A new locate on another page replaces the stored one, so only one page is ever framed.

Rejected: clearing on navigation, which is today's behaviour and contradicts "nothing clears it but a later locate".

### D7. No caret move, no reveal, no word mark

The frame always lands, because a block's lines exist whatever its constructs hide, so the mark does not need the caret or a reveal to be visible. Moving the caret would also fire the inline reveal rules, showing a link's destination or a whole table's source on open, which is a different change. A word mark inside the frame was considered and dropped: it cannot reach a link destination, an image reference, or a table cell, so it would mark the easy cases and silently skip the hard ones.

### D8. The Contents panel and its wording

Contents keeps the same mark: its requirement already says it marks the heading "with the editor's existing block-locate highlight, exactly as opening a search result locates a match", which stays true. Its word "highlight" is now loose for a frame; left alone deliberately, because the requirement defers to page-editing rather than restating the mark's shape, and editing it would be churn.

### D9. The requirement is replaced under a new name

Two of the old requirement's scenarios — "The mark fades" and "An edit clears the mark" — are false by construction, and a MODIFIED requirement must keep every scenario name it had. So the requirement is removed and its replacement added, which needs its own name: "The editor frames the located block". The tooling refuses a requirement present in both ADDED and REMOVED, so the name cannot be reused, and because the search capability names the old requirement, the search delta comes with this change. The alternative was a MODIFIED requirement carrying a scenario whose name contradicts its own body, which is worse than one extra delta.

### D10. DESIGN.md and the stale pointer

DESIGN.md's Search match section is the styling authority for this mark, so it is rewritten: a persistent 1px `--brand` frame around the located block, drawn without layout. Its sentence naming `HIGHLIGHT_MS` in `src/editor/searchHighlight.ts` is fixed at the same time, as is the same stale pointer in the stylesheet's comment: that file was deleted when the page surface became the Markdown text.

## Risks / Trade-offs

- **A block that renders as a widget.** A table renders as a block widget, and an image on its own line sits in a line box. The frame wraps that line box, which should read as a box around the table or the image, but it has not been seen.
- **Deferred visual pass.** Three judgements need a browser and were deliberately not made here, because the app opens folders through a native picker no automated browser can drive: whether the frame's sides join without a seam across a wrapped paragraph, whether a table's or an image's line box looks right inside the frame, and whether 1px `--brand` reads as a region rather than a control beside a blockquote's left bar. The mechanics are asserted where they can be (`src/components/locatedBlockFrame.test.ts` reads the stylesheet and refuses a layout-affecting property); the rest is one token or one thickness away from a fix.
- **`--brand` on four sides.** It may read as a focused control rather than a region. 1px is the hedge; the token is trivially changed if it does.
- **The edges are the line's, not the text's ink.** An indented list's frame will include the indent, and a table's frame will sit at the column edge. That is correct for "this block" and wrong for "this text", which is the trade a block frame makes.
- **A block taller than the viewport.** The frame extends past the screen. The scroll lands at its top, so the reader sees the frame's first edge and knows the region continues.
- **A frame in the document body is a new idiom.** Blockquotes already use a left bar, and tables use `--border` grids. If the located frame collides visually with either, the fix is the token or the thickness, not the shape.
- **Cost.** Mapping a two-position range per change is O(1), no text is re-read, and nothing changes on the typing path. The one measurable risk is that a mark that persists is a mark that must be right, because the reader may trust it across edits.
