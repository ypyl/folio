## 1. Fold plugin

- [x] 1.1 Remove the widget decoration and its helpers from `src/editor/foldLists.ts` (button builder, glyph, `stopEvent`, `isToggleEvent`, the `onLayout` parameter), keeping the node decorations, the mapped folded set, and the selection guard. Verify `foldLists.test.ts` still passes with the widget cases removed and the decoration count updated.
- [x] 1.2 Export the fold-target query and the DOM-based toggle the rail needs: a function returning one `{ element, folded, depth }` per `li.folio-fold-item`, and a function that resolves an element to its `list_item` position and dispatches the fold meta transaction. Verify unit tests cover depth, folded state, and toggling by element.
- [x] 1.3 Register the plugin in `src/editor/milkdown.ts` without the layout callback and verify the existing milkdown tests still pass.

## 2. Editor seam

- [x] 2.1 Add the `FoldTarget` type and `getFoldTargets()` / `toggleFold(element)` to `EditorAdapter` in `src/editor/editor.ts`, with doc comments that keep ProseMirror positions behind the seam. Verify `tsc -b` accepts the interface.
- [x] 2.2 Implement both in `MilkdownAdapter` (`src/editor/milkdown.ts`), calling `notifyLayoutChange()` after a toggle, and in `FakeEditor` (`src/editor/fakeEditor.ts`) with a test hook. Verify unit tests cover the fake's targets, toggle recording, and that a toggle asks for a layout change.

## 3. Rail

- [x] 3.1 Extend `src/editor/gutter.ts` to measure fold targets in the same read pass as the numbers and to write arrow buttons alongside the number spans. Verify unit tests cover the arrow offsets and that a first-level arrow shifts its block's number down.
- [x] 3.2 Wire `src/components/EditorPane.tsx`: read `adapter.getFoldTargets()` in `updateGutter`, pass them to the rail, and add one delegated click handler on the rail that calls `adapter.toggleFold(element)`. Verify an EditorPane test toggles through the rail and re-measures.
- [x] 3.3 Update `src/components/EditorPane.module.css`: remove the in-editor `.folio-fold-toggle` rules and the marker fade, and add the rail arrow's styling (`pointer-events: auto`, focusable, stone ink) plus the stacked-number offset. Verify the built stylesheet carries the arrow rule and no marker-lane rule.
- [x] 3.4 Update `DESIGN.md` (Lists and line numbers) to describe the rail control and the arrow-over-number stack, and remove the marker-lane description. Verify the sections read coherently.

## 4. Verification

- [x] 4.1 Update `src/editor/milkdown.test.ts` folding cases: a fold is toggled through `toggleFold`, the item carries the folded class, the nested content stays in the DOM, the markdown is unchanged, the control is no longer inside the editor, and no fold work runs synchronously on a keystroke. Verify those tests pass.
- [x] 4.2 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npm run build`, and `npm test`; bump `version` in `package.json` (minor). Verify all commands succeed and the suite is green.
