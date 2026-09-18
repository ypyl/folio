## Context

See `proposal.md` for why. What the design has to work with:

- `Graph.assets` (`src/vault/index.ts`) is already the vault's `assets/` inventory, path-ordered, computed once per scan for the sidebar's Assets section. `assetName(path)` is already the one label rule for such a file. Neither changes.
- `searchDocs` (`src/search/core.ts`) returns `SearchResult` carrying `kind: Page['kind']`, and `topPerGroup` caps *per `kind`* with no knowledge of which kinds exist. `SearchResultsView` derives its group headers from `kind` the same way.
- `searchDocs` treats a `text` match as optional: a title-only match simply contributes no ranges, `snippetSegments` falls back to the opening lines, and `firstMatchLine` returns null so no line badge renders.
- `App` already holds the corpus memo (`useMemo` on `[graph]`), already routes a search result through `handleSelect` (which sets `mode` back to `'page'` and opens the page), and already owns `handleOpenAsset` — the ADR-0021 file-open gesture, unchanged since `add-asset-navigation`.
- `rowLabel` (`src/components/months.ts`) maps a result to its display label from `kind`.
- Nothing in the app reads an asset's bytes except the open gesture, on demand (ADR-0022).

## Goals / Non-Goals

**Goals:**

- A file under `assets/` is findable by the name a user half-remembers, from the one surface that is already the app's "find the thing" gesture.
- The third result kind costs the search layer nothing: no new corpus source, no new derived data, no ranking change, no per-keystroke work.
- Selecting an asset result does what every other surface does with an asset row: opens the file and changes nothing else.

**Non-Goals (design-level):**

- Matching anything but the label. No reading bytes, no metadata from the file, no extension as a separate searchable field.
- A second corpus, a second Fuse, or a separate asset search surface.
- Any asset action other than open (no rename, delete, reveal, or preview).

## Decisions

### D1. The corpus gains one document per asset, and it carries no text

```
  SearchDoc { path, title, kind, text }
                 |
                 |  page/journal  -> title = page title,   text = page content
                 |  asset         -> title = assetName(p), text = ""      <- never read
                 v
  SearchKind = 'page' | 'journal' | 'asset'
```

`text` is the empty string, not a placeholder: the existing title-only path already handles empty text end to end (no ranges, no line, no content to quote), so nothing in the ranking or snippet machinery needs an asset branch. The label is `assetName(path)` — the path inside `assets/` — because that is what the sidebar shows and it makes a subfolder name findable (`2026/q3-report.pdf` matches both `q3` and `2026`).

`Graph.assets` rather than `Graph.files`: the Assets section lists one folder (ADR-0022), and a file the pane can open from a link yet that lives elsewhere stays unlisted there. Search matches the listing, so the two surfaces agree on what "the vault's files" means.

No `FUSE_OPTIONS` change. An asset matches on `title` at weight 3, exactly as a page-title match does, so the weights still mean what they say: a name match outranks a body match, whichever kind it belongs to. Cross-kind score order is nearly moot anyway, because both surfaces group before they paginate.

### D2. The third kind earns grouping, capping, and labelling for free

`topPerGroup` counts by `kind`; `SearchResultsView` renders a header where `kind` changes. So one entry in each surface's kind list, plus `rowLabel`, is the whole presentation change:

```
  dropdown / results view            kind list               label
  -----------------------------      -------------------     ------------------------------
  Pages    ...                       'page'                  page title
  Journal  ...                       'journal'               pretty date
  Assets   ...                       'asset'                 path inside assets/  (new)
```

An asset row renders no snippet. `MatchBody` shows the snippet when `result.text !== ''` rather than whenever `snippetSegments` returns anything, because an empty document still yields one empty segment — which would otherwise render an empty element per row.

### D3. Selection branches on the result's kind, and the branch is the whole behavioral change

```
  row activated (click, or Enter on the active row)
        |
        +-- kind === 'asset'  -> handleOpenAsset(path)     [new]  opens the file, changes nothing
        |
        +-- otherwise         -> handleSelect(path)                navigates, leaves the results view
```

`handleOpenAsset` is the existing gesture: it reads the file through the storage seam and hands the bytes to the browser (ADR-0021). It touches no navigation, draft, trail, or search state, which is what the spec requires — so the results view must *not* close for an asset, since nothing navigated and there is no page to return to. For pages and journal days the existing rule stands: `handleSelect` sets the mode back to `'page'`.

The corpus therefore has to carry the kind to the point of activation. `App` memoizes `SearchDoc[]` (pages and assets) and both surfaces receive an `onOpenAsset` beside the existing `onSelect`, so no surface has to guess from a path whether a row is a file or a note.

### D4. No ADR of its own

The change composes three decisions that already exist — ADR-0022 (an asset is a file, not a page, and is never interpreted), ADR-0021 (opening a vault file is a derived copy), and the search capability's own grouping rule. The only record that becomes incomplete is ADR-0021's enumeration of the surfaces its open gesture appears on: it lists a Ctrl+Click in the editor and a click on an Assets or References row, and a search result is now the third. That enumeration is corrected in ADR-0021 rather than superseded by a new record, because the decision itself does not change.

## Risks / Trade-offs

- [A large `assets/` folder grows the Fuse corpus] → accepted and bounded: one document per file, carrying a title and an empty string, built once per graph. The pool is the same one the sidebar already renders, and nothing is read from disk for it.
- [An asset named like a page competes for the same query] → accepted: both are shown, under their own group headers, which is exactly the information the user needs to choose between them.
- [The results view stays open after opening an asset, unlike after opening a page] → deliberate and spec'd: the view is a place you are, and opening a file in a new window or as a download does not leave it. Closing it would strand the query with no page behind it.
- [`MatchBody` changes for every result, not just assets] → accepted, and it is a one-condition guard (`text !== ''`) that makes the component's own contract clearer: a snippet is shown when there is text to snip.
- [The label includes the extension and any subfolder] → deliberate: it is the sidebar's label, and stripping the extension would make two files (`report.pdf`, `report.docx`) read identically in the one place a user is choosing between them.
