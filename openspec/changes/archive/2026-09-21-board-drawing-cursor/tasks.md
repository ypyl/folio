## 1. The cursor

- [x] 1.1 In `src/editor/boardView.tsx`, mirror the library's crosshair rule (`data-crosshair`-worthy unless the tool is selection, hand, eraser, laser, image, or custom) and toggle a `data-crosshair` attribute on the board host from the change handler, writing only when the classification changes. Verify in the browser check that the attribute follows the active tool.
- [x] 1.2 In `src/editor/boardView.module.css`, add the scoped `!important` cursor override on `:global(.excalidraw canvas.interactive)` with the ink-blue crosshair SVG data URI (ivory halo, hotspot 12 12). Verify in the browser check that the computed cursor is the data URI for a drawing tool and unchanged for selection, hand, eraser, and laser.

## 2. Documentation

- [x] 2.1 Add a `DESIGN.md` line recording that the board canvas's crosshair cursor is the app's, and that the other tool cursors are the editor's own.

## 3. Verification

- [x] 3.1 Browser check on a fresh `npm run dev:test` server: select the rectangle tool and confirm the canvas cursor is the app's SVG; select selection, hand, eraser, and laser and confirm each keeps its own cursor; run `npm run kill:dev` afterward.
- [x] 3.2 Run `npx oxlint --fix`, `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`, `npm run build`, and the full test suite; verify all pass.
