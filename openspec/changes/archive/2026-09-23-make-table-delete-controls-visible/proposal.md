## Why

Deleting a table row or column works, but only through controls a user cannot find: the row and column handles are invisible until the pointer lands in the right spot, and the delete control sits behind a second press that opens the handle's group. The chords (`Mod-Alt-d`, `Mod-Alt-Shift-d`) exist and are documented, but the pointer path is effectively hidden, so the app reads as unable to delete a table row. The table is one of the few structures the editor owns, and its structural controls should be visible when the user is working in it.

## What Changes

- While the caret is inside a table, the editor shows a small control strip attached to that table with two actions: **Delete row** and **Delete column**. Each acts on the caret's row or column, exactly as the handle's own control and the chords do, and leaves a caret so the next keystroke types.
- The strip appears without the user finding or hovering a handle, so deletion no longer depends on discovering the handle's hidden group. It hides when the caret leaves the table, and the existing row and column handles keep working unchanged.
- No cell deletion. A cell's text is cleared the way any text is; the strip removes rows and columns only, which is what a rectangular table can do.
- No new chord. The keyboard path stays the documented `Mod-Alt-d` and `Mod-Alt-Shift-d` rows in the shortcuts reference (ADR-0016).
- DESIGN.md's Tables section records the strip's look and the rule that a table at rest still carries no toolbar.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: **added** `Deleting a table row or column is reachable without a handle` (the strip shows while the caret is in a table, what each action removes, that it leaves a caret, that it is presentation only, that it is hidden outside a table, that the handles and chords are unchanged, and that showing it costs nothing on the keystroke path).

## Impact

- `src/editor/tableSetup.ts`: export the two commands the strip dispatches (the existing `inTable`-guarded `deleteRow` / `deleteColumn`).
- `src/editor/` (new module): the ProseMirror plugin that tracks the caret's table and mounts/unmounts the strip in that table block's DOM, plus its tests.
- `src/editor/milkdown.ts`: register the plugin alongside the table slice.
- `src/components/EditorPane.module.css` and `DESIGN.md`: the strip's styling and its Tables rule.
- No dependency, schema, parser, serializer, storage, index, or search change. Nothing about a page's Markdown changes; the strip is editor chrome, not content.

## Non-goals

- **No cell deletion.** A cell is not removed from a rectangular table; its text is cleared as ordinary text.
- **No new keyboard binding.** The chords stay as they are; the strip is the pointer path.
- **No change to the row and column handles, their controls, the drag gesture, or the alignment controls.** They keep working exactly as they do now.
- **No toolbar on a table at rest.** A table the caret is not in stays editorial: no box, no chrome.
- **No change to the insert-table, add-row, add-column, or paste paths.**
- **No new architectural decision.** The strip is Folio chrome over the adopted table block (ADR-0017), like the handle clamp; no ADR is added.
