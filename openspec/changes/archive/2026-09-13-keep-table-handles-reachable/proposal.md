## Why

A page whose first block is a table has a column handle nobody can press.

The table block's node view places that handle above the table's first row, and the editor pane is a scroll container, so a handle drawn above the pane's top edge is clipped there. The document's top padding is 4px, and the handle is 18px tall, so for a table that begins a page the handle lands entirely outside the pane. Measured: pane top 64, handle 50–68, and `elementFromPoint` at the handle's centre returned the app header rather than the handle.

The consequence is the whole column control set — select, align, delete, drag — unreachable by pointer on such a page, and no scrolling helps, because the table is already as low as the pane can show it. A table inserted at the top of a new page is the ordinary way to start one, so this is not a corner case.

## What Changes

- A table that begins a page carries a 16px top margin, so its first row sits far enough below the pane's edge for the handle to be drawn inside the pane. 16px is the smallest step on the 4px grid that fits an 18px handle with room to spare.
- The column handle of such a table is inside the pane, pressable, and does what it always did: the column selects, the alignment and delete controls open, and the column can be dragged.
- Nothing else moves. The shared start line is unchanged for every other first block, the pane's padding is unchanged, and a table that is not the page's first block is untouched. The line-number gutter still puts the block's number on the table's first line.
- `DESIGN.md`'s Tables section records why this one block type carries a margin where every other first block has its margin zeroed.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: **added** `A table that begins a page keeps room for its controls` (what the room is for, that the handle is then pressable, that nothing else moves, and that the extra space is not content). **Modified** `The space below the last block belongs to the page`, whose "the first block's start line SHALL be unaffected" is now true for every first block except a table, with its five scenarios intact.

## Impact

- `src/components/EditorPane.module.css`: the leading table's margin, beside the rule that zeroes the first block's margin.
- `DESIGN.md`: the Tables section, on why this block keeps a margin.
- `src/editor/milkdown.test.ts`: the DOM shape the selector depends on.
- No dependency, schema, parser, serializer, storage, index, or search change, and nothing on the keystroke path: a stylesheet rule.

## Non-goals

- **No change to the handle's placement.** The component computes it, and Folio does not reach into that (ADR-0008, ADR-0017). This change gives the handle room instead of moving it.
- **No fix for a table scrolled to the pane's top edge.** A table further down a page can also be scrolled until its first row sits at the pane's top, and its handle is clipped while it is there. Scrolling a little brings it back, so the user has a way out, unlike the page-start case this change fixes. Clamping the handle in Folio would cover it and is the open alternative; it means writing to the component's inline placement on every pointer move.
- **No chords for aligning and deleting.** The table's structural work has chords (add row, add column); alignment and deletion do not. Adding them would make every column operation reachable from the keyboard, which is worth doing on its own terms, and it is not this fix.
- **No change to any other block's start line**, to the pane's padding, or to the shared start line with the outboard columns.
