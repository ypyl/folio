## Context

See `proposal.md` for motivation. Relevant current state:

- `src/components/Sidebar.tsx` renders three `Accordion` sections (Pages, Boards,
  Assets), each with its own measured scroll body and its own `windowPieces`
  pass, plus a fixed Journal band. `App.tsx` passes `pages`, `assets`, `boards`,
  and `pinnedPaths` as separate props, and memoizes `pages` on `graph`/`pins`
  identity (`App.tsx:691`).
- Ordering lives in `orderPages` (`src/vault/index.ts`): pinned first, then
  last-modified descending, path tiebreak. Boards and assets come from
  `listBoards` / `listAssets`, path-ordered filters over the scanned file set.
- `Graph` holds `pages` (with `lastModified`), `boards: string[]`, and
  `assets: string[]`. There is no last-modified time for boards or assets, and
  ADR-0022 explicitly avoids stat-ing assets.
- Board rows render active marking but are not kept by their window
  (`boardPieces` has no `keep`), so an open board can window out of view.

## Goals / Non-Goals

**Goals:**

- One sidebar listing for the vault's non-journal files, pages first, with the
  boards and assets trailing in path order.
- Keep the single listing windowed, so DOM size does not grow with the vault.
- Keep everything off the keystroke path: no new per-keystroke work.

**Non-Goals:**

- Preserving the old three-section behavior or their independent collapse; that
  is the point of the change.
- Collecting last-modified times for boards or assets; the tail is path-ordered.
- A grouped or interleaved-by-recency ordering.

## Decisions

### D1: One section, one body, one window

Replace the three `Accordion`s with one `Files` section holding one measured
scroll body and one `windowPieces` pass over the merged row array. This deletes
two refs, two `ListView`s, two `windowPieces` calls, and the triple `sameView`
compare. The `ResizeObserver` still watches the sidebar's bands (now two).

Alternative — keep three sections but drop the two empty ones — rejected: that
is the current state with placeholders removed, not a merge.

### D2: Pages lead; boards then assets trail by path

Order is pinned pages (pin order), then pages by last-modified descending with a
path tiebreak (reuse `orderPages` unchanged), then boards in path order, then
assets in path order. The intent is that a user reaches a page without scanning
past files they rarely seek.

Alternative — one recency run over every kind — rejected: it needs a
last-modified time for boards and assets, which the index does not collect, and
which would require widening `VaultStorage` and revising ADR-0022's "no extra
`stat`" for a tail the user rarely opens. Path order for the tail costs zero new
IO.

### D3: The merged rows are built in `App`, memoized on `graph`/`pins`

`Sidebar` receives one `rows` array (each row `{ kind, path, label, pinned? }`)
plus `activePath`. `App` builds and memoizes it on `graph` and `pins` identity,
exactly as `pages` is today. The merge and sort therefore run once per scan and
once per save, never per keystroke (AGENTS.md). Building it inside `Sidebar`'s
render would re-sort on every render and break the budget.

### D4: Kind badges are `b` (board) and `a` (asset); pages unbadged

The page is the default kind, so it carries no mark; the exception is marked.
Badges are a leading, non-interactive span before the label, presentational
only, so the row stays one button.

Alternative — echo the reference grammar (`#!` for boards, a path marker for
assets) — rejected as more visual weight than a rare tail row needs; a single
letter is enough because the row's kind is not primary information here.

### D5: The active-row keeper spans the merged list

The single `windowPieces` call passes `keep` = the index of the active entry,
found by path across all kinds. This keeps an open board's row rendered and
marked, which today's separate board window does not do.

### D6: The section is named "Files"

It is the ADR's own term for the superset (ADR-0024: "a third kind of vault
file"), single-word, and matches the sidebar's title style. Alternative —
"All files" — rejected as wordier for a marginal gain. The meta panel's
Forwardlinks group also reads "Files" but means boards + assets only; the scope
difference is deliberate and recorded in the proposal's non-goals.

### D7: Empty copy only when the whole listing is empty

Drop "No boards yet." and "No assets yet."; show one line only when the Files
listing holds no rows at all. A vault with pages and no boards/assets simply has
no tail.

## Risks / Trade-offs

- **The tail is buried in a large vault** (no top-level summary) → Accepted: the
  tail is the rare case. A sticky group label is the cheap fix if it proves
  needed; not built now.
- **The merged array re-sorts on each save** (graph identity changes) → Same
  cost the Pages sort already carries; still off the keystroke path. Mitigated
  by D3's memoization.
- **"Files" reads differently in the two panes** → Noted in the proposal; the
  visual context (sidebar roster vs one page's links) disambiguates.
- **Losing independent collapse of Boards/Assets** → Intended; the merge is the
  feature.

## Migration Plan

UI-only; no persisted state, no schema, no storage change. Nothing to migrate.
Existing tests that assert three sections or their placeholders are updated to
assert the single Files listing. No rollback beyond reverting the change.
