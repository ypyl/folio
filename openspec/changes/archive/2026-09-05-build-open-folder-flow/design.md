# build-open-folder-flow — Design

## Context

`build-fsa-storage` shipped `pickVaultFolder()` and `FileSystemVaultStorage`, whose design.md D2 documented the boundary: the picker grants readwrite for the session, and reload-restore permission negotiation belongs to the *caller*. This change is that caller. The app currently starts entirely on mock data (MockPage via `mockVault`); `App.tsx` has no vault concept yet, and `Header`'s `.slot` (grid-column 3, 220px) is empty.

See proposal.md (Why) and the vault-storage delta spec for requirements.

## Goals / Non-Goals

**Goals**
- A reliable open/mock state machine driven by a real user gesture (required by `requestPermission`).
- Minimal surface: one control in the header, two new vault modules, thin App wiring.

**Non-Goals**
- No real-page rendering: sidebar/editor keep the mock vault until task 6 (scan+parse+index).
- No live file count: the header count is an open-time snapshot of `list('')`; the index (task 6) owns live updating.
- No "close vault"/disconnect affordance, no settings UI.
- No IndexedDB polyfill or dependency for tests (jsdom has no IDB; see D4).
- No error banners: permission/cancel failures keep the current state, they never crash.

## Decisions

### D1 — URL-less boot flow: one `useVault()` hook owns the state machine
`App.tsx` mounts `useVault()`, which resolves `'restoring' | 'mock' | 'open'` on mount and exposes a single `openFolder()` action used by the header control.

- Boot: `handleStore.load()` → `null` → `mock`. Handle present → `queryPermission({ mode: 'readwrite' })` → `'granted'` → `open`; else `mock` with the handle retained for reconnect.
- Click (`openFolder()`): stored handle pending → `requestPermission({ mode: 'readwrite' })` → `'granted'` → `open`, `'denied'` → clear store, picker. No handle → `pickVaultFolder()` → save handle → `open`.
- `open` state never shows before the restored result lands (no "Open folder" flicker before a granted handle silently reconnects).

**Alternatives considered:** putting the machine in `App.tsx` directly (rejected: not unit-testable without rendering React) and a class-based store (rejected: a hook with one state enum + one action is the smallest testable shape).

### D2 — IndexedDB holds exactly one entry: the `FileSystemDirectoryHandle` under key `'vault'`
DB `'folio'` v1, object store `'handles'`, single `{ key: 'vault', handle }`. Handles are structured-cloneable by design; the handle survives IDB round-trips while the picker's session grant does not (reads back as `'prompt'`), which is precisely why the boot flow re-checks permission. Folder name for the header comes free from `handle.name` (sync getter), so nothing else is stored. No listings, no metadata, no cache keys.

**Alternatives considered:** storing `VaultStorage` (not cloneable), storing the folder name (redundant), storing file listings (task 6's index).

### D3 — `FileSystemVaultStorage` exposes `readonly root`; `VaultStorage` interface unchanged
The persister needs the raw handle, but `pickVaultFolder()` returns the spec-compliant storage. Fix: the concrete class adds a public `readonly root: FileSystemDirectoryHandle` field; the `VaultStorage` interface (ADR-0003 seam) stays exactly as shipped.

**Alternatives considered:** changing `pickVaultFolder()` to return a pair (breaks the shipped picker-factory spec scenario "resolves with a VaultStorage").

### D4 — No test dependency for IndexedDB: fake the permission API instead
jsdom has no IndexedDB. `handleStore` therefore guards `typeof indexedDB === 'undefined'` → resolve `null`/no-op, which jsdom exercises naturally in every test. `useVault` tests inject a fake `FileSystemDirectoryHandle` (the existing `fs.test.ts` fake, extended with `queryPermission`/`requestPermission` that resolve to configurable states) and drive the whole decision tree: granted-reopen, prompt-reconnect, denied-fallback, cancel. The real IDB round-trip is deferred to the task-6 Playwright e2e pass, exactly like the real FSA cross-check in build-fsa-storage.

**Alternatives considered:** `fake-indexeddb` devDependency (rejected: new dep for ~15 boring lines; the risk lives in the permission machine, which the fakes cover).

### D5 — Single affordance, two modes; count is a snapshot
The `.slot` shows `[ Open folder ]` in mock state; once open it renders `folder-name · N files`, clickable to re-pick (switch), CSS-ellipsized with the full name in `title`. One control keeps the state machine's surface minimal; no separate Switch/Disconnect buttons (YAGNI).

## Risks / Trade-offs

- **fake vs real IDB drift** → `handleStore` is a ~15-line single-entry shim; the task-6 e2e restores a real folder across a reload, exercising the true IDB path.
- **`requestPermission` behavior varies by browser/version** (some Chromium builds auto-grant, some show a prompt) → the machine handles only the two outcomes it can rely on, `'granted'` / `'denied'`; any other result is treated as not-open. Evergreen Chromium assumed (ADR-0002).
- **Count staleness after open** → snapshot accepted by design (non-goal); the index replaces it in task 6.

## Migration Plan

No migration: new capability layered over the existing mock composition. `App.tsx` gains the hook; existing tests keep passing because jsdom's missing IDB resolves to mock state. Rollback = revert the commit; mock vault remains the default when no folder is stored.

## Open Questions

None. (Permission-boundary consistency with the build-fsa-storage design note was checked: this change's reconnect behavior is exactly the "caller negotiates" contract D2 deferred to.)