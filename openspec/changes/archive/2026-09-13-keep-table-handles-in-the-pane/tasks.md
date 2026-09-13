## 1. The nudge

- [x] 1.1 Create `src/editor/tableHandleClamp.ts`: the pure `nudgeIntoPane(handleRect, paneRect, margin)` geometry (design D1) and the DOM pass — a `MutationObserver` on the handle roles' inline `style` plus a passive `scroll` listener on the nearest scrolling ancestor, both calling one write that settles (design D2/D3); verify `npx tsc -b` is clean.
- [x] 1.2 Add `src/editor/tableHandleClamp.test.ts` covering the geometry: a fitting handle is not moved; each edge and corner pushes it back inside; the margin is honoured; a handle inside by exactly the margin is left alone; verify `npx vitest run src/editor/tableHandleClamp.test.ts` passes.
- [x] 1.3 Wire the pass in `src/editor/milkdown.ts`: call it on mount with the mount root and clean it up in `destroy()`, beside the other DOM listeners the adapter owns; verify `npx tsc -b` is clean and `npx vitest run src/editor/milkdown.test.ts src/editor/tableHandleClamp.test.ts` passes.

## 2. Verification in Chrome

- [x] 2.1 Verify the clipped case: a page long enough for a table to be scrolled to the pane's top edge, hover a column, and confirm the handle is inside the pane, that `elementFromPoint` at its centre is the handle, and that pressing it selects the column and opens its group.
- [x] 2.2 Verify a handle that fits is untouched: with the table in the middle of the pane, confirm the handle sits where the editor places it (18px above the first row, clear of the pane's edges).
- [x] 2.3 Verify scrolling with a handle shown keeps it inside the pane, and that saving afterwards writes the table unchanged.
- [x] 2.4 Verify the drag indicators are untouched: start a row drag and confirm the line handle and the preview appear where they did before this change.

## 3. ADR

- [x] 3.1 Add the exception to `adr/0017-adopt-gfm-table-slice-and-table-block.md`: Folio nudges a handle the component placed outside the pane, and why that is not ownership of the component's placement; verify the text names this change.

## 4. Gates

- [x] 4.1 Bump `version` in `package.json` by a patch increment (a control made reachable) and sync `package-lock.json`; verify the header badge shows it in the running app.
- [x] 4.2 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify the last command is clean.
- [x] 4.3 Run `npm test` and `npm run build`; verify both pass with the coverage thresholds held.
- [x] 4.4 Sweep the dev server with `npm run kill:dev` and verify no `vite` process is left running.
