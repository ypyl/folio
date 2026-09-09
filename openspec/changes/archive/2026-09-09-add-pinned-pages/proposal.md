## Why

The sidebar's Pages list is alphabetical and static: a page you owe work on sinks out of sight the moment you stop looking at it, and there is no way to say "this one needs me" other than remembering it. Pages are the working set, but nothing surfaces the working set — and the list never reflects what you actually touched recently. A lightweight **pin** (star) is the small, honest mechanism: star a page, it sits at the top until the work is done, then unstar. No task states, no new section — the star keeps it in the list it already lives in, and the file system already records the edited time that orders the rest.

## What Changes

- **Pinned pages** — a page can be pinned (starred) and unpinned. Pin state is an ordered list of page paths, persisted **inside the vault** in a hidden meta file (`.folio/pins.md`), so pins ride with the folder, survive reopening, and are rebuildable by scanning (ADR-0001). The line order of that file *is* the pin order — most recently pinned first — so no timestamps are needed.
- **Pinned pages stay in the Pages list, marked with a star.** No new sidebar section. Rows keep their place in the literal list; pinned rows float to the top in pin order, each showing a filled star; unpinned rows reveal an outline star on hover to pin.
- **Pages list ordering** — pinned pages first (pin order), then the remaining pages by **last-edited time descending**. "Created date" is deliberately dropped: the File System Access API exposes no creation time, and last-edited is the working-set signal that matches the pin's purpose (the plan's original "date created" heading is corrected here).
- **Stars are pages-only** — journal days (calendar) and assets are not pinnable; search results and the meta panel are untouched.
- **New ADR-0015**: the `.folio/` directory is the first app-owned artifact inside the user's vault — the ADR records the carve-out to ADR-0001's "every file belongs to the user" reading and the rules that come with it (dot-directory, invisible to index and search, always rebuildable).

No **BREAKING** changes: no Markdown on disk changes, no new syntax, no document-model change (ADR-0009), no existing behavior removed — ordering rules that were previously unspecified simply become specified.

## Capabilities

### New Capabilities

- `pinned-pages`: pin and unpin pages from the sidebar, the on-screen star treatment, the pinnable set (pages only), and pin ordering (file order, most recent first). Also covers the persistence contract: pins live in a hidden in-vault meta file that never appears as a page or search result and is picked up even when edited externally.

### Modified Capabilities

- `static-navigation`: the Pages section gains a specified ordering requirement — pinned pages first (pin order), then remaining pages by last-edited descending — where listing was previously order-unspecified.
- `vault-index`: the in-memory index exposes each page's last-modified time on its page record (the file system already scans it for diffing; it just never reaches components), and derives the ordered pins list from the vault meta file as part of the disposable index state (ADR-0004), refreshed on the same triggers.

## Non-goals

- **No todo/task semantics** — no done/undone, no priorities, no progress. A pin means "needs attention"; the work being finished is expressed by unpinning (this keeps ADR-0006 scope guardrails and ADR-0009's no-hidden-metadata rule intact).
- **No new sidebar section** — pinned pages live in the Pages list with a star, per the user's explicit reframe; no empty-state chrome, no collapse behavior.
- **No journal-day pins** — journal days live in the calendar, not the Pages list; the pin affordance therefore applies to pages only.
- **No pin affordance on the open page** — the editor has no title bar today; adding one is a separate change. Pinning happens from the sidebar row.
- **No "created date"** — unavailable from the file system and deliberately not emulated with app-recorded first-seen state (which would be app-only state or misleading for pre-existing vaults).
- **No stale-pin pruning** — a pin whose page file is removed externally renders nowhere and stays harmlessly in the file until the page exists again (self-healing).
- **No search results ordering change** — search stays relevance-ordered per its spec; the journal calendar is untouched.

## Impact

- **Index layer** (`src/vault/index.ts` + tests): `IndexPage` gains `lastModified` (plumbed through `buildIndex`/`upsertPage`/`carryOver`); the index reads `.folio/pins.md` (guarded read — missing meta file is fine) into an ordered `pins: string[]`, watched by the existing mtime snapshot; a write-through path persists pin edits, mirroring `upsertPage`.
- **Storage seam** — no `VaultStorage` contract change: `read`/`write`/`stat` on a hidden path suffice (ADR-0013); missing-file `read` rejection is the guard.
- **App composition** (`src/App.tsx`, `src/vault/useIndex.ts`): expose `pins` and a stable `togglePin`/`setPins`; compute the ordered Pages list (pinned segment + last-edited segment) at the composition layer — components stay dumb and receive sorted arrays (ADR-0010).
- **Sidebar** (`src/components/Sidebar.tsx` + `Sidebar.module.css`): rows restructure from a single button into a flex row (nav button + star toggle button) — required because nested interactive elements inside a button are invalid — with a filled star on pinned rows and a hover-revealed outline star on unpinned ones; `aria-pressed` on the star.
- **Docs**: new ADR-0015 (in-vault meta file); DESIGN.md gains a short note on the star glyph and row iconography.
- **Specs**: new `pinned-pages` delta plus ordering/index deltas to `static-navigation` and `vault-index`.