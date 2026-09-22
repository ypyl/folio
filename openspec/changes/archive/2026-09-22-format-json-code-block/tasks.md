## 1. The formatter

- [x] 1.1 Add `src/editor/codeFormat.ts` exporting `formatJsonText(text): string | null` — `JSON.parse` then `JSON.stringify(value, null, 2)`, returning `null` when the text does not parse or when the result equals the input. Verify with unit tests covering a minified object, nested arrays, an already-formatted input (null), invalid JSON (null), and preservation of key order and of every JSON value kind.
- [x] 1.2 Add `formatJsonBlock`, a ProseMirror command over the code block node, plus `isInCodeBlock(state)`: the command declines when the caret is not in a code block, when the language attribute is not JSON (case-insensitive), when the text does not parse, or when the formatted text equals the input; otherwise it replaces the block's content in one transaction and puts the caret at the block's start. Verify with unit tests over a minimal schema that a JSON block is reindented with its language and caret preserved, and that each decline leaves the text unchanged.

## 2. Wiring the chord

- [x] 2.1 Add the `Mod-Shift-f` match to `MilkdownAdapter`'s capture-phase key handler: when the caret is in a code block, claim the event, run the command, and stop propagation so the code surface's search binding never sees it; decline outside a code block. Verify with tests that the chord is claimed inside a block and not claimed with the caret in prose.
- [x] 2.2 Verify the round-trip through the real editor (jsdom, with the component mounted): a JSON code block focused through its code surface reformats and serializes to the indented text between the ` ```json ` fence; a non-JSON block and invalid JSON are left unchanged; and the replay path (`applyChord`) reaches the same behavior as a keypress.

## 3. The shortcuts reference

- [x] 3.1 Add the `Format JSON block` row (`Mod-Shift-f`) to `SHORTCUT_GROUPS` in `src/components/shortcuts.ts`, under Editing after the code-block rows, and verify the reference renders it as a control on one line (`ShortcutsList.test.tsx`).
- [x] 3.2 Add `Mod-Shift-f` to `CHORDS_BOUND_ELSEWHERE` in `src/components/shortcuts.test.ts` with a comment naming the adapter's key handler, add a test that the sheet lists the row, and verify the drift guard passes.

## 4. Verify and ship

- [x] 4.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; verify all are clean.
- [x] 4.2 Run `npm test` and verify the full suite passes, then `npm run build` and verify it succeeds.
- [x] 4.3 Browser check on a fresh `npm run dev:test` server (confirmed `ready in`, swept with `npm run kill:dev`): with a vault opened through an injected folder picker, a ` ```json ` block holding `{"a":1,"b":[2,3]}` reformats across seven two-space-indented lines when Ctrl+Shift+F is pressed, a ` ```js ` block holding the same text is left unchanged, the keyboard-shortcuts reference shows the Format JSON block row with its `Ctrl+Shift+F` tokens, and the console reports no errors. The file-on-disk round-trip is covered by the integration test that serializes through the real serializer.
- [x] 4.4 Bump `version` in `package.json` (minor — a new user-facing capability) and verify the status bar shows the new build.
