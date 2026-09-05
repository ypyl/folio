## Context

See proposal.md — Why. The single-folder machine shipped in `build-open-folder-flow` (`useVault` with one `OpenVault`, `handleStore` with one `'vault'` key, header slot as the only affordance) becomes a registry of folders with the rail as the control surface. Layout must keep the ui-shell invariant that header columns mirror workspace columns.

## Goals / Non-Goals

- Goals: a folder registry that survives reloads; a rail to add/switch/reconnect; active-folder status in the header; dedup on re-pick; zero changes to `VaultStorage` or `FileSystemVaultStorage`.
- Non-goals: close/forget controls, per-folder indexes (task 6), per-folder selection memory, cross-folder search, upload fallback when FSA is unavailable, unread badges or the osv GitHub link.

## Decisions

**D1 — Registry shape: one row per folder, id-keyed.**
`handleStore` migrates from `handles.store.put(handle, 'vault')` to a registry: `handles` store keyed by `crypto.randomUUID()` → `{ id, name, handle }`, plus a `meta` store row `lastActiveId`. The handle is structured-cloneable by design; `name` is snapshotted at pick time (sync getter) so the rail can list restored-but-permission-pending folders without touching the handle. Loading `meta.lastActiveId` survives reloads and picks the active folder even when that folder's permission is pending.
Alternatives rejected: keying by `handle.name` (collisions + rename orphans the row); keeping one row with an array of handles (id needed for last-active anyway; two stores are cleaner than a bespoke row schema). DB version 2 — adding the `meta` store requires a bump; the upgrade transaction also clears the legacy single-`vault` row from build-open-folder-flow, so there is no user-facing migration (young app, ADR-0012's no-migration rule).

**D2 — Hook state: `folders` + `activeId` replaces `vault`.**
`useVault` returns `{ folders, activeId, status, addFolder, activate }` where `status` is `'restoring' | 'ready'` and folders hold `{ id, name, permission, storage? }`. Since the delta drop-denied-at-boot rule is unchanged from open-folder-flow, the boot loop is the same per-folder code path: granted → open storage + list() for count, prompt → listed without storage, denied → dropped. Only the last-active folder gets its count listed eagerly (header needs one number); other granted folders list lazily on first activation — count per folder is a task-6 nicety, keep the eager work at O(1) list().
`activate(id)` guards the gesture requirement: for a prompt folder it runs `requestPermission` on the stored handle (same helper as today), and on failure falls back to the picker (`addFolder`'s path), reusing the exact denied-drop logic already shipped. `addFolder` wraps `pickVaultFolder`, dedups against existing handles via `isSameEntry` (sync, cheap), saves the row, activates it.

**D3 — Rail: 56px leading column, alignment preserved.**
Workspace and header grids become `56px | 240px | 1fr | 220px` (D2-aligned: rail column continues up through the header row). Rail per openspec-viewer's `osv-folder-rail`, trimmed to Folio's token set: `+` at top (dashed border, `--border`/`--stone`), avatars below — first letter on a warm surface, active folder marked with a brand ring, prompt-permission folders getting a dashed hollow ring (like osv's upload avatar). No GitHub link, no unread dots (YAGNI until real indexes exist). Note: avatars are intentionally monochrome — the ui-shell spec forbids a second chromatic color ("Ink-blue as the only chromatic accent"), so the per-folder hues of openspec-viewer's rail do not carry over.
Alternatives rejected: workspace-only rail below the header (breaks the column-alignment invariant the ui-shell spec asserts); no rail + dropdown in the header (header slot is display-only per F4 and a dropdown re-introduces header actions).

**D4 — Header becomes display-only.**
`Header` drops its `onOpenFolder`; the slot renders `name · count` (or `Open folder`… no — per spec the slot has no action; the mock-state affordance is the rail's `+`, so the slot renders nothing when no folder is active). This reverses the open-folder-flow header button; its tests change accordingly. The reconnect + add affordances all live on the rail.

**D5 — Mock sidebar until task 6.**
Switching folders swaps `activeId` only; the sidebar keeps rendering `mockPages`/`mockJournal` (App passes them unchanged) until PLAN task 6 replaces them with per-folder indexes. Selection resets on switch (`setActive(null)`), per F5.

**D6 — JSdom tests extend the existing fake handle.**
No new deps. `fakeHandle.ts` gains `isSameEntry` (identity via a test-assigned `_id`); `handleStore` gains the registry API with the same `typeof indexedDB === 'undefined'` guard (D4 of open-folder-flow: real round-trip deferred to task-6 e2e). Added value: a small in-memory registry stub for `handleStore` in tests keeps the hook tests decoupled from IDB entirely.

## Risks / Trade-offs

- [Fake-vs-real IDB drift (registry shape)] → Real round-trip exercised at task-6 e2e, same strategy as open-folder-flow; the shape is a trivially-assertable put/get/delete.
- [Duplicate-pick dedup misses without `isSameEntry` in older Chromium] → `isSameEntry` is baseline FSA (Chrome 86+); fallback when missing: skip dedup rather than throw.
- [Switching resets selection, users may expect per-folder memory] → Accepted per F5; trivial to add a `Map<folderId, pageId>` later if it annoys.
- [Denied folders vanish silently at boot] → Accepted per F3, matches shipped behavior; revisit only with real-user feedback.

## Migration Plan

Runs only for anyone who used the app before this change: the old `handles` row keyed `'vault'` is cleared on first load (idempotent, one delete). Otherwise no migration — the registry is additive.

## Open Questions

None — decisions F1–F5 from exploration are locked; task 6 owns per-folder indexes.