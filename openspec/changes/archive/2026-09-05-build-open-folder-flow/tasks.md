# build-open-folder-flow — Tasks

## 1. Vault modules

- [x] 1.1 Create `src/vault/handleStore.ts`: single-entry IndexedDB shim (DB `'folio'`, store `'handles'`, key `'vault'`) exposing `saveVaultHandle(handle)` / `loadVaultHandle()` / `clearVaultHandle()`, all no-op/null-safe when `indexedDB` is undefined. Verify: `npm run build` and `npm run lint` pass
- [x] 1.2 In `src/vault/fs.ts`, make the root handle a public `readonly root` on `FileSystemVaultStorage` (interface `VaultStorage` unchanged). Verify: `npm run build` passes
- [x] 1.3 Create `src/vault/useVault.ts`: `useVault()` hook with state `'restoring' | 'mock' | 'open'` and `openFolder()` action implementing the boot/click flows in design.md D1 (load → queryPermission → silent reopen; click → requestPermission on stored handle, fall back to picker on none/denied, save new picks). Verify: `npm run build` and `npm run lint` pass

## 2. UI wiring

- [x] 2.1 Wire `Header`'s empty `.slot` to `useVault()` via `App.tsx`: mock state shows an "Open folder" button (aria-label), open state shows `folder-name · N files` (name + `list('')` snapshot) clickable to re-pick, CSS ellipsis with full name in `title`, no control rendered while `'restoring'`. Verify: `npm run build` passes and manual dev check shows both states
- [x] 2.2 Update `App.tsx` to mount `useVault()` and pass vault status to `Header`; mock pages remain the sidebar/editor data source. Verify: existing `src/App.test.tsx` still passes

## 3. Tests

- [x] 3.1 Extend the fake `FileSystemDirectoryHandle` (from `src/vault/fs.test.ts`) with configurable `queryPermission` / `requestPermission` and write `src/vault/useVault.test.ts` covering every delta scenario: granted storage reopens silently on mount, prompt permission reconnects on click without re-picking, a new pick replaces the stored handle, denied/dropped handle falls back to the picker, open state exposes name + count, no stored handle stays mock. Verify: `npm run test` passes with coverage thresholds intact (all new branches exercised)
- [x] 3.2 Add a header-level test (in `App.test.tsx` or a new `Header.test.tsx`) asserting the control shows "Open folder" in mock state and the vault status in open state, with the picker stubbed (`vi.stubGlobal('showDirectoryPicker')`). Verify: `npm run test` passes
- [x] 3.3 Grep gate: nothing outside `src/vault/` imports `useVault` or `handleStore` except `App.tsx`. Verify: `grep -rn "useVault\|handleStore" src --include="*.tsx" --include="*.ts"` shows only `App.tsx`, `useVault.ts`, `useVault.test.ts`, `handleStore.ts`; `npm run lint`, `npm run build`, and `openspec validate` pass