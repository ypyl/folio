## 1. List board references in the panel

- [x] 1.1 In `src/App.tsx`, build `referenceRows` from the page's assets and its board references, deduped by path (board row wins), labelling a board by `boardName(path)` and marking it materialized when `graph.files` holds it. Verify with an `App` test: a page with `#!Migration` lists a `Migration.excalidraw` row in References, and a token plus a path link to one board yields one row.
- [x] 1.2 Route a `.excalidraw` path to the board editor in `App`'s asset-open handler (`isBoardTarget`), so a board row activates into the board rather than a file copy. Verify with an `App` test: activating a board row in References opens the board in the main pane.
- [x] 1.3 Allow an unmaterialized row to dim in the References list (`src/components/MetaPanel.tsx`), leaving asset rows (always materialized) undimmed. Verify with a `MetaPanel` test: a `materialized: false` board row is dimmed, a materialized asset row is not.

## 2. Verification

- [x] 2.1 Run `npx oxlint --fix`, `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`, and `npm run build`. Verify all pass.
- [x] 2.2 Run the full test suite (`npm test`) and confirm the new cases pass with no regressions.
