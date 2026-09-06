# scan-parse-index — Design

## Context

See proposal.md — Why. The folder layer is complete (`VaultStorage` seam, FSA transport, multi-folder `useVault`) but the app still renders `src/mockVault.ts`. This change builds the knowledge layer over that seam: scan → parse → index, bound to the active folder, replacing the mock. Specs: `vault-index` (new) and `static-navigation` (revised) define the requirements; ADR-0004 (in-memory index) is amended in this change.

## Goals / Non-Goals

**Goals:**
- A pure parser + an indexer over `VaultStorage` that builds a disposable in-memory graph and refreshes it cheaply
- Per-active-folder binding with no mock path remaining in the app
- Live header count for the active folder; no-folder empty state

**Non-Goals:**
- Write-through/upsert API (nothing writes until task 7; refresh is the only update path)
- FileSystemObserver, IndexedDB index cache, multi-folder simultaneous indexing
- Missing-page UI, chip navigation, search, page creation (later PLAN tasks)

## Decisions

### D1 — Page identity is the path; name is the filename stem
Pages are keyed by vault-relative path (ADR-0013 form); title = stem (strip final `.md` only); kind = `journal` iff path starts with `journals/`. A separate lowercase-name map resolves references (ADR-0012), first-by-path-sort winning case-only collisions.
*Why*: keeps ADR-0012's invariant — the reference text *is* the (potential) filename — and avoids a name↔path mapping that can drift (H1-as-title rejected: two files can share a title, and `reading-list.md` with `# Reading List` inside breaks guessable addressing).

### D2 — The index holds content
`Page = { path, title, kind, links, content }`; scanning reads every indexed file's text into memory.
*Why*: task 12 (Fuse search "over the index") needs content resident to answer per-keystroke without disk reads; page open becomes a synchronous lookup (no loading states); write-through (task 7) updates one object. Cost is memory over `.md` files only — tens of MB at 10k files; revisit only if a pathological vault appears.

### D3 — External changes via diff-rescan, not FileSystemObserver
Refresh = `list('')` walk + diff against a `Map<path, lastModified>` snapshot: read+parse new/changed paths, drop missing ones. Triggered on window `focus`, `visibilitychange → visible`, and a 30s interval gated on visibility, via `useIndex` bound to the active folder's storage.
*Why*: FSO replaces only the *trigger*, not the scan — records are coarse, so list+diff still runs; it adds a streaming batch queue, a reconnect watchdog, per-folder lifecycle, and jsdom fakes for seconds of freshness. Poll-based staleness is never *wrong*, only late, and self-heals each trigger. `File.lastModified` (ms) is a sufficient change hint; a same-ms miss heals one trigger later. Revisit if live multi-editor use demands instant freshness.

### D4 — Scan scope: `.md` only, no hidden segments
A path is a page iff it ends `.md` (case-insensitive) and no segment starts with `.`. All other files are ignored (assets self-exclude; task 8's `assets/` holds images).
*Why*: one universal rule replaces per-tool ignore lists (other tools' conventions are not features, ADR-0012); dot-directories cover `.obsidian/`, `.git/`, and future in-vault app settings.

### D5 — Graph shape and folding
```
Graph = {
  pages:    Map<path, Page>          // pages keyed by path (D1)
  byName:   Map<lowerName, path>     // reference resolution; first-by-sort wins
  backlinks: Map<lowerName, path[]>  // target -> referring paths, self excluded
}
```
Backlinks exclude the referring page itself (a page does not link back to itself); self-references still count as outgoing. One parse pass produces both directions: links list per page, folded into `backlinks` by lowercase target.

### D6 — Module layout and hook wiring
```
src/vault/parse.ts     pure: markdown string -> Link[]           (regex reuse from
src/vault/index.ts     buildIndex/refreshIndex over VaultStorage   MarkdownPreview,
src/vault/useIndex.ts  storage?: VaultStorage -> { graph, refresh } moved here)
```
`useIndex(activeFolder?.storage)` returns idle when storage is undefined; on storage change it rebuilds from empty (disposable-by-design, so switches are fresh) and rebinds triggers. `App` holds `activePath` (path identity, not object), resolves the current page from `graph.pages` each render, and keeps last-known content if the path vanished in a refresh (don't yank the page from under the user). Row identity and the active check in `Sidebar` become path-based (object identity breaks with re-derived pages).

### D7 — Test strategy reuses the existing fake
`fakeHandle.ts` gains a `lastModified` on `FakeFileHandle` (settable, bumped on write) so refresh-diff tests can simulate external edits. Fixtures are `buildTree` object literals with the mock content lifted into real `.md` names — the fixture the mock module's comment promised. Header count switches from the open-time `fileCount` snapshot to `graph.pages.size` for the active folder; other folders keep their snapshots (non-goal).

## Risks / Trade-offs

- [Poll freshness: external edits lag up to trigger gap] → focus/visibility covers the common return-to-tab flow; 30s interval covers split-screen; index is a disposable projection, staleness is cosmetic, never corrupt
- [`File.lastModified` misses same-ms writes] → self-heals on the next trigger; content is never asserted equal, only re-read
- [Case-only duplicate files are pathological] → deterministic first-by-path-sort winner; documented, no UI
- [jsdom fakes diverge from real FSA/File behavior] → existing strategy (fake-driven unit tests + manual dev pass; Playwright e2e deferred per project convention)
- [Scan cost on huge vaults] → only changed files are re-read on refresh; initial open reads once; no caps introduced (measured problem if it appears)

## Migration Plan

`mockVault.ts` deleted; `App.test.tsx` rewritten against fixtures. Rollback = revert the commit (the mock return is one import swap in App). ADR-0004 amended in the same change: pages keyed by path, content resident, diff-rescan mechanism.

## Open Questions

None — design decisions D1-D7 are locked; all six exploration forks are settled (identity, content residency, watch mechanism, scan scope, no-folder state, per-folder wiring).