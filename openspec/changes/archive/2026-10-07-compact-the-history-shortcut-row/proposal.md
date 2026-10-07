# Proposal

## Why

The keyboard-shortcuts reference lists Back and Forward as two separate rows,
one key each. They are a pair — one act in two directions, bound to a matching
pair of chords — so two full-width rows give the list a tall block for a single
idea. Collapsing them to one row labelled `Back / Forward` with both key chips
reads the pair at a glance and matches how the reference already handles a row
with two chords (Redo lists two).

## What Changes

- The reference lists one row, labelled `Back / Forward`, carrying both history
  chords, `Ctrl+[` and `Ctrl+]` (`Cmd` on macOS). Back and Forward no longer get
  a row each.
- Each chip keeps its own identity: its accessible name names its own action and
  its own key ("Back Ctrl+[" and "Forward Ctrl+]"), and it disables on its own
  direction of the trail, exactly as the two separate rows did. A shared row
  does not couple two directions that can differ — at the trail's end Back is
  live while Forward is dimmed, and after stepping back it is the other way.
- Nothing about the chords themselves changes: same bindings, same behavior, the
  same status bar controls, and the same no-op at the trail's ends.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace`: the shortcut-reference requirement's list gains the single
  `Back / Forward` row in place of the two rows; the "a shortcut row applies its
  key combination" requirement moves its availability gate from the row to the
  control, so one chip of a two-key row can disable while the other stays live.

## Impact

- `src/components/shortcuts.ts`: a row's `keys` becomes a list of key entries,
  each carrying its chord, an optional action label, and an optional
  availability surface; the two history rows become one.
- `src/components/ShortcutsList.tsx`: each chip reads its own label and surface,
  falling back to the row's.
- Tests: `src/components/shortcuts.integration.test.ts`,
  `src/components/ShortcutsList.integration.test.tsx`, and the reference
  assertions in `src/App.integration.test.tsx` and `tests/e2e/navigation.spec.ts`.
- Related ADRs: ADR-0010 (the editor's chords stay in the editor; this is the
  app's own reference data). No new ADR: a presentational compaction of the
  reference.
- No vault, storage, editor, or Markdown change; no chord changes behavior.
- Version: a patch bump (presentation of an existing feature).

## Non-goals

- No change to the history chords' bindings or behavior, and no change to the
  status bar's Back and Forward controls.
- No change to any other row of the reference: Undo, Redo, Open reference, and
  Search notes keep their rows and their labels.
- No new row content beyond the shared label: no separators, icons, or help
  text added.
- No backend, no database, no block-based document model.
