## Why

Folio serializes an empty paragraph inside a list item as `<br />`. When the item also
holds a block after it — a fenced code block or a nested list — the two are written with
no blank line between them. CommonMark reads a line that begins with `<br />` in the
item's content as the **start of an HTML block**, which runs until a blank line, so the
child block is swallowed. On reopen the item's content is a single inline `html` atom
whose value is `<br />` plus the child's raw Markdown (for a code block, the fence and
the code itself), rendered as literal text: **the code block is gone**.

This was reported on a real page (`folio/pages/ef migrations.md`), where empty bullets
each held a SQL code block. Two symptoms, one cause:

- the code block degrades to raw text on reload, and
- Backspace on the empty bullet is a no-op, because after reload there is no empty
  paragraph to delete — only the `html` atom holding the SQL.

## What Changes

- **Serialization**: a blank line is written between an empty list-item line (`<br />`)
  and a following, more-indented child block, so the item round-trips instead of becoming
  an HTML block.
- **Parse (repair on open)**: the same normalization is applied to Markdown being read,
  so files already written in the broken form load correctly — the code block is restored
  as a code block — and are healed on the next save.
- **Backspace**: on the now-real empty list-item line, Backspace removes the line and
  promotes the item's children (the code block, a nested list) to the parent instead of
  deleting them or doing nothing.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `page-editing`: adds a requirement that an empty list item holding a child block
  round-trips through save and open, and a requirement covering Backspace and Delete in a
  list item.

## Non-goals

- No block-based document model (ADR-0009); list items stay Markdown list items.
- No change to the `<br />` representation of an empty paragraph that has no child block,
  and no change to empty paragraphs outside list items.
- No overwrite or resave of vault files on open: the repair happens in memory and reaches
  disk only through the ordinary save that already follows an open page's first edit.
- No change to Backspace on a non-empty item or to Delete's existing behavior.

## Impact

- **Code**: a new pure helper (`src/editor/emptyLines.ts`) and its application at the
  editor's Markdown boundary in `src/editor/milkdown.ts`; the existing keydown listener
  gains the Backspace case.
- **Spec**: `openspec/specs/page-editing/spec.md` gains two requirements.
- **Tests**: `src/editor/emptyLines.test.ts` and cases in `src/editor/milkdown.test.ts`.
- No storage, index, or serializer-schema change; the work is off the keystroke path.
