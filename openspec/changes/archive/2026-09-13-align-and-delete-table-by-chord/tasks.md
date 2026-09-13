## 1. The chords

- [x] 1.1 Add the five commands to `src/editor/tableSetup.ts`: `alignColumn` (design D2 — select the caret's column through the preset's own command, set the alignment through the preset's own command, then restore the caret), `inTable`-guarded `deleteRow` and `deleteColumn` (design D4), and the five keymap entries with the chords chosen in design D3; verify `npx tsc -b` is clean.
- [x] 1.2 Add the behavior tests to `src/editor/milkdown.test.ts`: aligning the caret's column to each of the three alignments (the file's delimiter row is the assertion), the caret left in the cell so typing appends rather than replacing the column, deleting the caret's row and then its column, and every chord doing nothing and claiming nothing with the caret outside a table; verify `npx vitest run src/editor/milkdown.test.ts` passes.
- [x] 1.3 Add the five rows to `SHORTCUT_GROUPS` in `src/components/shortcuts.ts` in the table group after "Add column", and extend `src/components/shortcuts.test.ts` so the drift guard covers their chords and that each is a replayable control; verify `npx vitest run src/components/shortcuts.test.ts src/components/ShortcutsList.test.tsx` passes.

## 2. Verification in Chrome

- [x] 2.1 Verify in Chrome with the caret in a body cell that the align-center chord centers that column (computed style and the saved file's delimiter row) and leaves the caret in the cell, and that the delete-row and delete-column chords remove exactly that row and column from the saved Markdown.
- [x] 2.2 Verify that the chords do nothing with the caret outside every table: the file is unchanged after pressing all five.
- [x] 2.3 Verify the reference: the five rows are listed with their key tokens, each on one line at the panel's width, and activating one applies it to the open page.

## 3. Gates

- [x] 3.1 Bump `version` in `package.json` by a patch increment (a keyboard path to existing operations) and sync `package-lock.json`; verify the header badge shows it in the running app.
- [x] 3.2 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify the last command is clean.
- [x] 3.3 Run `npm test` and `npm run build`; verify both pass with the coverage thresholds held.
- [x] 3.4 Sweep the dev server with `npm run kill:dev` and verify no `vite` process is left running.
