## Why

Folio has two page-level actions that sit as dedicated controls in fixed chrome: Present (a sticky button in the editor pane) and Pin (a star in the status bar). Both are stateless one-off actions with no persistent place, and both clutter surfaces that should stay quiet. A page row in the Files listing is the natural home for per-page actions: it names the page they act on, and a context menu keeps the row itself free of extra controls.

## What Changes

- **BREAKING (UX):** Remove the Present button from the editor pane. Presenting becomes reachable only from a page row's context menu.
- **BREAKING (UX):** Remove the pin/favorite star from the status bar. Toggling a page's favorite state becomes reachable only from a page row's context menu.
- Rename the user-facing concept from "pin" to "favorite". The behavior is unchanged (per-page boolean, ordered list, favorites sort to the top, the row keeps its bolder style). The on-disk file stays `.folio/pins.md`.
- Add a context menu to the Files listing's **page rows only**, opened by right-click; Chromium also delivers the native `contextmenu` event from `Shift+F10` and the Menu key on a focused row, so keyboard reach comes with the same handler.
- The menu holds exactly two items: **Favorite**/**Unfavorite** (label reflects current state) and **Present**.
- **Present** on a page row opens that page as a deck. When the row is already the open page, the deck derives instantly from the live document. When it is another page, the app opens the page first and presents once the editor is live (navigate-then-present), so unsaved edits in the draft still present.
- Presenting is now limited to **file-backed page rows**. A journal day (a calendar cell) and an in-memory page (no file, and so no row) can no longer be presented.
- Introducing a small, fixed two-item popover with a defined open/dismiss/keyboard contract. It is not a general menu framework.

## Capabilities

### New Capabilities

- `row-context-menu`: a page row in the Files listing opens a context menu with Favorite/Unfavorite and Present, including which rows have the menu, position, dismissal, keyboard operation, and accessible semantics.

### Modified Capabilities

- `pinned-pages`: the pin toggle no longer lives in the status bar; a page is favorited from its row's context menu, and the user-facing term is "favorite".
- `page-editing`: the editor pane no longer offers a Present control.
- `presentations`: presenting is entered from a page row's context menu instead of an editor control, may target a page that is not yet open (navigate-then-present), and is limited to file-backed pages.
- `ui-shell`: the status bar no longer leads with a pin control; its only controls are Back, Forward, and Today.

## Impact

- **Components:** `Sidebar` (row context menu), `EditorPane` (drop the Present control and its `onPresent` prop), `StatusBar` (drop `pinned`/`canPin`/`onTogglePin` and the star), `App` (menu wiring, favorites actions, navigate-then-present handoff, pending-present state).
- **Deleted code:** `StarIcon.tsx` and its only use (the status bar star); the `presentBar` styles in `EditorPane.module.css`.
- **Editor/presentation seam:** `EditorPaneHandle.staticBlocks()` and `deriveSlides` are unchanged; the new work is when the app calls them (after a targeted page is live), not how slides are derived.
- **Vault meta:** unchanged. Favorites keep `.folio/pins.md` (ADR-0015), so existing pins survive the rename.
- **Specs:** new `row-context-menu`; deltas for `pinned-pages`, `page-editing`, `presentations`, `ui-shell`.
- **ADRs:** no new ADR required. The change stays inside ADR-0005 (three-pane shell), ADR-0006 (keep it small), and ADR-0015 (in-vault app meta). Removing the in-memory/journal-day presentation path narrows a behavior rather than changing an architecture decision.

## Non-goals

- **No general menu system.** No item registry, submenus, separators, keyboard-shortcut labels, or per-row "..." trigger. Two hardcoded items.
- **No menu on board rows or asset rows.** They are different object kinds (ADR-0021, ADR-0024) and neither term applies to them.
- **No menu on journal day cells.** Journal days gain no context menu and cannot be favorited (they could not be pinned before either).
- **No new favorite concept.** Favorites are the existing pins, relabeled; there is no second list and no pin/favorite distinction.
- **No rename of `.folio/pins.md`.** Existing vaults keep their pins.
- **No second Markdown-to-slides path.** Present still derives from the live editor document; an unopened page is opened first.
- **No backend, no database, no block-addressed document model** (ADR-0006, ADR-0009).
- **No change to the slide grammar, deck navigation, or fullscreen behavior** of the presentation itself.
