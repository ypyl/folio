## 1. Decisions and documentation

- [x] 1.1 Write `adr/0026-folding-a-list-item-is-view-only.md` recording that folding is view-only, that it keeps the native marker (ADR-0020), and that fold state is session-scoped and never stored; add its row to `adr/README.md`. Verify both files name the decision and the README table lists ADR-0026.
- [x] 1.2 Add a Lists entry to `DESIGN.md` describing the disclosure control (a quiet gutter control beside the native marker, not a faked bullet) and its collapsed/expanded glyph. Verify the section exists under "### Lists".

## 2. Fold plugin

- [x] 2.1 Create `src/editor/foldLists.ts` with the pure helpers: whether a `list_item` has children, mapping the folded position set through a transaction, and dropping positions that no longer resolve to a foldable item. Verify with unit tests in `src/editor/foldLists.test.ts` covering a text edit, an item merge, and a removed list.
- [x] 2.2 Add the ProseMirror plugin: node decorations marking folded items, a widget decoration with a real `<button>` (`aria-expanded`, action-naming label) for each foldable item, click to toggle, `mousedown` prevented and `stopEvent` claimed. Verify tests assert a leaf item has no control, a foldable item has one, and clicking toggles the node decoration.
- [x] 2.3 Add an `appendTransaction` guard that moves a selection landing inside a folded item's hidden range to the end of its visible first block. Verify tests place a selection in nested content, fold, and assert the caret is in visible text.
- [x] 2.4 Carry the decoration set forward with `map` and rebuild a list's controls only when a structural step touches it, so a text keystroke reuses the existing control element. Verify a test asserts the control DOM node is identical before and after typing in that item.
- [x] 2.5 Register the plugin in `src/editor/milkdown.ts`, passing a callback the adapter uses to announce a layout change. Verify the editor mounts and the existing milkdown tests still pass.

## 3. Editor seam and pane

- [x] 3.1 Add `onLayoutChange(listener: () => void)` to `EditorAdapter` (`src/editor/editor.ts`), implement it in `MilkdownAdapter` (`src/editor/milkdown.ts`) and `FakeEditor` (`src/editor/fakeEditor.ts`), and call the listeners when the fold plugin toggles. Verify `FakeEditor` exposes the subscription and the adapter's listener fires on a toggle.
- [x] 3.2 In `src/components/EditorPane.tsx`, subscribe to `onLayoutChange` and call the existing `updateGutter`; add the fold and hidden-state styles to `src/components/EditorPane.module.css` using DESIGN tokens. Verify an EditorPane test folds an item and asserts the gutter re-measures (block numbers align after the layout change).

## 4. Verification

- [x] 4.1 Add `src/editor/milkdown.test.ts` coverage that a fold changes only the rendered state: the item's nested content is hidden, the serialized markdown is unchanged, and the page is not marked dirty. Verify those tests pass.
- [x] 4.2 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npm run build`, and `npm test`; bump `version` in `package.json` (minor: a new user-facing capability). Verify all commands succeed and the version badge changes.
