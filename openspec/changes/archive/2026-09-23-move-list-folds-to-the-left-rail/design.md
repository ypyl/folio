## Context

See proposal.md — Why. The pieces this design moves between:

- The fold plugin (`src/editor/foldLists.ts`) currently emits a widget button inside each foldable item and a node decoration that hides its children. The widget is the only part that is in the editable content.
- The left rail is `.gutter` in `EditorPane`, an absolutely positioned column (`left: 0; width: 32px`) filled by `updateGutterDom` in `src/editor/gutter.ts`. It measures every top-level block, then writes every number — read all, write all, one layout. It is `pointer-events: none` and `aria-hidden`.
- The pane drives the rail from the debounced markdown change stream, a fold (via the adapter's layout notification), and a `ResizeObserver`. It already reads the editor DOM (`el.querySelectorAll('.ProseMirror > *')`).
- `EditorAdapter` is the seam (ADR-0010): the pane asks, the adapter answers; ProseMirror positions stay behind it.

## Goals / Non-Goals

**Goals:**

- Put the fold control in the rail, never over the marker, for every foldable item including nested ones.
- Keep the rail's one measure-then-write pass and its off-the-keystroke-path update.
- Keep numbers inert while making controls accessible.
- Keep the fold view-only and session-scoped (ADR-0026).

**Non-Goals:**

- Persisting fold state, or any change to fold semantics or the Markdown.
- Making the numbers interactive.
- A keyboard shortcut for folding.
- A new ADR.

## Decisions

### D1 — The rail renders the controls; the plugin stops rendering any

`foldLists.ts` drops its widget decoration and everything around it (the button builder, glyph, `stopEvent`, `isToggleEvent`, the `onLayout` parameter). It keeps the node decorations (`folio-fold-item`, `folio-folded`, `folio-fold-head`), the mapped folded set, and the selection guard. The arrow is drawn by the rail.

Alternative considered: keep the widget and push it into the rail with CSS (rejected — a nested item's box indents with its list, so no single column is reachable, and the control would still live inside the contenteditable).

### D2 — The seam exposes fold targets and a toggle by element

`EditorAdapter` gains:

- `getFoldTargets(): FoldTarget[]`, where `FoldTarget` is `{ element: HTMLElement; folded: boolean; depth: number }` — one entry per `li.folio-fold-item`, `depth` 1 for a first-level item.
- `toggleFold(element: HTMLElement): void` — resolves the element to its `list_item` position with `view.posAtDOM` and dispatches the plugin's existing meta transaction, then asks for a layout notification.

Positions stay behind the seam; the pane only ever holds elements it measured. Alternative considered: return positions and have the pane measure by position (rejected — the pane measures DOM, and the adapter owns the mapping).

### D3 — One measure-then-write pass over numbers and arrows

`gutter.ts` measures top-level blocks (for numbers) and fold targets (for arrows) in the same read phase, then writes a fragment of number spans and arrow buttons. A number whose measured first-line top coincides with a first-level arrow's top is shifted down by the arrow's height plus a gap, which is the "number under the arrow" stack; a number with no matching arrow stays on its line. The arrow's offset uses the same centring rule as a number, so the two never disagree about where a line is. Rejected: a second pass for arrows (breaks the one-layout rule the rail is built on).

### D4 — Only the controls are interactive

The rail container stays `pointer-events: none`, numbers stay `aria-hidden` and inert, and each arrow button sets `pointer-events: auto`, is focusable, and carries `aria-expanded` and an action-naming label. `mousedown` on an arrow is prevented so the caret never leaves the document, and the button uses the same toggle flow as the old widget. Rejected: making the whole rail interactive (it would change how clicks over the numbers behave).

### D5 — A rail toggle flows through the adapter

Arrow click → `adapter.toggleFold(element)` → the adapter dispatches the fold meta transaction and calls `notifyLayoutChange()` → the pane's existing `updateGutter` redraws the rail with the new folded state. The plugin no longer needs a callback, and a fold still re-glues the numbers exactly as the previous change made it.

### D6 — The hidden-content guard is untouched

`hiddenBoundary` and the plugin's `appendTransaction` still move a selection that lands inside a folded item to its visible text. Nothing about the control's move changes the document or the guard.

## Risks / Trade-offs

- [The rail redraws every control on each update, so control DOM identity is no longer preserved across an edit] → The redraw is the rail's existing single pass and runs off the keystroke path (debounced change, fold, reflow); the bounded-work requirement is worded to say exactly that. The old "element is identical across a keystroke" test is replaced by one asserting no fold work runs on the keystroke.
- [A focusable button outside the editable steals focus or the caret] → D4's `mousedown` preventDefault and the adapter toggle; the "keyboard fold control does not disturb the caret" scenario guards it.
- [Measuring an item whose first block is empty descends into nested content] → measure the `.folio-fold-head` element when present and fall back to the item, not to a bare first-text-node walk.
- [Depth detection walks ancestors per item] → depth is the list nesting, a small constant; the walk is O(items × depth) inside the one off-keystroke update.
- [The number-under-arrow shift misfires for a first-level item that is not the block's first line] → the shift is decided by measured-top coincidence with the number, not by depth alone, so an arrow on a later line never moves the number.

## Migration Plan

None. Nothing is stored; revert the commit to roll back.
