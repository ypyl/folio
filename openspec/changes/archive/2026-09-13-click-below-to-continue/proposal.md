## Why

A page is continued by clicking at its end and typing, and today the only place that works is inside the text: the editor's surface is as tall as its content (`min-height: 8em`), so the empty space below the last block is pane background, and clicking it does nothing. Writing a note means aiming at the tail of the last line every time, and on a short line — a heading, a `- item`, a lone reference — that is a narrow target. The space a user reads as "the rest of the page" should belong to the page.

## What Changes

- The editable surface fills the editor pane's height, so a click anywhere in the empty space below the last block places the caret at the end of the document and the next keystroke continues the page there.
- The document's geometry that users know stays put: the first block's start line, the readable column width, the line-number gutter, and the empty-page placeholder are unchanged. The surface grows downward only.
- Nothing is added to the document or the file: the caret moves, no block is created, and the Markdown is untouched until the user types.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: "The space below the last block belongs to the page" — new requirement covering the editable surface's height, the click-to-continue gesture it enables, and the geometry that must not move with it.

## Impact

- `src/components/EditorPane.module.css` only: the document wrapper fills the pane and the editor host and ProseMirror surface grow with it. No component, prop, seam, or storage change.
- No cost on the typing path: this is stylesheet geometry, no per-keystroke work and no new measurement. The existing resize observer re-measures the gutter as it does now.
- Non-goals: no click-to-insert-a-block (the click places the caret; it does not append an empty block), no change to the pane's padding or the document's start line, no change to drop, paste, or reference activation, and no new control anywhere.
