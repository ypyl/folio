# scan-parse-index — Tasks

## 1. Parser

- [x] 1.1 Create `src/vault/parse.ts`: pure `parseLinks(content: string): Link[]` extracting both Folio reference forms (`#word`, `#[[Page name]]`) per ADR-0012/page-references, tracking the lexical form (`'word' | 'bracketed'`), trimming bracket whitespace, and collapsing duplicate references to the same page. Verify: new `src/vault/parse.test.ts` covers both forms, duplicate collapse, plain `[[Page]]`/`#tag/word` non-forms, bracket whitespace, and word-boundary behavior
- [x] 1.2 Move the shared reference token regex out of `MarkdownPreview` into `parse.ts` and have `MarkdownPreview` import it, so rendering and indexing tokenize identically. Verify: existing `MarkdownPreview.test.tsx` still passes unchanged

## 2. Indexer

- [x] 2.1 Extend `src/page.ts` with `path` (vault-relative, ADR-0013 form) on the shared `Page` type; add the index's own shapes (`Link`, `Graph { pages, byName, backlinks }`) in `src/vault/index.ts`. Verify: `npm run build` passes
- [x] 2.2 Implement `buildIndex(storage: VaultStorage, previous?: Map<string, number>)` in `src/vault/index.ts`: `list('')`, filter to pages (`.md` case-insensitive, no hidden segments — design D4), read content, derive title (stem, final `.md` only) and kind (`journals/` prefix → journal), parse links. Verify: new `src/vault/index.test.ts` covers scan-scope scenarios (nested file page, non-md excluded, upper-case `.MD`, hidden paths excluded, single/multi-dot stems, journal vs page kind, root `journals.md` is a page)
- [x] 2.3 Add reference resolution and backlink folding: `byName` map keyed lowercase (first-by-path-sort wins case collisions), `backlinks` keyed by lowercase target with self-references excluded (self-links still count as outgoing). Verify: `index.test.ts` covers case-insensitive resolution, missing-target references are recorded without needing a page, case-only collision picks the first path, backlinks include all lexical forms, page does not backlink itself
- [x] 2.4 Implement `refreshIndex` as a diff-rescan: walk `list('')` against the previous `Map<path, lastModified>`, re-read+parse only new/changed paths, drop removed ones, and update the folder's file snapshot. Verify: `index.test.ts` covers file added externally, file modified (links + backlinks update), and file removed (page disappears) — using the fake's `lastModified` (task 2.5)
- [x] 2.5 Extend `src/vault/fakeHandle.ts`: `FakeFileHandle` gains a `lastModified` timestamp that changes on content write (settable for test control). Verify: refresh-diff tests in 2.4 exercise changed/unchanged paths through it
- [x] 2.6 Extend `VaultStorage` with `stat(path): Promise<number>` (last-modified time, ms epoch), implement it in `FileSystemVaultStorage` (via `getFile().lastModified`), and mirror it in the fake handle — the diff-rescan (2.4) compares mtimes, which `read/write/delete/list` do not expose. Verify: `stat` exercised by buildIndex/refreshIndex tests and covered in the `vault-storage` delta spec (updated in this change along with proposal.md)

## 3. Hook and triggers

- [x] 3.1 Create `src/vault/useIndex.ts`: `useIndex(storage: VaultStorage | undefined)` returning the folder's `Graph`; idle (no build, no listeners) when `storage` is undefined; rebuild from empty when `storage` changes; bind diff-refresh triggers (window `focus`, `visibilitychange → visible`, 30s interval gated on `document.visibilityState`), tearing all down on change/unmount. Verify: new `src/vault/useIndex.test.ts` (fake timers + focus/visibility events, no storage → idle, storage swap → fresh build, interval only while visible)
- [x] 3.2 Refactor `src/page.ts` usage in `App.tsx`: drop `mockVault` imports, call `useIndex(activeFolder?.storage)`, keep mock-era `useVault` wiring unchanged. Verify: `npm run build` and `npm run lint` pass; mock references in `App.tsx` are gone

## 4. UI wiring

- [x] 4.1 Update `Sidebar` to key rows by `page.path` and check active state by path equality instead of object identity; props shape otherwise unchanged. Verify: sidebar tests and the rewritten `App.test.tsx` assert active-row marking by path
- [x] 4.2 Update `App` navigation to `activePath` state: resolve the open page from the active folder's graph each render (editor pane shape unchanged), keep last-known content if the page vanished in a refresh, reset selection on folder switch (existing behavior), and switch the header count for the active folder to the live `graph.pages.size`. Verify: folder-switch resets the open page; header shows live count in `App.test.tsx`
- [x] 4.3 Implement the no-folder empty state: with no active folder, sidebar sections render empty and the editor shows the "Open a folder to begin." variant; with a folder open but nothing selected, the brand empty state stays. Verify: `App.test.tsx` covers both variants and the folder-open-nothing-selected case

## 5. Cleanup, docs, and gates

- [x] 5.1 Delete `src/mockVault.ts` (and its `MockPage` type), lifting its portable content into real `.md` fixture files via `buildTree` in `App.test.tsx`, and rewrite the static-navigation tests: real index pages listed after opening a folder, real journal entries listed, empty states, open/swap/active-marking by path. Verify: `npm run test` green with 80% coverage thresholds intact
- [x] 5.2 Amend `adr/0004-in-memory-vault-index.md`: pages keyed by path with a lowercase-name resolution index; page content resident in memory; external changes via diff-rescan (focus/visibility/periodic refresh) as the chosen mechanism. Verify: file updated and consistent with design D1-D3
- [x] 5.3 Grep gates and full gates: nothing outside `src/vault/` imports `parse`/`index`/`useIndex` except `App.tsx`; no `mockVault` references remain; no new dependencies. Verify: `npm run lint`, `npm run build`, `npm run test`, and `openspec validate` all pass