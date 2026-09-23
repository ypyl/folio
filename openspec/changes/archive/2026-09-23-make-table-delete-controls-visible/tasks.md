## 1. The commands

- [x] 1.1 Export the two caret-row/column commands from `src/editor/tableSetup.ts` (`deleteTableRow`, `deleteTableColumn`, wrapping the existing `inTable(deleteRow)` / `inTable(deleteColumn)`), so the strip can dispatch them; verify `npx tsc -b` is clean and the chords still use the same commands.

## 2. The strip

- [x] 2.1 Add `src/editor/tableDeleteControls.ts`: a ProseMirror plugin whose `view.update` resolves the table containing the selection and the block element for it (`view.nodeDOM`), returns without touching the DOM when that element is the one the strip is mounted in and is still connected, and otherwise removes the old strip and appends a `contenteditable="false"` strip with a Delete-row and a Delete-column button to the caret's table block. Each button's `pointerdown` prevents the default, stops propagation, dispatches the command from 1.1, and refocuses the editor. Clean up on `destroy`. Verify `npx tsc -b` is clean.
- [x] 2.2 Register the plugin in `src/editor/milkdown.ts` beside the table slice (design D2); verify the editor still mounts in `src/editor/mount.test.tsx` and `npm run build` compiles.
- [x] 2.3 Confirm the strip needs no handle clamp (design D4): it is positioned inside the block at the caret's row and the block's right edge, so the pane's box cannot clip it; verify `src/editor/tableHandleClamp.test.ts` is untouched and still green, and that the strip's `top` is written only when the caret changes row (checked with 3.2).

## 3. Behavior

- [x] 3.1 Add the strip's tests to `src/editor/milkdown.test.ts`: placing the caret in a table mounts a strip with a named delete-row and delete-column control; activating each removes exactly the caret's row or column and leaves a caret (a following keystroke appends rather than replaces); moving the caret out of the table removes the strip; a save with no control activated leaves the Markdown unchanged; and the handle controls and the `Mod-Alt-d` / `Mod-Alt-Shift-d` chords still behave as before.
- [x] 3.2 Add a bound test that a keystroke inside the same table does not rebuild the strip (the mounted element is the same before and after), per design D2; verify `npx vitest run src/editor/milkdown.test.ts` passes.

## 4. Styling and design

- [x] 4.1 Add the strip's rules to `src/components/EditorPane.module.css`: the handle's chip recipe (ivory, hairline border, stone glyphs, brand on hover), absolutely positioned in the block's top band, hidden unless mounted; verify no rule changes a table's own resting style.
- [x] 4.2 Update `DESIGN.md`'s Tables section with the strip's recipe and the restated rule that a table the caret is not in carries no toolbar.

## 5. Verification in Chrome

- [x] 5.1 With `npm run dev:test` (confirm the log says `ready in`), open a page holding a table, place the caret in a body cell, and verify the strip appears and each control deletes the caret's row or column from the saved Markdown; move the caret to a paragraph and verify the strip is gone.
- [x] 5.2 Verify the strip stays pressable with the table's first row at the pane's top edge (the clamp's case) and that the row/column handles and chords still work; sweep with `npm run kill:dev` when done.

## 6. Gates

- [x] 6.1 Bump `version` in `package.json` by a patch increment (a pointer path to existing operations) and sync `package-lock.json`; verify the status bar's badge shows it.
- [x] 6.2 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify the last command is clean.
- [x] 6.3 Run `npm test` and `npm run build`; verify both pass with the coverage thresholds held.
- [x] 6.4 Sweep the dev server with `npm run kill:dev` and verify no `vite` process is left running.
