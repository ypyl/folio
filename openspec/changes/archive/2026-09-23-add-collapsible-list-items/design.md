## Context

The editor is Milkdown/ProseMirror behind `EditorAdapter` (ADR-0010). Three existing facts shape this design:

- `EditorPane` is keyed by page path and mounts a fresh `MilkdownAdapter` per page, so plugin state is naturally per-page and torn down on a page switch or reload. Session-scoped fold state therefore needs no storage and no `setContent` reset.
- Decorations already follow one incremental pattern (`src/editor/inlineDecorations.ts`): map the set through the transaction, rescan only the top-level blocks the edit touched, and short-circuit a selection-only or focus transaction. Folding should ride the same pattern.
- The line-number gutter is driven by the markdown change stream and by a `ResizeObserver` on the mount element. A fold changes the rendered height without changing the markdown or the observed element's box, so it needs its own trigger.
- ADR-0020 keeps the browser's native list marker and DESIGN.md forbids faking a bullet. ADR-0018's image node view shows how a real control lives inside the editable surface (a button, `mousedown` prevented, `stopEvent` claimed).

## Goals / Non-Goals

**Goals:**

- Fold and expand a list item that has nested content, as a view over the Markdown Folio already has.
- Keep the page canonical: no fold state in Markdown, no `.folio/` entry, no writes caused by folding.
- Keep the native marker and the line-number gutter as they are.
- Give the control a real, accessible element, and keep the keystroke path bounded by the edited list.

**Non-Goals:**

- Persisting fold state across sessions or pages.
- Folding anything that is not a list item (headings, paragraphs, code blocks, quotes, tables, images).
- Replacing the native bullet, or owning marker geometry (ADR-0020 stands).
- A block/outliner document model (ADR-0006, ADR-0009).
- Folding in search results, the sidebar, or the whiteboard.

## Decisions

### D1 — Fold state is a set of positions in ProseMirror plugin state

A new plugin (`src/editor/foldLists.ts`) holds the folded items as a `Set<number>` of `list_item` start positions. On `docChanged` it maps each position through `tr.mapping`, then validates: a position is kept only if the node there is still a `list_item` that still has children. A selection-only or focus transaction returns the previous state object unchanged.

Alternatives considered: keying folds by canonical block line (positions shift on every edit, so recovering the mapping means serializing; rejected), or by a generated stable id (Folio has no block ids without a block model, ADR-0009; rejected).

### D2 — A fold is a node decoration plus CSS, never a document change

A folded item gets a node decoration that adds a class (`folio-folded`); the pane's stylesheet hides every child after the first — `li.folio-folded > :not(:first-child) { display: none }`. The ProseMirror document is not touched, so the serializer emits every line and the file keeps them (ADR-0001, ADR-0009). Folding produces no `markdownUpdated`, so it cannot dirty the page.

Alternative considered: moving hidden content out of the document — that is the block model ADR-0009 rejects.

### D3 — The control is a widget decoration holding a real button

Each item with children gets a `Decoration.widget` at the start of its first block whose DOM is a `<button type="button">` — `aria-expanded`, and an `aria-label`/`title` naming the action ("Collapse item" / "Expand item"), matching the image control's naming rule. The button sits in the item's gutter lane beside the native marker, which is left untouched (ADR-0020, DESIGN.md Lists). It keeps the caret in the document: `mousedown` is prevented and `stopEvent` reports the press as the control's own, exactly as the image control does (ADR-0018).

Alternatives considered: a CSS `::before` chevron on `li:has(> ul)` with a delegated click (cheap, but leaves the accessibility tree, cannot carry per-item state, and cannot be focused; rejected), and swapping the `::marker` for a chevron (rejected by ADR-0020).

### D4 — Hidden content never takes the caret

An `appendTransaction` moves a selection that lands inside a folded item's hidden range to the end of that item's visible first block. Cost is an O(folded) containment check per transaction, and O(1) when nothing is folded. This keeps typing in visible text and guarantees that expanding restores the content exactly. Keys are not intercepted; the guard only repairs a selection that something (a fold, an undo, an arrow key) already placed out of view.

### D5 — Fold state is per editor instance, which is already per page

Because the pane remounts per page, folding another page or reloading drops the state with the editor. No storage, no serialization, no `setContent` special case. This is the whole of "session-scoped" in the proposal.

### D6 — The control set is incrementally invalidated

On `docChanged`, the decoration set is carried forward with `prev.decorations.map(tr.mapping, tr.doc)`. A list's controls are rebuilt only when a step changes that list's structure; a text-only step inside a list leaves the widgets in place, because ProseMirror reuses a widget whose `WidgetType.eq` reports equality. This keeps a keystroke's fold cost out of both the document-size path and a per-keystroke DOM rebuild.

### D7 — A fold triggers the gutter's existing re-measure

`EditorAdapter` gains one notification — a layout-change listener — that the pane wires to its existing `updateGutter`. The plugin calls it after a fold or expand. Alternative considered: a subtree `MutationObserver` on the mount element (as `tableHandleClamp` uses) — rejected because it would watch every keystroke's DOM for a signal the plugin already knows.

## Risks / Trade-offs

- [The selection guard fights ProseMirror's own arrow handling] → The guard is only an `appendTransaction` containment repair; no key is intercepted. Covered by scenarios in "A folded item's hidden content cannot be edited".
- [A stale fold survives its children being deleted] → D1's map-and-validate drops any position that no longer resolves to a `list_item` with children.
- [The control element is recreated on every keystroke] → D6's `eq`-reuse, asserted by a test that the control node is identical across a text edit.
- [A focusable button inside a contenteditable pulls focus or the caret] → `mousedown` prevented and `stopEvent` claimed, the pattern ADR-0018 already ships.
- [A new UI element against DESIGN.md's "do not fake a bullet"] → The control is a separate gutter control, not a marker replacement; DESIGN.md gains a Lists entry and ADR-0020 is left standing.
- [Marker placement is revisited] → This change does not own the marker; a new ADR-0026 records that folding is view-only and that the native marker stays, so ADR-0020's condition for revisiting is not met.

## Migration Plan

None. Nothing is stored, so there is no data to migrate and nothing to roll back beyond reverting the commit.
