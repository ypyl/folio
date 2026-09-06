## Context

Opening folders is additive and irreversible in the UI today: `useVault` owns a `folders` registry (row = id, name, handle, permission, storage, fileCount) persisted through `handleStore`'s IndexedDB `handles`/`meta` stores, and the only exit is the OS revoking permission at boot. The header brand (FolioMark + title) is static. `App.tsx` already tears down the open page, drafts, saver, and search whenever `activeFolder?.id` changes, and already renders the empty (brand) screen when no storage is active. See proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- A close control on every rail entry that forgets the folder (rail row + IndexedDB handle).
- A "home" state (the existing empty/brand screen, no active folder) reachable both by closing the active folder and by clicking the header brand.
- Reuse the existing folder-switch teardown and empty-state rendering instead of adding parallel cleanup paths.

**Non-Goals:**
- Any write or delete on disk; any confirm dialog or undo; any flush of sub-debounce draft state; any new UI paradigm (menus, popovers, hover-only controls); any auto-switch to another folder when the active one closes.

## Decisions

**1. `closeFolder(id)` and `goHome()` live in `useVault`; App wires only the calls.**
`closeFolder(id)` drops the row and clears the handle; when the closed folder was active it also returns home. `goHome()` makes no folder active and clears the last-active pointer without forgetting anything (the brand path). `App` passes a close handler to the rail and a home handler to the brand. The page/draft/search reset needs no new code: it is already keyed on `activeFolder?.id`, and returning home sets that id to null, so the teardown effect runs and `graph` becomes null (the today-journal auto-open effect then no-ops). Only the home transition is new.
- *Alternative rejected:* explicit teardown in the close handler — duplicates the effect's reset and invites a race with it.

**2. Always-visible close (×) corner badge on every entry.**
A small corner control on each 40px tile, distinct from the letter's switch surface, `stopPropagation` on click so it never activates the entry, with an `aria-label` ("Close folder <name>") and the folder name in `title`. The rail's `+` is always visible, so its inverse is too; touch needs no hover; Folio has no hover-only controls, and a context menu would be the app's first popover for a single action. Kami-styled: neutral (warm-sand surface, stone icon) — ink-blue stays the only chromatic accent. Works identically for pending-permission entries (no storage to dispose, just row + handle).

**3. Sub-debounce drafts drop silently on close.**
Same policy as a folder switch: the saver-effect cleanup `dispose()`s the pending timer and `drafts.clear()` runs; edits from the last second are discarded. Drafts are deliberately disposable session state (ADR-0004), and the app makes no retention promise below the debounce window anywhere else.
- *Alternative rejected:* flush before close — a >1s-window keystroke surviving close but not a switch draws an indefensible policy line at an invisible implementation detail, and flush is a half-promise (tab close, crash, and switch still drop).

**4. Home = no active folder; close-active and the brand both land there.**
"Home" is the existing empty state with `activeId = null`; nothing new to render. Two entries to it:
- **Closing the active folder** forgets it *and* returns home — no auto-switch. The user's "I'm done, take me home" is a deliberate stop, not a continuation into another workspace. This replaces the earlier successor-hand-off idea (rejected: silent re-entry into a different folder reads as a surprise, and the user asked for the empty page).
- **Clicking the brand** returns home without forgetting anything. The brand is the universal "go home" affordance, and Folio has no other home to return to.
Both paths set `activeId = null` and clear the persisted last-active pointer, so a reload also opens home — "home is the default" (the name the user gave it). A pending-permission folder is never auto-activated anywhere (re-grant needs a user gesture), and returning home never requires one.
- *Alternatives rejected:* auto-switch to the first remaining granted folder (continuation the user explicitly declined); a separate home "mode" layered over a still-set `activeId` (state machine would need a second axis for no reason).

**5. Last-active pointer follows the home state.**
`handleStore` gains a tiny `clearLastActiveId` (or `setLastActiveId(null)`); both `closeFolder` (when active) and `goHome` clear it. Clearing it on brand-click means a deliberate "go home" persists as home across reloads — consistent with calling it the default. Stale pointers are harmless anyway (restore falls back to first granted), so this is correctness hygiene, not a requirement of the empty state.

## Risks / Trade-offs

- [Accidental close from a small × badge on a 40px tile] → The × is corner-positioned away from the letter's hit area, and the harm is fully recoverable: closing never touches disk, and re-picking re-adds the folder as a fresh entry.
- [Closing the active folder returns home instead of another folder, adding one click to resume work elsewhere] → Accepted; it is the requested model (close = deliberate stop). Remaining folders stay one rail-click away.
- [Clearing last-active on brand-click means a reload after "going home" restores home, not the folder the user was in] → Accepted and consistent with "home is the default"; the folder remains one rail-click away and is never forgotten.
- [Silent draft drop on close could surprise a user who types and closes within one second] → Accepted and consistent: the same drop already happens on any folder switch, and Folio's architecture (disk is truth, drafts disposable) makes no sub-debounce promise.

## Migration Plan

None. This removes registry rows through the existing `clearVaultHandle` delete path and writes/clears the `meta` last-active key; IndexedDB schema is unchanged (no version bump), and no stored folder is migrated. If rolled back, closed folders simply return the next time they are re-picked.

## Open Questions

None — the home model, close surface, brand interaction, and draft policy were resolved during exploration and are fixed by the specs.