# Tasks

## 1. Bind the history chords

- [x] 1.1 In `src/App.tsx`, add one `document` keydown listener in the capture
  phase that maps `Mod+[` to `handleBack` and `Mod+]` to `handleForward`, calling
  `preventDefault()` and `stopPropagation()` for those two chords only, and
  claiming them only while a vault is open. Register it with the handlers and the
  trail in its dependency list so it re-registers on navigation and never on a
  keystroke. Verify by reading the diff for the modifier guard and the early
  return on every other key.
- [x] 1.2 Add cases to `src/App.integration.test.tsx`: with Alpha then Beta open,
  `Mod+[` opens Alpha and `Mod+]` returns to Beta; at the trail's single entry
  neither chord changes the open page or its text; with no vault open the chord
  performs no step. Verify the cases pass with `npm run test:integration`, and
  that they fail if the listener is removed.
- [x] 1.3 Add an end-to-end case to `tests/e2e/editing.spec.ts` (or
  `navigation.spec.ts`): with two pages open and the caret in a bullet list item,
  pressing the Forward chord opens the next entry and leaves the list's text
  unindented, proving the editor's own binding does not act. Verify with
  `npm run test:e2e -- tests/e2e/editing.spec.ts`.

## 2. List the chords in the shortcuts reference

- [x] 2.1 In `src/components/shortcuts.ts`, add rows `Back` (`['Mod-[']`) and
  `Forward` (`['Mod-]']`) to the App group, add an optional `surface` to
  `ShortcutItem`, and widen the availability type; in `ShortcutsList.tsx`, gate
  each row on `item.surface ?? group.target`. Verify the two rows render with
  their key tokens in `src/components/ShortcutsList.integration.test.tsx` and
  that a row with its own surface disables independently of its group.
- [x] 2.2 In `src/App.tsx`, extend the memoized `canApply` with `back:
  canStep(trail, -1)` and `forward: canStep(trail, 1)` (moving the `canStep`
  reads above it if needed). Verify with an integration case that the Back row is
  disabled while the trail holds one entry and enabled once another page is
  opened, and that the memo identity still changes only on navigation.
- [x] 2.3 Update the pinned inventory in
  `src/components/shortcuts.integration.test.ts` to include the two new rows and
  keep the "no formatting or table chord" guard green. Verify with `npm run
  test:integration`.
- [x] 2.4 Add a case that activating the Back row's control (through
  `ShortcutsList`'s `onApply` and `App.applyShortcut`) steps the trail exactly as
  the chord does. Verify with `npm run test:integration`.

## 3. Integration checks

- [x] 3.1 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint
  --deny-warnings --format=agent`; verify all are clean.
- [x] 3.2 Run `npm run test:unit`, `npm run test:integration`, `npm run build`,
  and `npm run test:e2e`; verify all pass.
- [x] 3.3 Start `npm run dev:test`, open a folder, follow a couple of links, and
  confirm `Ctrl+[` and `Ctrl+]` move through the trail with the caret in the
  editor and that the keyboard-shortcuts section lists both rows; sweep the
  server with `npm run kill:dev`.
- [x] 3.4 Bump `version` in `package.json` (minor) and verify the status bar's
  version badge names the new build.
