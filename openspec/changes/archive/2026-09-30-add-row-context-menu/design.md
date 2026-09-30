## Context

See proposal.md - Why. Current state that shapes the approach:

- The Present control is a zero-height sticky bar in `EditorPane`; `App.handlePresent` derives the deck from `editorRef.current.staticBlocks()`, i.e. the live Milkdown document. `deriveSlides` consumes editor blocks, not Markdown, and the app has no Markdown-to-HTML renderer.
- `EditorPane` is mounted as `<EditorPane key={activePath} initialContent={...}>`, so a page switch remounts the pane and the editor mounts in an effect. Nothing currently signals "the document is live".
- Favorite state is the existing `pins`/`togglePin` from `useIndex`; `togglePin(path)` already takes an arbitrary page path and writes `.folio/pins.md` through `VaultStorage`. The status bar's star calls it for the open page.
- `Sidebar` is memoized against the keystroke budget (AGENTS.md): new props must keep stable identities.
- jsdom (the test environment) implements neither the Popover API nor `HTMLDialogElement.showModal` (App tests already stub the latter).

## Goals / Non-Goals

**Goals:** one context menu on the Files listing's page rows, holding Favorite/Unfavorite and Present; no control on the row itself; no work added to the editor's per-keystroke path.

**Non-Goals:** a reusable menu framework; menus on board/asset rows or journal cells; a Markdown-to-slides path; renaming `.folio/pins.md` or the vault-layer `pins` identifiers.

## Decisions

**D1 — The menu is a small component rendered by `Sidebar`, which owns its open/position/keyboard state.** `App` supplies stable `onFavorite(path)` and `onPresent(path)` callbacks; the menu is a view concern that belongs next to the rows, and Sidebar already knows the listing's geometry and scroll. Alternative: `App` owns the menu state — rejected because it would push viewport geometry out of the component that owns the DOM.

**D2 — Present is navigate-then-present, carried by a pending path plus an `onReady` signal.** `EditorPane` gains an optional `onReady` fired once after the editor mounts (editor-layer behavior, ADR-0010). App stores the requested path in a ref, selects it, and presents in `onReady` when the ref matches `activePath`. Alternatives: derive slides from the index's Markdown — rejected (a second renderer that can disagree with the live document, and slides must include unsaved draft edits); a `requestAnimationFrame`/microtask after `select` — rejected (fragile ordering and StrictMode remounts).

**D3 — Favorites keep the vault layer's vocabulary.** `pins`/`togglePin`/`.folio/pins.md` stay as they are; only the user-facing strings become "Favorite"/"Unfavorite". Alternative: rename identifiers and the file — rejected as churn that would touch the index and every test for no behavior change, and the file name is a data contract (ADR-0015).

**D4 — The menu is hand-rolled: `position: fixed`, no portal, explicit dismiss and focus.** The sidebar's ancestor chain has no `transform`/`filter`/`contain` (only descendant chevrons use `transform`), so a fixed-position child is not clipped and needs no portal. Dismissal is explicit: `Escape`, an outside `pointerdown`, the listing scrolling, and window blur close it. Alternative: the native Popover API (`popover="auto"` for light dismiss and top-layer stacking) — rejected because jsdom does not implement it, so the menu's core open/dismiss behavior would be untestable without stubbing it in every test; the explicit handlers are testable and also cover scroll-close, which popover does not. Alternative: render into `document.body` via a portal — rejected as unnecessary without a transformed ancestor.

**D5 — Keyboard reach reuses the row's existing button.** The page row's `<button>` gets `onContextMenu`; Chromium fires `contextmenu` for right-click and for `Shift+F10`/Menu key, so no second trigger element and no `keydown` handler are needed. `preventDefault()` suppresses the browser menu only on page rows; board/asset rows get no handler and keep the browser's menu.

**D6 — Position from the event, clamped to the viewport.** Right-click uses `clientX/clientY`; a keyboard invocation (which reports zero coordinates) uses the row's bounding rect. The menu's box is measured after mount and shifted to stay fully visible.

## Risks / Trade-offs

- **A visible editor flash before the deck** when Present targets a page that is not open → intended and accepted; the workspace is covered once the document is ready. Mitigation: none needed.
- **A large page delays the deck** → the deck derives once, when the document is live; no re-parse and no vault read, so the delay is bounded by the ordinary page-open cost.
- **The menu state could defeat Sidebar's memoization** (a new prop rebuilt per render re-creates rows) → keep `onFavorite`/`onPresent` stable through `useCallback`; the menu's own reopen/close/position state is local to Sidebar and changes only on those gestures, never per keystroke.
- **Focus return to a row that has unmounted** (the listing is windowed) → the row leaves the window only on scroll, which already dismisses the menu; do not move focus to a detached node.
- **Vocabulary seam** (code says `pins`, UI says "favorite") → comment it at the boundary so the next reader sees the file/term split is deliberate.

## Migration Plan

No data migration: `.folio/pins.md` and its format are unchanged, so existing favorites survive. Roll out by removing the two controls, adding the menu, wiring the two actions, and updating the affected tests; bump `version` (minor). Rollback is the reverse revert; no stored state is involved.

## Open Questions

- Whether to later rename the `pinned-pages` capability and the `pins` identifiers to "favorites". Deferrable: it changes no behavior, no spec, and no task here.
