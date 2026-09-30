## 1. Remove the old controls

- [x] 1.1 Remove the Present control from `EditorPane`: drop the `onPresent` prop, the `presentBar` JSX, and the `.presentBar`/`.presentButton` styles; update `EditorPane.test.tsx` to drop its Present assertions. Verify `npx vitest run src/components/EditorPane.test.tsx` passes.
- [x] 1.2 Remove the star from `StatusBar`: drop the `pinned`, `canPin`, and `onTogglePin` props, the pin button JSX, and its styles; delete `src/components/StarIcon.tsx`; update `StatusBar.test.tsx`. Verify `npx vitest run src/components/StatusBar.test.tsx` passes and `rg StarIcon src` returns nothing.
- [x] 1.3 Stop passing the removed props from `App` (the `onPresent` prop and the status bar's pin props), and update `App.test.tsx`'s present-from-button test. Verify `npx vitest run src/App.test.tsx` and `npm run build` both succeed.

## 2. Row context menu

- [x] 2.1 Add `RowContextMenu` (`src/components/RowContextMenu.tsx` + module CSS): a `role="menu"` box holding exactly two `role="menuitem"` buttons labelled "Favorite"/"Unfavorite" and "Present", `position: fixed`, clamped to stay inside the viewport. Verify a component test renders both item names and clamps the box at a viewport edge.
- [x] 2.2 Implement the menu contract in `RowContextMenu`: focus moves to the first item on open; `ArrowDown`/`ArrowUp`/`Home`/`End` move focus without wrapping; `Enter`/`Space` activate; `Escape`, an outside `pointerdown`, a scroll, and window blur dismiss; focus returns to the trigger row on close. Verify a test per behavior.
- [x] 2.3 Open the menu from the Files listing's page rows in `Sidebar`: an `onContextMenu` handler that calls `preventDefault()`, positions from `clientX/clientY` (or the row's rect for a zero-coordinate keyboard event), and renders the menu; the row carries `aria-haspopup="menu"`; board and asset rows get no handler. Verify a Sidebar test: a `contextmenu` event on a page row opens the menu, and the same event on a board or asset row opens nothing.

## 3. Favorite action

- [x] 3.1 Add a stable `useCallback` in `App` that toggles a page's favorite state by path (the existing `togglePin`), pass it to `Sidebar`, and feed it to the menu's favorite item with a label that reflects the row's `pinned` state. Verify an App or Sidebar test favorites a page from a non-open row and the row then renders the favorite style and "Unfavorite".
- [x] 3.2 Record the deliberate vocabulary split (code `pins`/`.folio/pins.md`, UI "Favorite") in a comment at the App/Sidebar boundary, and update any test that asserts the old "Pin"/"Unpin" labels. Verify `rg -i '"pin ' src` finds no user-facing pin label and the updated tests pass.

## 4. Present: navigate then present

- [x] 4.1 Add an optional `onReady` to `EditorPane`, fired once after the editor mounts. Verify an `EditorPane` test observes exactly one `onReady` call per mount.
- [x] 4.2 In `App`, add `onPresent(path)`: when `path` is the open page, derive the deck immediately; otherwise record the path in a ref, select it, and derive the deck from `onReady` when the recorded path matches `activePath`. Verify an App test presents the open page's row with no navigation, and presents another page's row by opening that page and showing its deck.

## 5. Verify and finish

- [x] 5.1 Confirm the new work adds nothing to the typing path: a test types in the open document after a menu open/close and asserts no menu is created or repositioned, and the `Sidebar` props that changed keep stable identities. Verify the test passes.
- [x] 5.2 Run the repo checks: `npx oxlint --fix`, `npm run fmt`, `npm test`, `npm run build`, then `npx oxlint --deny-warnings --format=agent`. Verify all succeed with no warnings.
- [x] 5.3 Browser check: start with `npm run dev:test`, confirm the log says `ready in`, exercise right-click on a page row (open the menu, favorite it, present the open page, present another page), then stop the server with `npm run kill:dev`. Verify the menu is fully visible, both actions work, and no dev server survives.
- [x] 5.4 Bump `version` in `package.json` by a minor step. Verify the status bar badge shows the new `v<version>`.
