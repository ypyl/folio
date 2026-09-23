## Context

See `proposal.md` — Why. The facts that shape the approach:

- The table is rendered by `@milkdown/components/table-block`'s Vue node view, which Folio adopts rather than owns (ADR-0017). Its `.milkdown-table-block` element is the node view's DOM and is `position: relative` in `EditorPane.module.css`; the component's own controls (row/column handles, add buttons, alignment and delete groups) live inside it, and the editable `tbody` is its content DOM.
- The delete commands already exist: `tableSetup.ts` holds `inTable(deleteRow)` and `inTable(deleteColumn)`, used by the `Mod-Alt-d` / `Mod-Alt-Shift-d` chords. They act on the caret's row or column, and ProseMirror maps the caret through the deletion.
- Folio already reaches into the component's block once, in `keepTableHandlesInThePane`, to nudge a handle the pane's scroll box would clip. That is the established precedent for Folio chrome over the adopted block (ADR-0017).
- The editor's per-keystroke budget forbids rebuilding or measuring in proportion to the document, and the project's rule is that derived UI is rebuilt only when its input identity changes.

## Goals / Non-Goals

**Goals:**

- A visible, one-press pointer path to delete the caret's row and column, with no dependence on finding a handle.
- The strip is Folio chrome over the adopted block: it adds no node, no mark, and no Markdown.
- The strip costs nothing on the typing path.

**Non-Goals:**

- No change to the component's controls, its handle placement, or the drag gesture.
- No cell deletion, no new chord, no toolbar on a table the caret is not in.
- No layout shift of the table, and no layout read on a keystroke.

## Decisions

### D1 A Folio strip in the table block, not a change to the component

The strip is a Folio-owned element appended to the `.milkdown-table-block` of the table the caret is in. It is a sibling of the component's content DOM, so ProseMirror never reads it as content, and it reuses the delete commands the chords already use. Rejected: showing the component's own control group on hover, because its delete button acts on a `CellSelection` and the hover only reveals the group; making it work would mean selecting on hover, which the component does not expose and which Folio must not patch (ADR-0017). Rejected: a right-click menu, because the request is for a visible control, not another hidden gesture.

### D2 A plugin tracks the caret's table and mounts only on a change

A ProseMirror plugin (`src/editor/tableDeleteControls.ts`) runs on the view's `update`. It resolves the table node containing the selection, and the block element for it (`view.nodeDOM(tablePos)`). If that element is the one the strip is already mounted in and is still connected, the update returns without touching the DOM. Otherwise it removes any strip it mounted and, when the caret is in a table, builds and appends the strip to that block. The comparison is by element identity, so a keystroke inside the same table (which never changes the table's node) does no work, and an edit that shifts the table's position without changing which table the caret is in does not rebuild. Rejected: mounting on every update, which would rebuild per keystroke. Rejected: a `MutationObserver` on selection, which ProseMirror's own `update` already signals.

### D3 Two buttons, the existing commands

The strip holds one button per action, each with an inline SVG glyph, an accessible name that states the action, and a `title`. A button's `pointerdown` prevents the default, stops propagation, runs `inTable(deleteRow)` or `inTable(deleteColumn)` against the current view state, and refocuses the editor. The strip is `contenteditable="false"`, so it is not editable text. It is a pointer affordance; the keyboard path stays the chords, and the buttons are not given `Tab` reach because `Tab` moves between cells (`tableKeymap`). Rejected: adding a chord, because `Mod-Alt-d` and `Mod-Alt-Shift-d` already exist and are documented (ADR-0016).

### D4 Positioned at the caret's row, inside the block

The strip is absolutely positioned in the block's coordinate space, at the top of the row the caret is in and at the block's right edge. It therefore stays visible for a table taller than the pane, where a strip pinned to the table's top would scroll away from the caret. Its vertical position is one inline `top` written only when the caret changes row, so the one layout read that places it is off the typing path; a keystroke inside a row reads nothing. The table is never shifted to make room. Rejected: pinning the strip to the table's top, because the caret's row can be far below it. Rejected: measuring the table's width to place the strip beside its right edge, because that is a second layout read and the edge moves as cells change; the block's right edge needs no measurement. Rejected: a pane-docked bar, because the controls should read as belonging to the table being edited.

### D5 DESIGN.md records the look and the resting rule

`DESIGN.md`'s Tables section gains the strip's recipe (the handle's chip, the app's ink, a hairline border) and restates that a table the caret is not in carries no toolbar. The strip is chrome, not content: nothing about it reaches the Markdown, and the table's own editorial style is unchanged.

## Risks / Trade-offs

- [The strip overlaps the rightmost cell of a full-width table] → Accepted: the strip is compact, has a solid background, and appears only while the caret is in the table; a table narrower than the pane leaves it in the empty space to the right.
- [The component's block markup changes on a dependency upgrade] → The plugin keys on `view.nodeDOM` and the table node, and the stylesheet keys on the block class; a change would stop the strip from mounting, which a behavior test catches.
- [A table taller than the pane] → The strip follows the caret's row, so it stays beside the row being edited rather than at a table top that may have scrolled away.
- [The strip is not `Tab`-reachable] → Accepted: `Tab` moves between cells, and the chords are the keyboard path; the buttons still carry names for assistive technology.
