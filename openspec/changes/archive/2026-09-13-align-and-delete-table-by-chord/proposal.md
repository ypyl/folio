## Why

Two table operations exist only on the row and column handles: aligning a column (left, center, right) and deleting the caret's row or column. Every other table action has a chord — insert, add row, add column, move between cells, leave — because the component's controls are pointer-only and the shortcuts reference is the app's keyboard path (ADR-0016).

A keyboard user cannot align or delete at all, and until `keep-table-handles-in-the-pane` a pointer user could not either when a table's first row sat at the pane's top edge. The handles also need a pointer that can reach a small chip; the two operations are the last part of tables that only a mouse can perform.

## What Changes

Five chords, in the table group of the shortcuts reference:

- **Align column left** `Mod-Alt-l`, **Align column center** `Mod-Alt-m`, **Align column right** `Mod-Alt-r` — each aligns the caret's whole column, not the cell the caret is in.
- **Delete row** `Mod-Alt-d` — removes the row the caret is in.
- **Delete column** `Mod-Alt-Shift-d` — removes the column the caret is in.

Each behaves as the handle's own control does, and each leaves a caret rather than a selection, so the next keystroke types instead of replacing the row or column the chord just changed. A chord pressed with the caret outside a table does nothing. The handles and their controls keep working exactly as they do now.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: **added** `Aligning and deleting a table row or column works from the caret` (what each chord acts on, that alignment covers the whole column, that a caret is left behind, that a chord outside a table does nothing, and that the handles are unchanged).
- `ui-shell`: **modified** `The keyboard-shortcuts reference covers table editing`, which now also lists the five rows and says what a row must do when it is activated.

## Impact

- `src/editor/tableSetup.ts`: the five keymap entries and the two commands behind them — alignment through the same select-and-set pair the handle's control uses, deletion through prosemirror-tables' own row and column removal.
- `src/components/shortcuts.ts`: the five rows, which are also their dispatch entries.
- `src/editor/milkdown.test.ts` and `src/components/shortcuts.test.ts`: the behavior and the drift guard.
- No dependency, schema, parser, serializer, storage, index, or search change, and nothing on the keystroke path beyond the five keymap bindings.

## Non-goals

- **No new pointer controls and no change to the handles**, including the drag that reorders a column: that stays a pointer gesture.
- **No toggle and no cycling.** Applying the alignment a column already has reports that the chord did nothing rather than pretending to change it.
- **No command for selecting a row or column by chord.** The chords act on the caret's row or column directly, which is the operation a user wants; selecting one is what the handles do, and a selection is a state to get out of, not an end in itself.
