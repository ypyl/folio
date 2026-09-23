## Why

The fold control added by `add-collapsible-list-items` lives inside the editable surface, in each item's marker lane. That puts it on top of the native bullet — the bullet's paint recedes on hover so the two do not overlap — and it keeps a control inside the content the user is typing in. The left rail already holds the document's one quiet control column (the line numbers), and the fold control belongs there instead: the marker stays as the browser draws it, and the rail becomes the document's control column with the line number beneath the arrow.

## What Changes

- The fold control moves out of the editor content and into the **left rail** (the line-number rail). The editor stops drawing a control and stops fading the native marker; the browser's marker is never covered (ADR-0020 stays).
- **Every foldable item gets an arrow** in the rail, aligned to that item's first line — nested items included, so nested folding stays reachable.
- A foldable **top-level** block shows its line number **beneath its arrow**; a block with no fold control keeps its number on its own line. A nested fold arrow has no number, by the existing rule that a list carries a single number.
- The rail becomes **interactive**: fold arrows are real buttons (focusable, labelled, `aria-expanded`), while the numbers stay presentational and inert. This is the spec change to the line-number requirement, which currently says the rail is entirely non-interactive and hidden from assistive technology.
- Fold semantics are unchanged: still view-only, still session-scoped, still no write to the vault (ADR-0026). The hidden-content caret guard and the gutter re-measure on a fold stay.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: the line-number requirement changes (the rail hosts interactive fold controls; a number sits under its fold control), the fold-control requirement changes (controls live in the rail, not the marker lane, and cover every foldable item), the gutter re-measure requirement covers the rail's controls, and the fold-bounded-work requirement changes because the rail redraws its controls in its existing off-the-keystroke-path pass.

## Impact

- `src/editor/gutter.ts`: place fold arrows alongside the numbers in one measure-then-write pass, and stack a number under its control.
- `src/editor/foldLists.ts`: drop the in-editor widget decoration; keep the node decorations, the folded set, and the selection guard. Expose the fold targets and the DOM-based toggle the rail needs.
- `src/editor/editor.ts` and `src/editor/fakeEditor.ts`: the editor seam gains the fold-target list and the toggle-by-element call.
- `src/components/EditorPane.tsx`: read the fold targets, render the rail controls, and toggle through the adapter.
- `src/components/EditorPane.module.css`: the rail control's styling; remove the in-editor control's marker-lane styling.
- `DESIGN.md`: the Lists and line-number entries describe the rail control and the arrow-over-number stack.
- No change to `VaultStorage`, the vault index, search, references, the Markdown serializer, or any saved bytes. ADR-0020 and ADR-0026 are unchanged; no new ADR is needed.
