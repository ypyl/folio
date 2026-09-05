# Tasks

## 1. Folder registry

- [x] 1.1 Rewrite `src/vault/handleStore.ts` from the single `'vault'` key to a registry: `handles` store keyed by `crypto.randomUUID()` with rows `{ id, name, handle }`, plus a `meta` store row `lastActiveId`. Export `listVaultHandles()`, `saveVaultHandle(row)`, `clearVaultHandle(id)`, `getLastActiveId()`, `setLastActiveId(id)`. Keep the `typeof indexedDB === 'undefined'` guard; clear a legacy `'vault'` key at open. Verify: `npm run build` and `npm run lint` pass; `handleStore` tests (if any) updated to the registry API.
- [x] 1.2 Extend the shared fake in `src/vault/fakeHandle.ts` with `isSameEntry(other)` (identity via a test-assigned `_id`) and snapshot-friendly `name`. Verify: `npm run test` — existing fs/useVault suites still pass with the extended fake.
- [x] 1.3 Add a small in-memory registry stub for `handleStore` in tests (a `vi.mock` factory implementing `listVaultHandles`/`saveVaultHandle`/`clearVaultHandle`/last-active over a `Map`), so hook tests never touch IDB. Verify: used by 2.1's suite; no `indexedDB` references leak into tests.

## 2. Hook state machine

- [x] 2.1 Rewrite `src/vault/useVault.ts`: return `{ status: 'restoring' | 'ready', folders, activeId, addFolder, activate }` where each folder is `{ id, name, permission, storage? }`. Boot loop restores every granted stored folder (silent reopen, last-active wins — granted count only for the active folder), holds prompt-permission folders without storage, drops denied ones; `status` flips to `'ready'` when resolution ends. Verify: `src/vault/useVault.test.ts` covers every delta scenario — several granted + last-active, pending reconnects via `activate` without re-pick, additive add, denied dropped while others reopen, active name+count in header state, no stored folder stays mock, re-pick dedups via `isSameEntry`.
- [x] 2.2 `activate(id)`: for a prompt folder run `requestPermission` on the stored handle; granted → open its storage, denied/failed → drop the row and fall back to `addFolder`'s picker path (the shipped denied-drop logic, now per-folder). Verify: hook test set: activating a prompt folder requests permission and opens without picker; failing re-grant drops and shows the picker.
- [x] 2.3 `addFolder`: wrap `pickVaultFolder`, dedup against existing handles via `isSameEntry` (activate existing instead), save row, `setLastActiveId`, activate. Verify: hook test set: new pick adds and activates and persists last-active; re-pick dedups with no duplicate.

## 3. Rail + header wiring

- [x] 3.1 Create `src/components/FolderRail.tsx` + `FolderRail.module.css`: 56px column, `+` add button at top (dashed border), one avatar per folder (first letter on a warm surface — monochrome, Kami palette only, per-folder hues dropped per ui-shell's no-second-chromatic-color rule), the active folder gets a brand ring, prompt-permission folders a dashed hollow-ring marker; no entries while `status === 'restoring'`. Verify: `Header.test.tsx`-style component test renders nothing while restoring, one avatar per folder, active ring, `+` fires `onAdd`, avatar click fires `onActivate`.
- [x] 3.2 Update `Header.tsx` (+ module CSS and tests): slot is display-only — shows `name · count` for the active folder, nothing otherwise; drop `onOpenFolder`. Verify: header tests updated; no `Open folder` button remains anywhere.
- [x] 3.3 Wire `App.tsx`: mount rail as the leading workspace column, pass `folders`/`activeId`/`addFolder`/`activate`; `setActive(null)` on folder switch; sidebar keeps rendering mock pages. Update `src/index.css` and header grid to `56px | 240px | 1fr | 220px`. Verify: App tests — rail renders in mock state, clicking `+` with stubbed picker adds and activates, switching folders resets the open page.
- [x] 3.4 Grep gate: only `App.tsx` imports `useVault`/`handleStore`/`FolderRail` outside `src/vault/` and `src/components/FolderRail.*`; no header still calls into the vault hook. Verify: `grep -rn "useVault\|handleStore" src --include="*.tsx" --include="*.ts"` shows only App (and vault internals).

## 4. Gates

- [x] 4.1 Green gates: `npm run lint`, `npm run build`, `npm run test` (with 80% coverage thresholds), `openspec validate build-folder-rail`. Verify: all pass with no new deps and no ADR changes.