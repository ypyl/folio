## Context

The header search currently runs a single capped pipeline: `searchDocs` in `src/search/core.ts` filters to the full AND-term match set, sorts by relevance, then truncates each kind-group to `PER_GROUP = 20`. The dropdown (`SearchBox.tsx`) renders the truncated list and prints a static note when capped. The main pane today has exactly one content mode — a page or blank draft rendered by `EditorPane` (ADR-0005 three-pane layout). Motivation is in proposal.md; the required behavior is in the search delta spec.

## Goals / Non-Goals

**Goals:**
- One source of truth for the query and the search run; the dropdown and the results view are two views of the same result set.
- The results view is transient pane content — no vault writes, no new route or file type (ADR-0001: Markdown canonical).
- No new dependencies; bounded DOM via pagination instead of virtualization.
- Existing dropdown launcher behavior and tests change as little as possible.

**Non-Goals:**
- No result filtering, sorting toggles, saved queries, or search analytics.
- No change to Fuse config, scoring, or the AND-term model.

## Decisions

**D1 — Split result computation from capping.** Refactor `search/core.ts` so the full, relevance-sorted match list is returned, and per-group capping moves to the caller. The dropdown slices the top `PER_GROUP` per group (current numbers preserved); the results view paginates the full list. The alternative — two search runs — was rejected: it risks divergent results and doubles work on every query.

**D2 — The header input stays the single query owner.** Query state stays in `SearchBox`-adjacent state lifted to `App` for this change (or `SearchBox` keeps it and reports results up — decided during implementation by whichever keeps `App`'s pane switch smallest). One `searchDocs` run per debounced query feeds both surfaces. Editing the query while the results view is open re-runs and re-renders both; a run with zero matches closes the results view and shows the dropdown's empty state.

**D3 — Pane mode, not a new page type.** `App` gains a content mode: `page` (existing) or `results` (new). In results mode the main pane renders `SearchResultsView` instead of `EditorPane`; opening a result switches back to `page` mode for that path. The results view is plain derived UI, never persisted — the same category as an unmaterialized journal day. This is the first non-page content mode in the main pane; ADR-0005 gets a consequences note during apply.

**D4 — The see-all row doubles as the return path.** The pin row (count + "See all N results", always shown when a query has matches) opens the results view. Because opening a result already keeps the query (spec'd today), Cmd+K → activation returns to the results view with no extra chrome. Alternative — a back button/breadcrumb in the pane — rejected to keep the editor surface untouched.

**D5 — Pagination at 50/page with a numbered pager.** Previous/Next plus page numbers and a "1–50 of 214" range line; pager hidden when the set fits one page; page change resets scroll to top. Chosen over "load more" (deterministic position/count are better for survey work at 1000+ pages) and over virtualization (no library, and 50 rows keeps React rendering and snippet computation cheap — the dropdown already renders that many).

**D6 — Keyboard parity.** Arrow Up/Down move an active row within the current page, Enter opens it, Escape closes the view back to the previously open page. Wrapping and hover-sync reuse the dropdown's existing patterns; page-boundary navigation stays mouse-driven (no auto-advance) to keep the active-row model simple.

**D7 — Meta panel is empty in results mode.** The right pane shows backlinks/forwardlinks for an open page; with no open page in results mode it falls back to its existing empty state. No new metadata surface.

## Risks / Trade-offs

- [A common term can match hundreds of pages in a 1000+ corpus] → Pagination bounds the DOM to 50 rows; the full list is computed once per query run on a debounce, and Fuse over ~1000 docs is well under the 120 ms budget (`ignoreLocation`, fixed corpus). Revisit only if a query with ~1000 matches measurably stalls.
- [Results view and dropdown can both allocate snippet segments per row] → At 50 rows/page it is negligible; snippets reuse `snippetSegments` unchanged.
- [Pane-mode switch touches the App/EditorPane seam] → The switch is a conditional at the pane slot; `EditorPane` itself (keyed by path, Milkdown lifecycle) is untouched.
- [Old note text is spec-removed; any test asserting it must be updated] → Covered in tasks; the capped-group test changes to assert the see-all row instead.

## Migration Plan

Local-first single window; no data migration. Behavior lands with the change. Rollback is a revert of the change commit; the delta spec inversion restores the note behavior.

## Open Questions

None blocking. Page size 50 is assumed and stated in the spec; adjust in tasks if a later performance check disagrees.