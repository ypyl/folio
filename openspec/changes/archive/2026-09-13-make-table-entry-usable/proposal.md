## Why

A table can be created but not comfortably filled. Two defects, both found by using the app:

- **A click on a cell selects the whole cell.** The component's node view claims the pointer press for any cell the caret is not already in, so ProseMirror never places a caret. The first click selects, a second click places a caret, and typing straight after the first click replaces whatever the cell held (measured: clicking a cell reading `ada` and typing `X` leaves `X`). The table's own documentation says nothing about it, so the gesture reads as a broken cell rather than a selection.
- **An empty cell shows nothing.** A column is only as wide as its widest cell, and a just-inserted table is empty everywhere, so the columns collapsed to their padding (measured: a `|2x3|` table was 24px wide with 12px cells). A floor on the cell width (v0.5.1) fixed the collapse, but the grid still has no vertical rules by design, so a table with no text shows rows of hairlines with no way to tell one column from another or see where typing will land.

Together they are the same problem: a table you have just made is hard to see into and hard to get into, and the first keystroke can destroy existing text.

## What Changes

- Clicking a table cell places the caret in that cell at the point clicked. It never selects the cell, and typing after a click inserts at the caret instead of replacing the cell's contents.
- Clicking a row or column handle still selects that row or column, so the alignment and delete controls keep working exactly as they do now.
- A cell that holds no text shows a faint hairline on its trailing edge, so a table with empty cells shows where its columns are and where a click will land. The hairline is presentation only: it never reaches the file, and it goes away as soon as the cell holds text.
- `DESIGN.md`'s Tables section gains this one exception to "no vertical rules", with the reason: the hairline is a hint for an empty cell, the same kind of device as the empty-page placeholder, not the table's resting style.

Nothing else about tables changes: creation gestures, `Tab`/`Shift-Tab`/`Enter`, the structural chords, the canonical Markdown, and the cell width floor from v0.5.1 all stay as they are.

## Capabilities

### New Capabilities

- None. Both changes are to how an existing capability behaves.

### Modified Capabilities

- `page-editing`: two new requirements. **A click in a table cell places the caret** (where it lands, that it never selects or replaces, and that row and column selection from the handles is unaffected) and **an empty table cell shows a boundary** (what is drawn, when it disappears, and that it is presentation only, never part of the page's Markdown).

## Impact

- `src/editor/tableCellCaret.ts` (new): the ProseMirror plugin that turns the component's cell node-selection into a caret at the click point.
- `src/editor/milkdown.ts`: register it with the table slice.
- `src/components/EditorPane.module.css`: the empty-cell hairline.
- `DESIGN.md`: the Tables section's exception, with its rationale.
- `src/editor/milkdown.test.ts`: the selection behavior and the DOM hook the stylesheet depends on.
- No dependency, schema, parser, serializer, storage, index, or search change. No per-keystroke work is added: the plugin only reacts to a selection-bearing transaction that selects a cell, and the hairline is a stylesheet rule.

## Non-goals

- **No cell selection on click.** Selecting a cell, a row, or a column by clicking a cell is not a feature of this app; rows and columns are selected from their handles, and that stays the only way.
- **No change to what a table looks like once it has text.** The hairline is scoped to cells that hold nothing, so a filled table keeps DESIGN.md's editorial look (row rules only).
- **No new Markdown.** The boundary is paint; the file, the clipboard, and the index keep exactly the characters they had.
- **No change to the size gesture, the chords, the canonical forms, or the escaping behavior of literal pipe text.** The last one is a known open question from `add-table-editing`, not a part of this change.
