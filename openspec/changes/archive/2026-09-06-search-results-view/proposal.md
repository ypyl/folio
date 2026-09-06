## Why

Search is becoming a knowledgebase tool, not just a page launcher. Today the header dropdown caps matches at 20 per group and only prints a passive note, so a half-remembered page that ranks at position 23 is invisible — the user must keep guessing queries instead of scanning the full match set. There is no surface to survey every place a concept appears.

## What Changes

- The search dropdown keeps its launcher role (top matches per group, keyboard-first) but its truncation note becomes an actionable handoff: a pinned "See all N results" row that opens a full search results view when matches exist.
- A new **search results view** in the main pane shows the complete, uncapped match set for the current query — Pages and Journal groups with sticky headers, match snippets, relevance ordering — paginated (50 rows per page) to keep the DOM bounded at knowledgebase scale.
- The results view is transient pane content: it is never written to the vault (Markdown stays canonical, ADR-0001), it does not change the folder, and it needs no backend.
- Opening a result from the results view behaves exactly like opening from the dropdown or sidebar today (editor pane, query kept in the header); a journal day without a file opens blank and materializes on first write.
- The query in the header input is the single source of truth: typing re-runs search, the dropdown shows top matches, the results view shows all of them; Cmd+K after opening a result returns to the results view via the same pinned row.
- Keyboard behavior extends to the results view: arrows move the active row, Enter opens it, Escape leaves the results view. Pagination navigates with Previous/Next controls.
- **BREAKING** (spec-level): the existing "groups are capped with a note" requirement is replaced by the see-all handoff — the passive "Showing up to 20 matches per section." note is removed.

## Capabilities

### New Capabilities

- None. The results view is part of the existing search capability, not a new one.

### Modified Capabilities

- `search`: the capped-group requirement changes to a see-all handoff (pin row + results view), and a new requirement is added for the search results view (alignment with the plan in ADR-0005: the main pane gains a transient non-page content mode; no layout change).

## Impact

- **Code**: `src/search/core.ts` (uncapped result computation shared by both surfaces), `src/components/SearchBox.tsx` (pin row replaces the note), `src/App.tsx` (pane content mode switching shares the single query/search state), new results-view component, `src/components/SearchBox.module.css`/related styles (DESIGN.md tokens), tests for the new surface.
- **Specs**: delta spec under `openspec/specs/search/spec.md`.
- **ADR**: ADR-0005 (three-pane layout) gains a consequence — the main pane can host a transient, non-file search results mode; noted in the ADR update during apply, no structural change. ADR-0001 (Markdown canonical) is unaffected: the results view is derived UI state, never persisted.
- **Dependencies**: none. Fuse.js already returns the full match set; the 20-cap is app-level slicing. No virtualization library.

## Non-goals

- No saved/persisted searches or query history.
- No search result sorting options beyond relevance (no date/kind sort toggles).
- No kind filters or faceted search (Pages/Journal filtering).
- No full-text search page materialized as a vault file.
- No changes to relevance scoring, term handling, or the AND-term model.
- No graph, tagging, or other Logseq features (ADR-0006).
- No changes to the editor itself; the results view is selection of pane content, not the editor.