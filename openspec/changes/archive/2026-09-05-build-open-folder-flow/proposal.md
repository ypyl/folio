# build-open-folder-flow

## Why

Folio has a `VaultStorage` seam and a working FSA transport (`build-fsa-storage`), but no way for a user to actually open their folder. The app is stuck on mock data until a real vault can be chosen, persisted, and restored across reloads.

## What Changes

- Add an **Open folder** control in the header (`Header`'s currently empty slot).
- Boot flow: restore the previously picked folder handle from IndexedDB; if permission is still granted, reopen the vault silently on reload.
- Reconnect flow: when a stored handle has `prompt` permission, re-grant on the stored handle (`requestPermission`) instead of re-picking.
- Picker flow: when no stored handle exists (or it is denied/dead), `showDirectoryPicker` picks, saves the handle to IndexedDB, and opens.
- While a vault is open, the header shows `folder-name · N files` (folder name + open-time snapshot from `list('')`); clicking it re-picks to switch folders.
- Until a folder is open, the mock vault keeps showing (sidebar/editor unchanged — the swap to real pages is task 6, scan+parse+index).

## Capabilities

- **New Capabilities**: none
- **Modified Capabilities**: `vault-storage` — add persistence/restore/reconnect requirements to the existing picker-factory contract.

## Impact

- `src/vault/handleStore.ts` (new): single-entry IndexedDB save/load/clear of the `FileSystemDirectoryHandle`.
- `src/vault/useVault.ts` (new): hook owning open/mock state, boot restore, and the click flow (reconnect vs picker).
- `src/vault/fs.ts`: `FileSystemVaultStorage` exposes `readonly root` so the picker result's handle can be persisted (interface `VaultStorage` unchanged).
- `src/components/Header.tsx` + `Header.module.css`: slot becomes the open-folder control/status.
- `src/App.tsx`: wires `useVault()`, passes vault status to `Header`.
- No new dependencies, no new ADR (0002 FSA, 0010 composition, 0013 path contract cover this; permission-boundary behavior extends the note in build-fsa-storage design.md).