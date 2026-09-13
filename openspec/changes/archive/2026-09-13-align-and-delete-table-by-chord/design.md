## Context

See `proposal.md` — Why. The facts that shape the approach, measured while building it:

- The component reaches alignment through two registered commands: `selectColCommand` with the column's index, then `setAlignCommand` with the alignment. The commands live in the ctx (`commandsCtx`), so Folio's own keymap can call exactly what the handle's control calls.
- A chord's command must report whether it applied, because `applyChord` (the shortcuts reference's dispatch, ADR-0016) uses that to tell "applied" from "not applicable here". The preset's `selectColCommand` returns `Boolean(dispatch(...))`, and `dispatch` returns void — measured: it selected the column and returned false. Chaining on its result silently skipped the alignment. The alignment command's own result is the one worth returning, and prosemirror-tables' `setCellAttr` returns false when the cell already holds the value, which is the honest answer for a repeat press.
- `setCellAttr` sets the attribute on the *selected* cells, so the column has to be selected for the change to reach all of it; the component's control relies on the handle's selection already being there.
- Table offsets address cells, not the text inside them: `TableMap.findCell` matches exact cell offsets, so the column index comes from the cell around the caret (`cellAround`), the way `selectedRect` does it, not from the caret's own position.
- prosemirror-tables' `deleteRow` and `deleteColumn` read the table around the selection and throw without one (`selectedRect`), so they are guarded by `isInTable`. `deleteRow` also declines when the selection covers every row.
- The reference's rows fit one line at the panel's width (235px measured): the widest new row is "Delete column" with `Ctrl+Alt+Shift+D` (measured at 34px, one line).

## Goals / Non-Goals

**Goals:**

- Every table operation reachable from the keyboard, with the reference showing the chords.
- No change to the handles, and no selection left behind for the user to escape.

**Non-Goals:**

- No toggling or cycling alignments, no chord for selecting a row or column, no pointer changes (see the proposal).

## Decisions

### D1 Chords, not more controls

The operations go on the keyboard because that is the app's pattern for table controls (ADR-0016 and the chords `add-table-editing` added for row and column insertion), because the handles are pointer-only, and because a keyboard user has no path at all to these two operations today.

### D2 The align chord selects the column, then puts the caret back

Alignment lives on cells, so the caret's column is selected through `selectColCommand` and the attribute set on it through `setAlignCommand` — the same pair the handle's control uses, so the two can never drift. The caret is then restored to where it was.

Rejected: **leaving the column selected**. It is the state the handle leaves, but from a chord it means the next keystroke replaces the column's contents, which is the same trap a click used to set (`make-table-entry-usable`).

Rejected: **setting the attribute on the caret's cell alone**. It would align one cell of a column, which is not what "align this column" means anywhere else in the app, and the file would then carry a mix.

### D3 The chord choices

`Mod-Alt-l`, `Mod-Alt-m`, `Mod-Alt-r` for the three alignments (left, middle, right), and `Mod-Alt-d` / `Mod-Alt-Shift-d` for deleting a row and a column: `d` for delete, with `Shift` marking the column axis exactly as it does for `Mod-Alt-Enter` / `Mod-Alt-Shift-Enter`, which add a row and a column. All five are free in the app and in the commonmark preset's keymaps.

Rejected: **one align chord that cycles**. A keyboard user pressing it once would get the left alignment whether or not that is what they wanted, and the reference could not name which alignment a press produces.

### D4 Deletion uses prosemirror-tables' own commands

`deleteRow` and `deleteColumn` are the same functions the component's delete control ends up calling, guarded by `isInTable` so a chord outside a table is a no-op rather than a thrown error.

### D5 The reference rows are the dispatch entries

The five rows go in the table group of the shortcuts reference, which is also the dispatch surface: a row is a control that applies its chord, and the drift guard's union check (every clickable row names a bound chord) covers the new rows because the keymap is already in its list.

## Risks / Trade-offs

- [A repeat press reports nothing happened] → Intended and stated in the spec: the alignment already holds, and `setCellAttr` says so rather than writing an identical value.
- [The panel's row width] → Measured after adding: every new row is one line at the panel's width.
- [Deleting the row the caret is in moves the caret somewhere else in the table] → prosemirror-tables' own behavior, the same as the handle's delete control; the caret stays in the table.
- [A future preset change to `selectColCommand`'s return value] → The command is called for its effect and its result is deliberately ignored, with a comment saying why, so a change there cannot silently break the alignment.

## Migration Plan

None. No file, storage, or index change: the chords are bindings and commands.
