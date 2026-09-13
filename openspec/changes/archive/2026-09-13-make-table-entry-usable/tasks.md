## 1. Caret on click

- [x] 1.1 Create `src/editor/tableCellCaret.ts`: a `$prose` plugin that records the pointer press with a capture-phase `mousedown` on the editor root (design D2) and, on a transaction whose new selection is a `NodeSelection` on a `table_cell`/`table_header`, appends a transaction setting a `TextSelection` at `view.posAtCoords(pointer)`, falling back to the end of the cell's text; verify `npx tsc -b` is clean.
- [x] 1.2 Register the plugin in `src/editor/milkdown.ts` with the table slice (after `.use(inlineDecorations(...))`, beside `tableSlice`); verify `npx tsc -b` is clean and `npx vitest run src/editor/milkdown.test.ts` still passes.
- [x] 1.3 Add the assertions to `src/editor/milkdown.test.ts`: a `NodeSelection` on a cell becomes a `TextSelection` inside that cell; typing after it appends (a cell reading `ada` gains the character rather than becoming it); a `NodeSelection` on a table or a `CellSelection` over a row or column is left alone; verify `npx vitest run src/editor/milkdown.test.ts` passes.
- [x] 1.4 Verify in Chrome against a vault: a click in the middle of a filled cell puts the caret there and typing inserts (not replaces); a click on an empty cell takes typing; the column handle still selects a column and the align control still applies to it; `Tab`, `Shift-Tab`, and `Enter` behave as before; undo after a click does not undo the click.

## 2. Boundary on an empty cell

- [x] 2.1 Add the empty-cell rule to `src/components/EditorPane.module.css` as an inset `box-shadow` keyed on `th:has(> p > br:only-child)`, `td:has(> p > br:only-child)`, using the soft border token (design D3); verify by measurement in Chrome that an inserted `|2x3|` table shows a hairline between its columns.
- [x] 2.2 Add the DOM-hook assertion to `src/editor/milkdown.test.ts`: an empty cell's paragraph holds nothing but a `br` (what the stylesheet keys on) and a filled cell's does not (design D4); verify `npx vitest run src/editor/milkdown.test.ts` passes.
- [x] 2.3 Verify in Chrome that a cell's hairline disappears as the cell fills while its empty neighbours keep theirs, that no cell moves or changes width when that happens (measure before and after), and that a table with text in every cell renders with row rules only.
- [x] 2.4 Verify the boundary never reaches the file: save a page holding empty cells, confirm the Markdown holds the canonical table with `<br />` and no character for the hairline, then reopen the page and confirm the same table.

## 3. Design language

- [x] 3.1 Update DESIGN.md's Tables section with the named exception: a cell that holds no text may show a hairline on its trailing edge, why (a hint for an empty cell, like the empty-page placeholder), and that a table with text keeps row rules only; verify the section reads as one rule with its rationale, not as a contradiction of "no vertical rules".

## 4. Gates

- [x] 4.1 Bump `version` in `package.json` by a patch increment (a fix to table entry, not a new capability) and sync `package-lock.json`, and verify the header badge shows it in the running app.
- [x] 4.2 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify the last command is clean.
- [x] 4.3 Run `npm test` and `npm run build`; verify both pass with the coverage thresholds held, and record the bundle delta (a stylesheet rule and a small plugin; no new dependency).
- [x] 4.4 Sweep the dev server with `npm run kill:dev` and verify no `vite` process is left running.
