## Context

See `proposal.md` — Why. The facts that shape the approach, measured against the running app:

- The table block's node view claims the pointer: `stopEvent` returns true for a `mousedown`/`pointerdown` on `td`/`th` when the cell under the pointer is not the cell the caret is in, and its `handleClick` then dispatches a `NodeSelection` on that **cell node**. Because `stopEvent` returns true, ProseMirror ignores the DOM event entirely, so no plugin prop (`handleDOMEvents`, `handleClick`) ever sees the press. Nothing in the app can intercept the press before the node view does; the selection it produces is the only handle we have.
- A `NodeSelection` on a cell is why typing replaces: ProseMirror replaces the selected node's content with the typed text. Measured: click a cell holding `ada`, type `X`, the cell becomes `X`; a second click in the same cell places a caret and typing then gives `X!`.
- Cell width collapsed for a freshly inserted table because a column is sized by its widest cell and every cell was empty. v0.5.1 landed a `5rem` floor (`min-width` on `th`/`td`), which took a `|2x3|` table from 24px with 12px cells to 160px with 80×40 cells. That is already in the main spec's territory as a stylesheet fix; this change does not revisit it.
- An empty cell's DOM is exactly `<p><br class="ProseMirror-trailingBreak"></p>`, with the caret inside or outside the table, and a filled cell is `<p>text</p>`. The trailing break is ProseMirror's own device for giving an empty block something to put the caret on.
- The app already uses a stylesheet-only hint for an empty surface: the page placeholder is an attribute set by the adapter (`data-empty` on the mount root) plus a `::before` with the stone ink. That is the precedent the empty-cell boundary follows.
- DESIGN.md's Tables section says: no framed box, no tinted header bar, **no vertical rules**, hairline row rules, content-sized columns, muted uppercase header labels.
- `border-collapse: collapse` is set on the table, so a real `border` on a cell participates in column sizing in Chrome; an inset `box-shadow` paints the same line without touching layout.

## Goals / Non-Goals

**Goals:**

- One click on a cell puts the caret in it, so typing never destroys a cell's text by surprise.
- A table with empty cells shows which cells it has, without giving a filled table a grid it never had.
- Both cost nothing on the keystroke path, and neither is visible in the Markdown.

**Non-Goals:**

- No cell, row, or column selection from a click in a cell. Rows and columns are selected from their handles, as today.
- No change to the table component's own controls, to the canonical Markdown, or to the escaping of literal pipe text.
- No general restyle of tables: a table with text keeps DESIGN.md's editorial look.

## Decisions

### D1 Turn the component's cell selection into a caret, in an appended transaction

A Folio `$prose` plugin watches for a transaction whose new selection is a `NodeSelection` on a `table_cell` or `table_header` and appends a transaction that sets a `TextSelection` inside that cell instead. This is the only place the app can act: the press itself is consumed by the node view (Context). The appended transaction is not undoable history (ProseMirror does not add appended transactions to history), so an undo after a click does not undo the click.

Rejected: patching or forking the component. It is upstream-maintained, and ADR-0014/0017 adopt it rather than own it.

Rejected: leaving the selection alone and converting the *typing* instead. It would have to guess, per keystroke, whether the user meant to replace or to insert, and it leaves the click itself showing a tinted cell that reads as "this cell is selected for an operation".

### D2 The caret goes where the pointer was, with the cell's end as the fallback

The plugin records the press itself: a capture-phase `mousedown` listener on the editor root, which runs before the node view's own handler, storing the coordinates. When it converts the selection it asks `view.posAtCoords` for that point, so the caret lands where the user clicked; a quick click in a cell's padding resolves to the nearest text position in it. When there is no fresh pointer (a selection that arrived some other way, or a test), the caret goes to the end of the cell's text, which is the position typing appends at.

Recording the press inside the plugin keeps the adapter out of it: the plugin already owns the editor root through `view`.

Rejected: the adapter recording the press and handing it over. It would spread one behavior across two modules and add a seam (a getter) for nothing.

Rejected: always using the cell's end. It loses the click position in a filled cell, so a user fixing a typo clicks, sees the caret jump to the end, and clicks again.

### D3 The empty-cell boundary is a stylesheet rule, keyed on the empty paragraph's DOM

```css
.milkdown-table-block th:has(> p > br:only-child),
.milkdown-table-block td:has(> p > br:only-child) { box-shadow: inset -1px 0 0 var(--border-soft); }
```

Why this shape:

- **A stylesheet rule, not a plugin.** A decorations plugin would have to scan the document on every transaction to find empty cells, which is exactly the per-keystroke cost the repo's budget rule forbids. The DOM already says which cells are empty; the stylesheet reads it for free.
- **`box-shadow`, not `border`.** The table collapses its borders, so a real border would take part in column sizing and could shift columns by a pixel as cells fill and empty. An inset shadow paints the line inside the cell without touching layout.
- **`> br:only-child`, not the trailing-break class name.** It matches "the cell's paragraph holds nothing but a line break", which is ProseMirror's own shape for an empty cell, without depending on a class name it does not promise. A cell holding only `Shift-Enter` reads as empty, which is fair.
- **The trailing edge of every empty cell**, rather than a rule between columns: it needs no knowledge of which column a cell is in, and a table whose cells all hold text gets no rule at all, which is DESIGN.md's rule intact.

DESIGN.md's Tables section gains this as a named exception, alongside the reason it does not contradict the editorial style: the hairline is a hint for an empty cell, the same kind of device as the empty-page placeholder, and it disappears with the emptiness it marks.

### D4 A test pins the DOM hook

The rule above depends on a DOM shape ProseMirror produces, not on anything the app controls. A test asserts that an empty cell renders as `<p><br></p>` and that a filled cell does not, so a dependency upgrade that changes the shape fails the suite instead of silently dropping the boundary.

## Risks / Trade-offs

- [The component's internals change and the cell selection never appears] → The conversion is keyed on the selection type, not on the component, so a component that stops selecting cells simply makes the plugin a no-op; the caret then behaves like ordinary text, which is the point of the change. A test drives the selection directly.
- [A click in a cell's padding resolves to an unexpected caret position] → `posAtCoords` returns the nearest text position inside the clicked cell; the fallback is the cell's end. Both are inside the cell the user pressed.
- [The empty-cell hairline appears in tables that have content in most cells] → Intended: an empty cell is exactly where the user needs to see a target. The hairline is the softest border token and only 1px.
- [ProseMirror stops adding the trailing break to empty text blocks] → The test in D4 fails first; the stylesheet rule would then need a new hook (or an editor plugin).
- [Appended transactions and the history plugin] → The conversion is not added to history (verified in the browser check by undoing after a click).

## Migration Plan

None. No file, storage, or index change. A table written before this change renders the same, and a page that is only opened is not rewritten.
