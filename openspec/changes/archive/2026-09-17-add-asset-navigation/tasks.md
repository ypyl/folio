## 1. Vault layer: destination extraction

- [x] 1.1 Add `parseAssetPaths(content)` to `src/vault/parse.ts` (design D3): scan each `](`, balanced-paren scan to the matching `)`, unwrap `<...>`, strip a trailing quoted title, percent-decode with a raw fallback, keep only `isVaultRelative` destinations, dedupe in order of appearance. Verify with unit tests in `src/vault/parse.test.ts` covering link and image forms, repeats, external URLs and fragments, `assets/my%20report.pdf`, `assets/100% done.pdf`, and `assets/a (draft).pdf`.
- [x] 1.2 Extract `hasHiddenSegment(path)` in `src/vault/index.ts` and use it from both `isPagePath` and the new file-listing filter. Verify the existing `src/vault/index.test.ts` hidden-path scenarios pass unchanged.
- [x] 1.3 Extend the index (design D1, D2): `IndexPage.assets` = `parseAssetPaths(content)` candidates; `Graph.files` = every non-hidden path from the existing `list('')`; `Graph.assets` = the sorted `assets/`-prefixed subset. Keep `assets` on carried-over pages, and re-derive `files`/`assets` on every scan. Verify with `src/vault/index.test.ts`: candidates are reported in order, a date-named `.md` under `assets/` is not a page, an unchanged page keeps its candidates across a refresh, and `files` loses a path deleted externally.

## 2. Opening a vault path

- [x] 2.1 Move `src/editor/assetTarget.ts` to `src/vault/assetOpen.ts` and split `openVaultTarget` (classify an href, then delegate) from `openVaultPath` (path used literally, no decoding), moving `isVaultRelative` in with it and updating `src/editor/assetImages.ts`. Verify the moved unit tests pass, and add a case asserting `openVaultPath('assets/100% done.pdf')` reads that literal path while `openVaultTarget` still decodes a Markdown destination.
- [x] 2.2 Update the editor's imports (`src/editor/inlineDecorations.ts`, `src/editor/milkdown.ts`) and confirm no editor behaviour changed: the existing editor, badge, and asset-open tests pass unmodified.

## 3. Sidebar: bands and the Assets listing

- [x] 3.1 Give `Accordion` the opt-in sidebar variant (`bodyClassName`, so a section's body can be the flex/scroll box) without changing how `MetaPanel` renders; the scroll container, its ref and its scroll handler stay in `Sidebar`, which owns them. Verify `Accordion` usage in `MetaPanel.test.tsx` is unaffected.
- [x] 3.2 Restructure the sidebar into bands (design D5): a fixed controls row, Journal sized to content, Pages and Assets `flex: 1 1 0` with a minimum-height floor and their own scroll bodies, every summary rendered in every state, Assets collapsed by default. Verify with `Sidebar.test.tsx` cases: all three summaries render collapsed, collapsing Assets expands Pages, and the controls stay in the document while a listing scrolls.
- [x] 3.3 Move the windowing measurement from the `<aside>` to the Pages body and add the Assets listing as a second `windowPieces` consumer (no `keep`). Verify `src/components/pageWindow.test.ts` is unchanged, and add Sidebar cases asserting a bounded row count with thousands of pages and thousands of assets.
- [x] 3.4 Add the `assets` and `onOpenAsset` props to `Sidebar`, with `EMPTY_ASSETS` in `App` for the no-graph state and a `useCallback` handler; extend the memo's prop-stability comment. Verify a Sidebar test asserts rows come from the prop and that activating one calls `onOpenAsset` with the asset path.

## 4. Meta panel and app wiring

- [x] 4.1 Add `kind` to `LinkRow` and `onOpenAsset` to `MetaPanel` (design D6): asset rows open, page rows navigate, asset rows are never dimmed, and both share the alphabetical order. Verify with `MetaPanel.test.tsx` cases for the merged ordering, the click routing, and no dimming on an asset row.
- [x] 4.2 In `App`, build the Forwardlinks rows from `page.assets` filtered by `graph.files.has(path) && !isPagePath(path)` (design D1), labelled with the file name, and wire `onOpenAsset` to `openVaultPath` with the active storage's `readBinary`. Verify with an app-level test that a page linking a PDF lists it in Forwardlinks and that activating it calls the opener without changing the open page.
- [x] 4.3 Render the Assets empty state and the loading skeleton, per the `vault-assets` and `ui-shell` requirements. Verify with Sidebar cases for the empty folder copy and the indexing placeholders.

## 5. Docs, verification, and archive

- [x] 5.1 Bump `package.json` to 0.10.0, add the numbered `PLAN.md` task entry, and add the revision note to task 23's "the sidebar is still the only scroll region" claim. Verified by reading the diff.
- [x] 5.2 Run `npx oxlint --fix`, `npm run fmt`, `npx vitest run`, `npm run build`, and finally `npx oxlint --deny-warnings --format=agent`; all must pass clean.
- [x] 5.3 Browser check with `npm run dev:test` (AGENTS.md): confirm the log says `ready in`, then exercise the three sidebar bands, both scroll regions, an asset click from the sidebar and from Forwardlinks, and the empty/loading states; finish with `npm run kill:dev` and confirm no `node.exe` from the check survives.
- [x] 5.4 Measure at scale — 10,000 pages and 1,000 assets — that the rendered row count stays bounded, that scrolling reaches the last row of both listings, and that typing in a long page still costs what it did (the keystroke path gained nothing). Record the numbers in the change.
- [x] 5.5 Sync the deltas into `openspec/specs/` and archive the change, summarizing what shipped, what was verified, and the follow-up (asset backlinks, deferred by ADR-0022).
