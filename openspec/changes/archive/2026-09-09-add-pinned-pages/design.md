## Context

See proposal.md for motivation and the specs for the requirement contract. Relevant current state:

- `VaultIndex { graph, snapshot }` where `snapshot: Map<path, lastModified>` is already scanned for every page (diff-rescan). `IndexPage = Page & { links }`; `Page = { path, title, kind, content }` — no timestamp reaches components.
- `isPagePath` already excludes any path with a hidden segment (and `assets/`), so `.folio/` is invisible to the index and search for free.
- `VaultStorage.read` rejects on missing files (ADR-0013) — a missing meta file is a *guarded* case, not an error.
- Sidebar receives `pages` and renders one `<button>` per row; App builds the array and passes it down (ADR-0010 — components never touch storage or the index).

## Goals / Non-Goals

**Goals:**

- Pin state rides with the folder (rebuildable by scanning), stays invisible to pages/search, and survives reopen — all per ADR-0001 and the new ADR-0015.
- One read/write path for pins folded into the existing index machinery rather than a second watcher.
- Sidebar stays presentational: ordering lives at the composition layer.

**Non-Goals:**

- No task states, no separate pinned section, no journal/asset pins, no pin affordance on the open page (see proposal Non-goals).
- No `VaultStorage` contract change: read/write/stat on a hidden path is sufficient (ADR-0013).

## Decisions

**D1 — Meta file: `.folio/pins.md`, an ordered Markdown list of page paths.**

```md
# Pinned pages — order is pin order, most recent first

- rag-evaluation
- projects/roadmap
```

- Prepend on pin, remove on unpin → the file's line order *is* "most recently pinned first"; no timestamps.
- `.folio/` is already excluded from the index/search by the hidden-segment rule; a single dot-directory gives future app-owned meta files one namespace.
- Markdown list (not JSON) so any editor can read/reorder it sensibly.
- `parsePins` keeps only lines that are valid page paths (`isPagePath`) — a junk line is ignored; a hand-inserted **journal day** path is a valid page path and parses, but the Pages section filters `kind === 'page'`, so it renders nowhere (pins are pages-only by UI, design D2).
- *Alternatives rejected:* a root-level `favorites.md` (would index as a real page), in-page markers (ADR-0012 reference collision; ADR-0009), IndexedDB (app-only state, lost outside Folio — decision made in exploration).

**D2 — Pins store paths, not names.** The Pages list is keyed by vault-relative path (ADR-0004 D1); two files can share a stem (`a/Ideas.md`, `b/Ideas.md`). Paths disambiguate stars; star lookup is `Set(path)` membership. Root pages read as bare stems, which keeps hand-editing friendly. Name-based resolution (byName) rejected: ambiguous under duplicate stems.

**D3 — Pins ride `VaultIndex` (ADR-0004).** `VaultIndex` gains `pins: string[]`. `buildIndex` reads `.folio/pins.md` with a guarded read (missing file → `[]`); the meta file's path is tracked in the same mtime `snapshot` so refresh re-derives pins only when the file changed — external edits get picked up exactly like page changes. A write-through `upsertPins(storage, current, pins)` mirrors `upsertPage`: write → stat → update in-memory, non-optimistic. `parsePins(content)` keeps only lines that are valid page paths (`isPagePath`), preserving order — junk lines are dropped, never rendered.

**D4 — `lastModified` on `IndexPage`.** `IndexPage = Page & { links, lastModified }`, filled from the already-scanned stat in `buildIndex`, `upsertPage`, and `carryOver`. Alternatives rejected: exposing `VaultIndex.snapshot` to components (index-internal concern), sorting inside the index (ordering is presentation).

**D5 — Ordering at the composition layer.** App partitions the page list into pinned (pin-file order) and rest (lastModified desc, tiebreak path asc) and passes the sorted array to Sidebar. `useIndex` gains `pins` and a stable `togglePin(path)` (mirroring `savePage`), and persists via `upsertPins`. App also derives the status-bar pin state: `pinned` = the open page's path is in `pins`; `canPin` = page mode with a file-backed `kind === 'page'` open (present in the graph) — journal days, unmaterialized pages, and the results view disable the toggle (pinned-pages spec).

**D6 — Affordance in the status bar; pinned rows styled, not iconed.** The pin toggle is a compact star button in the **StatusBar's leading corner, before the file path** — always rendered (stable position), `disabled` when the open surface cannot be pinned, `aria-pressed` for state, labelled "Pin/Unpin <name>". Sidebar rows stay **single navigable buttons with no icon**: a pinned row is marked by the row's own style — a bolder, near-black title — exposed via `data-pinned`; unpinned rows render normally. A shared `StarIcon` component (filled/outline) serves the status-bar button. *Alternatives rejected:* the star as a row control and as a row icon (user feedback: the 26px slot on every row takes too much space and the icon is unwanted — the pinned state is shown by the row's style instead), and a separate pinned section.

## Risks / Trade-offs

- **mtime is a leaky "last edited"** — a trivial save or an external tool's touch floats a page up. → Accepted: matches "touched" semantics; tiebreak by path keeps it deterministic; the search surface remains the finder for old pages.
- **First app-owned file inside the user's vault** — `.folio/` may surprise. → ADR-0015 records the rules (dot-name, invisible to pages/search, always rebuildable); one namespace, documented.
- **Pin whose page file is removed externally** renders nowhere. → Accepted (self-healing; spec'd); no pruning machinery.
- **Two code paths writing to the folder** (pages, pins) — both go through `VaultStorage`, both non-optimistic, both healed via stat. → Mirrored shapes (`upsertPage`/`upsertPins`) keep the discipline uniform.

## Migration Plan

Nothing to migrate: the meta file did not exist, empty default is `[]`, and reverting the change leaves `.folio/pins.md` as an inert text file in the vault. Docs: add ADR-0015 during this change; DESIGN.md gains a short star/row-iconography note.

## Open Questions

None — deferrable visual detail only: the exact star glyph geometry is settled at styling time within Kami tokens (ink-blue accent for the filled star, `--stone` for the outline), not a spec or approach question.