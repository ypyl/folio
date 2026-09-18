## 1. Search core (no DOM)

- [x] 1.1 In `src/search/core.ts`, add `export type SearchKind = 'page' | 'journal' | 'asset'` and use it for `SearchDoc.kind` and `SearchResult.kind` in place of `Page['kind']`. Verify with `npx tsc` and the existing `search/core` tests.
- [x] 1.2 Add `assetSearchDoc(path: string): SearchDoc` beside the types: `title = assetName(path)`, `text = ''`, `kind = 'asset'`. Verify with unit tests that the label is the path inside `assets/` (including a nested path) and that `text` is empty, so nothing downstream can search bytes.
- [x] 1.3 Confirm the empty-text path needs no ranking or snippet change: unit-test that a document with `text: ''` matching only on `title` yields a result with no ranges, and that `firstMatchLine` returns null for it. No `FUSE_OPTIONS` change.

## 2. Presentation (search surfaces)

- [x] 2.1 `src/components/months.ts`: `rowLabel` covers the asset kind, returning the result's `title` (already the path inside `assets/`), so no new labelling rule is introduced. Verify with unit tests for all three kinds.
- [x] 2.2 `src/components/MatchBody.tsx`: render the snippet only when `result.text !== ''`. Verify with a test that an asset result renders its label and no snippet element.
- [x] 2.3 `src/components/SearchBox.tsx`: take the corpus as `SearchDoc[]` (App builds it), render the third group (`Pages`, `Journal`, `Assets`) in the dropdown, and accept an `onOpenAsset` handler beside `onSelect`. Verify in `src/components/SearchBox.test.tsx` that an asset match renders under an `Assets` header with its path label, and that activating it calls `onOpenAsset`, not `onSelect`.
- [x] 2.4 `src/components/SearchResultsView.tsx`: add the third group to the flat list and the header label, and branch `onEnter` and the row click on `kind` — an asset opens and leaves the view open; a page navigates. Verify in `src/components/SearchResultsView.test.tsx` that an asset row keeps the view mounted and a page row closes it.

## 3. Wiring

- [x] 3.1 `src/App.tsx`: build the corpus in the existing memo as `SearchDoc[]` — one document per page plus one per `graph.assets` entry via `assetSearchDoc` — and pass `onOpenAsset={handleOpenAsset}` through to the search surfaces. Verify in `src/App.test.tsx` that a query matching an asset shows the row and opens the file through the vault's binary read, with the open page unchanged.
- [x] 3.2 Confirm the corpus is still built once per graph: assert by call count that a keystroke does not rebuild it, and that a `graph` identity change rebuilds it exactly once (mirroring the existing pool assertion).

## 4. Verification and release

- [x] 4.1 Walk every scenario in the `search` delta and confirm each is covered by a test or verified by hand. The scenarios to name: match by name, match by subfolder, contents never matched, a file outside `assets/` not searchable, the Assets header and label, no snippet and no line, an asset result opening in both surfaces, the results view staying open, and the unreadable-file case.
- [x] 4.2 Run `npx oxlint --fix`, `npm run fmt`, `npm test`, and `npm run build`; then `npx oxlint --deny-warnings --format=agent` clean.
- [x] 4.3 Correct ADR-0021's enumeration of the surfaces that open a vault file: a search result joins the Ctrl+Click in the editor and the click on an Assets or References row. No new ADR.
- [x] 4.4 Bump `package.json` to 0.14.0 (new user-facing capability) and add the numbered task to `PLAN.md` describing what shipped.

- [ ] 4.5 (left for the user's own browser session) Open a vault holding a nested asset and a page, search the asset's name, and confirm the Assets group with its path label; select it and confirm the file opens while the open page stays behind it; repeat from the full results view and confirm the view stays open; search a word that appears only inside a file's bytes and confirm nothing matches.
