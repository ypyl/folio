## Why

A vault's files are findable by opening the sidebar's Assets section and scrolling it. Nothing else reaches them. Search answers "where is the thing I half-remember" for notes and journal days, and answers nothing for a vault holding a hundred attachments, several of which nobody remembers the folder of. Once a file's link is deleted from every page it referenced, search is the only gesture that *could* find it, and today it returns nothing, so the file is effectively lost inside its own vault.

The sidebar row label is already the right query key — the path inside `assets/`, so `2026/q3-report.pdf` — and the index already derives that inventory (`Graph.assets`) for the Assets section. What is missing is search coverage of it.

## What Changes

- **Assets join the search corpus by name.** Every file under `assets/` becomes a search document whose searchable field is its label, the path inside `assets/` (`assetName`), so both the file's own name and its subfolder are matched. No asset's contents are ever read: ADR-0022 refuses interpreting them, and the index holds no bytes.
- **A third result group.** The dropdown and the results view render Pages, Journal, and Assets, in that order. An asset row is labelled with its path inside `assets/` and carries no snippet, because there is no text to quote; the existing title-only path already tolerates empty text and already suppresses the line badge.
- **Selecting an asset result opens the file.** This is the one new behavior on the search surface: a page result navigates, an asset result opens the file exactly as its sidebar row does (ADR-0021). The dropdown closes and keeps the query; the results view stays open, because nothing navigated and no other app state may change.
- **No new syntax, no new surface, no new derived data.** The corpus is still built once per graph, the groups are still derived from the result's kind, and the per-group cap already works off that kind.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `search`: the matching requirement covers the vault's assets by name; the grouping requirement gains the Assets group and its label rule; the selection requirement gains opening a file in place of navigating.

## Non-goals

- **No asset content search.** No reading, indexing, or tokenizing of a file's bytes; an image, a PDF, and a ZIP with the same name are equally findable and equally opaque.
- **No files outside `assets/`.** The pool is `Graph.assets`, the same inventory the sidebar's Assets section lists (ADR-0022). A file the pane can render or open from a link but that lives elsewhere in the vault stays unsearchable, exactly as it stays unlisted.
- **No asset pages, and no change to the reference namespace.** A result row is not a page record: it gains no editor content, no backlinks, no pin, no draft (ADR-0022).
- **No new search mode, filter, or scope toggle.** No "search files only", no extension filter, no `type:` operator. One query, three groups.
- **No asset preview in a result row.** No thumbnail, no image mark, no metadata beyond the label. A row says what the file is called and where it lives.
- **No rename, move, delete, or reveal-in-folder action from a result.** Opening is the whole verb (ADR-0021).
- **No change to ranking weights or to the ≥3-character term rule**, so a name shorter than three characters stays unfindable exactly as a page title does.
- **No change to search's keyboard model**, the see-all handoff, or pagination; the new group's rows are reached, capped, and paged by the existing rules.

## Impact

- `src/search/core.ts` — the result kind widens beyond `Page['kind']` to name the asset kind; the document shape gains it.
- `src/App.tsx` — the memoized corpus gains one document per asset, derived from the graph it already has; the open handler branches, opening a file instead of navigating for an asset result.
- `src/components/SearchBox.tsx`, `src/components/SearchResultsView.tsx` — the third group in the dropdown and the full view.
- `src/components/months.ts` — `rowLabel` covers the asset kind (its label is the path inside `assets/`, not a date and not a filename stem).
- `src/components/MatchBody.tsx` — an asset row renders its label and no snippet.
- Vault layer: nothing. `Graph.assets`, `assetName`, and the binary open path all exist.
- Specs: `search` (delta). ADR-0021's enumeration of the surfaces that open a vault file gains its third (a search result); no new ADR is needed, and ADR-0022's negatives are preserved. `PLAN.md` gains one numbered task, and `package.json` 0.13.0 → 0.14.0.
- No index change and no derived data: the corpus is rebuilt only when the graph identity changes, asset documents carry no text, and nothing joins the keystroke path.
