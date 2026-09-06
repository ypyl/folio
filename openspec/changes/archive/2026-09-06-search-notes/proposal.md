## Why

Search is the last open task in PLAN.md. Today the only way to reach a note is scanning the sidebar's page rows or the journal calendar — there is no way to find the day you wrote about a topic, or the page that mentions a term, without knowing its title. Meanwhile the header has shown an inert "Search notes" input since the ui-shell step, explicitly placeholder ("Inert until the search step"). This change makes that input real.

Search is also cheap here by design: the app already holds every page's title and full content in memory (the index graph), so full-text search is pure derivation over the live index — no new storage, no filesystem access, no backend (ADRs 0001/0009, 0003).

## What Changes

- The header search input becomes functional: typing a query deploys a results dropdown directly below the input (overlay style, modelled on openspec-viewer), leaving the sidebar, calendar, and editor untouched.
- The search input's width changes from a fixed centered 480px to filling its header column — the content (editor) column width — so the box and its dropdown line up with the content beneath (pattern: `min(980px, 100%)` in the centered grid cell).
- Full-text fuzzy search over the active vault's index via Fuse.js: page title weighted over content, strict threshold, AND across query terms, per-term exact-range highlighting with fuzzy fallback (openspec-viewer's tested model), 120ms debounce, 3-char minimum term length.
- Results render grouped by kind with sticky headers (Pages / Journal), journal days labelled with their pretty date ("September 2, 2026"), a clamped match snippet with highlighted hits, and a per-group cap with a "showing up to N" note.
- Keyboard interaction: Cmd/Ctrl+K focuses and selects the input; Arrow Up/Down move an active row (hover-synced); Enter opens it; Escape clears query and closes; clicking outside closes but keeps the query; a clear ✕ resets and refocuses. Folder switches reset the query.
- Selecting a result opens that page in the editor pane through the existing selection path (same `handleSelect` primitive the sidebar and calendar use).
- Edge states: no vault open → input disabled; empty query → no dropdown; no matches → "No matches for "<term>"." empty copy.

## Capabilities

### New Capabilities
- `search`: header content search over the open vault's index — the search input's behavior, the results dropdown's anatomy and matching semantics, keyboard interaction, navigation on selection, and edge states (no vault, empty query, no matches).

### Modified Capabilities
- `ui-shell`: the header's search-input requirement changes from "visible but inert" (typing does nothing) to "functional with a results dropdown", and the input sizing requirement changes from a fixed centered box to filling the content column.

## Impact

- **Code**: `src/components/Header.tsx` (input wiring + focus shortcut + clear), a new search component (component + module CSS) owning the dropdown, `src/App.tsx` (query state, memoized Fuse over the live graph — rebuilt on graph identity change so results follow save/refresh, results → `handleSelect`), and the search core helper (Fuse config, AND-term intersection, exact-range/fuzzy-range highlighting, snippet segments).
- **Dependency**: `fuse.js` added to `package.json` (the only new dependency; the stack has anticipated it).
- **Specs**: new `search` delta spec; `ui-shell` delta spec replacing the inert-input requirement.
- **Unchanged**: `VaultStorage`/filesystem layer (ADR-0003), the index model (`src/vault/index.ts` — the graph already carries content), the editor layer (ADR-0010, the deferred in-editor highlight stays out of this change), multi-folder search (active folder only).
- **PLAN.md**: task 11 "Search" gets its `[x]` at archive.
- **No new ADR**: the change sits within existing decisions (derived data only, ADR-0001/0009; keep it small, ADR-0006; editor boundary, ADR-0010).

## Non-goals

- **In-editor match highlighting** — openspec-viewer paints the matched ranges inside the opened document; in Folio that requires a Milkdown decorations plugin crossing the editor boundary (ADR-0010). Deferred to a later change (PLAN Later list).
- **Search across multiple open folders** — only the active folder's index is searchable; other folders are not indexed in memory.
- **Unmaterialized pages** — pages referenced but not yet created do not exist in the index and are not searchable.
- **Ctrl+P hijacking** — the focus shortcut is Cmd/Ctrl+K only; the browser's print dialog is left alone.
- **No query syntax** — no operators, quotes, wildcards; matching is the fixed AND-terms model.
- **No persistence** — no search history, recent searches, or saved queries; the query is session UI state only and resets on folder switch.