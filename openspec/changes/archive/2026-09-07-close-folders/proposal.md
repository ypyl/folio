## Why

Opening a folder in Folio is one-way: once added, a folder lives on the rail and in the IndexedDB registry forever — there is no way to close it, and no way to get back to the app's home screen. Every folder you ever open (a wrong pick, a sample vault, an old project) stays and reappears on every boot. Users need the inverse of Open — close a folder and take its pages, notes, and remembered handle away — and a home to return to.

## What Changes

- **Home = the empty state.** "Home" is the existing brand screen (FolioMark + tagline) with no active folder. It reuses the current empty-state rendering; no new screen.
- **The brand returns home.** Clicking the Folio mark + title in the header's top-left makes no folder active and shows the empty state; every listed folder stays on the rail and none is closed or forgotten.
- **Close control on every rail entry**: each folder avatar gains a small always-visible close (×) corner badge; activating it closes that folder without switching to it.
- **Forget on close**: closing a folder drops its rail row and clears its IndexedDB handle, so it is NOT restored on the next boot. Re-adding later is a fresh pick.
- **Closing the active folder returns home** — the folder is forgotten and the app shows the empty state; other listed folders remain on the rail. There is no auto-switch to another folder. Closing a *non-active* folder removes only its entry and leaves the workspace unchanged.
- **Home is the default**: going home (brand click or closing the active folder) clears the persisted last-active pointer, so a reload also lands on the empty state.
- **Pages and notes close with the folder**: closing the active folder resets the open page, drafts, index, and search exactly as a folder switch already does; sub-debounce unsaved edits are dropped silently (ADR-0004 — drafts are disposable session state).
- The close and home actions never touch files on disk — FSA handles are references, so forgetting cannot delete, move, or modify a folder's contents.

## Capabilities

### New Capabilities
- None — closing folders and returning home extend existing behavior.

### Modified Capabilities
- `ui-shell`: the empty state becomes a reachable home — shown when no folder is active even while other folders are listed; the header brand becomes a home control; the folder-rail requirement gains a close interaction (closing the active entry returns to the empty state, closing any other entry keeps the current view).
- `vault-storage`: "Vault selection persists across reloads" gains the forget and home contracts — closing a folder removes it from the persisted registry so a later boot does not restore it, and returning home clears the last-active pointer so a later boot opens the empty state.

## Impact

- `src/vault/useVault.ts` — new `closeFolder(id)` (drop row, clear handle, and when active return home) and `goHome()` (no folder active, no forgetting); both clear the last-active pointer.
- `src/vault/handleStore.ts` — `clearVaultHandle` already exists; a small `clearLastActiveId` (or store `null`) is added.
- `src/components/FolderRail.tsx` + `FolderRail.module.css` — per-avatar close (×) badge; click stop-propagated so it never triggers a switch; `aria-label="Close folder <name>"`.
- `src/components/Header.tsx` + `Header.module.css` — the brand becomes a home button (mark + title) with an accessible label; wires a home callback.
- `src/App.tsx` — wire the rail's close and the brand's home callbacks; the page/notes reset is already driven by the `activeFolder?.id` effect, so no new cleanup logic.
- Spec updates in `openspec/specs/{ui-shell,vault-storage}/spec.md` at sync time.
- No new dependencies; no new ADR (forgetting and going home are cache-state under ADR-0001/0009 — the registry and last-active pointer are derived data; folders themselves are untouched).

## Non-Goals

- Deleting, moving, or otherwise modifying anything on disk — closing only forgets the app's reference to the folder.
- Auto-switching to another folder when the active one closes — closing the active folder always returns to the empty state.
- A confirm dialog or undo; the app has no confirmation precedent and a misclose is recoverable by re-picking.
- Context menus, popovers, hover-only controls, or any new UI paradigm — the × is always visible on the tile.
- Flushing pending saves on close; sub-debounce state drops silently, matching folder switches.
- Closing individual pages/notes, tabs, or a "close the app window" action — only folder entries close.
- Folder renaming, reordering, or pinning.