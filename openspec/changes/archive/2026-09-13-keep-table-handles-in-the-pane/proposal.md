## Why

A table's row and column handles are drawn *outside* the table: the component places the column handle above the first row and the row handle to the left of the row. The pane is a scroll container, so its box is a hard clip, and a handle the pane's edge cuts off cannot be pressed.

`keep-table-handles-reachable` gave a table that *begins* a page room for its handle. A table further down the page has the same problem the moment it is scrolled until its first row sits at the pane's top edge: the handle is drawn 18px above the row, that is above the pane's box, and the whole column control set — select, align, delete, drag — is unreachable while the table sits there. Measured: pane top 64, handle 50–68, `elementFromPoint` at the handle's centre = the app header. Scrolling a little brings the handle back, so the user has a way out, but nothing in the app explains that.

## What Changes

- Whenever the editor places a table's row or column handle, and whenever the pane scrolls, a handle that is outside the pane's visible box is nudged inside it, with a 2px margin. The handle then does what it always did: pressing it selects that row or column and opens its controls.
- A handle that already fits is not moved at all, so a table with room around it looks exactly as it does today.
- Only the row and column chips are nudged. The line handles that appear while a row or column is being dragged are left where the component puts them: a drag follows the pointer, and moving its indicator could misalign the drop.
- ADR-0017 gains a line recording this as the one place Folio adjusts what the component owns.

Nothing about a page's Markdown changes, and nothing about it is content: the nudge is a position written to a control that is already there.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: **added** `A table's handles stay inside the pane` (when a handle is brought inside, that a fitting handle is not moved, that scrolling keeps it inside, that it keeps its meaning, and that a handle's position is not page content).

## Impact

- `src/editor/tableHandleClamp.ts` (new): the pure nudge geometry plus the DOM pass that uses it — a mutation observer on the handles' inline placement and a scroll listener on the pane.
- `src/editor/tableHandleClamp.test.ts` (new): the geometry, unit-tested without a browser.
- `src/editor/milkdown.ts`: the adapter wires the pass on mount and cleans it up on destroy.
- `adr/0017-adopt-gfm-table-slice-and-table-block.md`: the exception noted.
- No dependency, schema, parser, serializer, storage, index, or search change. The work happens on the pointer and scroll paths only, never on typing: a handle's position is written as the pointer moves over a table and when the pane scrolls, and the pass settles in one write.

## Non-goals

- **No change to the component's placement.** Folio adjusts where the handle ends up, not how the component computes it (ADR-0008, ADR-0017).
- **No movable content.** The table is never shifted to make room for a control; the user's scroll position is theirs.
- **No chords here.** Aligning and deleting a row or column still have no keyboard path; that is its own change.
- **No change to the line handles or the drag preview**, and no change to a handle that already fits.
