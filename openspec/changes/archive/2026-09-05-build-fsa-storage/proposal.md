## Why

Folio is Chromium-first and fundamental: the app's whole existence depends on reading, writing, and listing files inside a user-chosen folder via the File System Access API (ADR-0002, ADR-0003). The `VaultStorage` interface exists (ADR-0013, `openspec/specs/vault-storage/spec.md`), but nothing implements it yet — `mockVault.ts` still stands in. Task 4 of PLAN.md makes the seam real: a concrete `FileSystemVaultStorage` backed by `showDirectoryPicker()` + `FileSystemDirectoryHandle`, without yet wiring any UI (that is task 5).

## What Changes

- Add `src/vault/fs.ts` exporting `FileSystemVaultStorage` (implements `VaultStorage`) and a `pickVaultFolder()` factory that opens the OS directory picker and returns a storage bound to the chosen folder.
- Implement the four operations against FSA handles: segment-walking paths (FSA resolves one name at a time), recursive flat `list`, `write` creating missing parent directories, `read`/`delete` rejecting on missing files, `delete` removing directories recursively.
- Path validation per ADR-0013: reject paths with `..`, `.`, empty segments, leading `/`, or absolute forms — never sanitize.
- Add a test file with an in-memory fake of the FSA handle subset, exercising all 11 existing spec scenarios plus the new delete-directory scenario.
- No UI changes; no consumers of `src/vault` yet (grep gate stays clean).

## Capabilities

### New Capabilities
- None — this change implements an existing capability.

### Modified Capabilities
- `vault-storage`:
  - `delete` also removes directories (recursively), not only files — new scenario.
  - New requirement: a picker factory (`pickVaultFolder`) produces a storage whose handle comes from `showDirectoryPicker()` with readwrite mode; permission negotiation stays out of scope (the picker session grants access, reload-restore is task 5).

## Impact

- **Code**: new `src/vault/fs.ts` + `src/vault/fs.test.ts`; `src/vault/storage.ts` unchanged.
- **ADRs**: none new; ADR-0002 (transport choice) and ADR-0013 (contract) already cover this. The permission-boundary decision (class assumes a granted handle; negotiation is the caller's) is recorded in design.md.
- **Behavior**: the vault-storage spec gains one scenario (recursive delete) and one requirement (picker factory).
- **Non-goals**: open-folder button wiring, IndexedDB handle persistence, reload permission prompts, any scan/parse/index behavior (PLAN tasks 5 and 6).