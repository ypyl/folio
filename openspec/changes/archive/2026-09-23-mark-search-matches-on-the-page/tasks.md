## 1. Search carries the matched block

- [x] 1.1 In `src/search/core.ts`, replace `firstMatchLine` with `firstMatchBlock(text, ranges): number | null` (the anchor index), add `block: number | null` to `SearchResult`, and populate it in `searchDocs`. Verify `core.test.ts` covers the block for a multi-block match, the first match, and a title-only (null) case.
- [x] 1.2 In `src/components/MatchBody.tsx`, drop the `firstMatchLine` call and the `· line N` span. Verify the match-body tests assert the label and snippet with no line.

## 2. Selection carries the block

- [x] 2.1 In `src/App.tsx`, extend `handleSelect(path, block?)`, add the `matchHighlight` state with its nonce (set only when a block is passed, cleared otherwise), and pass it to `EditorPane`. Verify an App integration test opens a result and asserts the pane receives the block.
- [x] 2.2 In `src/components/SearchResultsView.tsx` and `src/components/SearchSpotlight.tsx`, pass each page/journal result's `block` to `onOpen`/`onSelect`. Verify the surface tests assert the block is forwarded.

## 3. The editor marks a block

- [x] 3.1 Create `src/editor/searchHighlight.ts`: a plugin whose state is the marked block, a node decoration with class `folio-search-hit`, cleared on any `docChanged`, and a function to set/clear it from the adapter. Verify plugin unit tests cover marking a block, clearing on a document change, and a null/out-of-range request.
- [x] 3.2 Add `highlightBlock(index: number | null): void` to `EditorAdapter`; implement it in `MilkdownAdapter` (dispatch the mark, scroll the block's DOM into view with a guard, schedule the ~2s clear, cancel a pending timer on a new request and on destroy) and in `FakeEditor` (record the call). Verify unit tests cover the fake and the timer behavior.
- [x] 3.3 In `src/components/EditorPane.tsx`, apply the highlight after `setContent` resolves and, for the same page, when the highlight prop changes (gated on a ready flag so a remount does not double-apply). Verify an EditorPane test opens with a highlight and asserts the adapter call.
- [x] 3.4 Add the `.folio-search-hit` wash and fade to `src/components/EditorPane.module.css` (brand tint, text not moved, animation matching the clear timeout). Verify the built stylesheet carries the rule.

## 4. The rail loses its numbers

- [x] 4.1 Rename `src/editor/gutter.ts` to `src/editor/rail.ts` and `updateGutterDom` to `updateRailDom`, writing fold controls only (remove `measureNumbers`, the number spans, and `GUTTER_MARKER_HEIGHT`; keep the arrow centring). Verify `rail.test.ts` (renamed from `gutter.test.ts`) covers arrow placement only.
- [x] 4.2 Remove `getBlockLines` from `EditorAdapter`, `MilkdownAdapter`, and `FakeEditor`; drop the number wiring from `EditorPane`. Verify `tsc -b` and the pane tests.
- [x] 4.3 Narrow the rail and the document's left padding in `src/components/EditorPane.module.css` and remove `.gutterNum`. Verify the built stylesheet has no number rule and a control-only rail.
- [x] 4.4 Update `DESIGN.md`: the line-number entry becomes the rail's fold-control entry, and search matches get a rule. Verify the sections read coherently.

## 5. Verification

- [x] 5.1 Update the affected tests (`core.test.ts`, `MatchBody`/search surface tests, `App.test.tsx`, `EditorPane.test.tsx`, `milkdown.test.ts`) for the removed line numbers and the new highlight. Verify the suite is green.
- [x] 5.2 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npm run build`, and `npm test`; bump `version` in `package.json` (minor). Verify all commands succeed.
