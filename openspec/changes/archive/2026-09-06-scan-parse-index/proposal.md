# scan-parse-index — Proposal

## Why

PLAN task 6: the app still runs on a hand-authored mock vault (`src/mockVault.ts`). The folder a user opens is never scanned, parsed, or indexed — the sidebar lists fake pages and the editor shows fake content even with a real folder open. This change builds the real knowledge layer: walk the opened folder, extract pages and page references, and drive the sidebar/editor from the resulting index. It is the step that makes Folio an app over the user's folder instead of a demo over sample data.

Why now: the entire data path is already mock-free except this layer. `VaultStorage` (tasks 3-5) is in place, the reference model is specified (ADR-0012, `page-references` spec), and the mock module was written with the explicit contract that it is deleted when the real index lands.

## What Changes

- **New parser module** (`src/vault/parse.ts`, pure): extracts page references (`#word`, `#[[Page]]`) from a Markdown string per ADR-0012/page-references. No IO.
- **New indexer** (`src/vault/index.ts`): builds the in-memory graph (pages, name-resolution map, backlinks) over a `VaultStorage`, and diff-refreshes it against a `lastModified` snapshot instead of re-reading everything.
- **New hook** (`src/vault/useIndex.ts`): binds the active folder's storage to its graph; rebuilds on folder switch; diff-refreshes on `focus`, `visibilitychange → visible`, and a 30s interval gated on visibility.
- **`src/page.ts` type gains `path`**; pages are identified by vault-relative path, rows keyed by path. `content` stays on the page (resident in the index).
- **`App.tsx` binds the active folder's index** to Sidebar/EditorPane; navigation becomes `activePath` state; no-folder state renders empty sidebar sections and an "Open a folder to begin." editor empty state.
- **Mock deletion**: `src/mockVault.ts` is removed; its content is lifted into the test fixture as real `.md` files.
- **Header count goes live**: active folder's count comes from the index (`graph.pages.size`) instead of the open-time snapshot.
- **ADR-0004 amendment** recording: pages keyed by path (plus a lowercase-name resolution index), content resident in memory, and diff-rescan as the external-change mechanism.
- **BREAKING (internal)**: mock-era App/x tests are rewritten against the index; `static-navigation` spec scenarios change from mock lists to real-index lists.

## Capabilities

### New Capabilities
- `vault-index`: scanning a vault folder into an in-memory graph of pages and references; page identity, kind detection, reference resolution, and incremental refresh. Covers implementation of ADR-0004 + ADR-0012 over a `VaultStorage`.

### Modified Capabilities
- `static-navigation`: the sidebar and editor navigate over the real index when a folder is open; requirement scenarios change from mock-data lists to real-page lists, and the no-folder empty state gains a "open a folder" variant. (The `page-references` spec is not modified: this change implements its forms and resolution rules rather than altering them.)
- `vault-storage`: the seam gains `stat(path)` (last-modified time). The diff-rescan refresh mechanism (design D3, ADR-0004) compares mtimes to skip unchanged files; `read/write/delete/list` expose no timestamp, so the seam is extended rather than reading every unchanged file.

## Non-goals

- No write-through/upsert API — folder writes arrive in task 7 (Milkdown autosave) and will call `refresh`/a future update path then. Nothing in the app writes yet.
- No FileSystemObserver — diff-rescan on window triggers is the mechanism (design decision); revisit only if live multi-editor freshness ever matters.
- No IndexedDB index cache (ADR-0004's optional "may" is deferred; re-scan on open is fast enough).
- No missing-page UI, no click-to-navigate chips (task 9), no search (task 12), no New Page creation (not in PLAN).
- No indexing of non-active folders: other folders keep their existing open-time count snapshot.
- No URL routing; per-folder selection memory; symlink/junction handling.

## Impact

- **Code**: new `src/vault/{parse,index,useIndex}.ts`; touched `src/page.ts`, `src/App.tsx`, `src/components/Sidebar.tsx` (path-keyed rows, path-equality active check), `src/components/EditorPane.tsx` (unchanged shape), `src/components/Header.tsx` (live count), deleted `src/mockVault.ts`.
- **Tests**: rewrite `src/App.test.tsx` around a `buildTree` fixture; extend `src/vault/fakeHandle.ts` with `lastModified`; new `parse.test.ts`, `index.test.ts`, `useIndex.test.ts`. Coverage thresholds (80%) unchanged.
- **Specs**: new `vault-index` delta; revised `static-navigation` delta.
- **Docs**: ADR-0004 amended (path-keyed pages, resident content, diff-rescan).
- **Dependencies**: none added.
- **Related ADRs**: 0001 (folder canonical), 0003 (VaultStorage seam), 0004 (in-memory index), 0012 (unified page references), 0013 (path contract).