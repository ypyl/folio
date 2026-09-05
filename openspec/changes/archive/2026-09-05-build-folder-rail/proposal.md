## Why

Folio currently supports exactly one open Markdown folder: a single IDB handle, one `OpenVault` state machine, one header affordance. Users with several note folders (home, work, shared) cannot open more than one or switch between them, and the layout has nowhere to host multiple folders.

## What Changes

- New **folder rail**: a narrow 56px column on the far left listing every opened folder as an avatar (first letter), with a `+` button at the top to add another; clicking an avatar makes that folder active.
- **Multi-folder persistence**: the single `'vault'` IDB entry becomes a folder registry (one row per folder, id-keyed) plus a last-active pointer; every granted stored folder reopens silently on load and the last-active one is activated.
- **Per-folder permission lifecycle**: a stored folder with `prompt` permission keeps a marker on its avatar and re-grants (without re-picking) when clicked; `denied` folders are dropped silently at boot, matching the current single-folder rule.
- **Header slot becomes display-only** for the active folder (`name · count`); all add / switch / reconnect actions live on the rail.
- **Layout**: workspace and header grids grow a 56px leading column so pane-to-header alignment is preserved (search stays over the editor column).
- **Switching folders resets the selection**; the sidebar keeps showing the mock vault until the index step lands (per-folder indexes are a task-6 concern, not this change).
- Duplicate picks of the same folder are deduplicated (`isSameEntry`) — re-picking activates the existing entry instead of adding a ghost.

## Capabilities

### New Capabilities
- None — the behavior changes extend existing capabilities.

### Modified Capabilities
- `ui-shell`: layout adds the folder rail as a leading 56px workspace/header column; header slot renders the active vault status only (actions move to the rail).
- `vault-storage`: "Vault selection persists across reloads" and "A picker factory produces a VaultStorage" gain multi-folder scenarios — registry restore of multiple folders, last-active selection, per-folder re-grant without re-pick, duplicate-pick dedup, rail-driven switching.

## Impact

- `src/vault/handleStore.ts` — single `'vault'` key becomes a registry: `handles` store keyed by folder id (row carries name + handle), `meta` store carries `lastActiveId`. DB version 1 (young app, no migration compatibility per ADR-0012).
- `src/vault/useVault.ts` — `{ status, vault, openFolder }` becomes a folders registry + active id; boot restore iterates all stored handles; reconnect flows apply per folder.
- New `src/components/FolderRail.tsx` (+ `FolderRail.module.css`); App wires it; `Header.tsx` slot renders active status only.
- `src/index.css` / `Header.module.css` — 4-column grids (56px | 240px | 1fr | 220px).
- Spec updates in `openspec/specs/{ui-shell,vault-storage}/spec.md` at sync time.
- No new dependencies; no ADR update needed (extends ADR-0003 seam, ADR-0001 cache-only persistence rule for IDB).

## Non-Goals

- Closing/forgetting folders from the rail (dedup exists; removal is a later change).
- Per-folder indexes or per-folder sidebar content — folders share the mock sidebar until the index step (PLAN task 6); switching then becomes a swap of the active folder's index.
- Merged-search across folders; search remains active-folder-scoped.
- Folder renaming, reordering, drag support, unread badges, or the openspec-viewer GitHub link.
- Doubling as the design for task 6 (per-folder index Map is recorded there as the landing spot).