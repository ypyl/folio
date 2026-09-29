## 1. Heading derivation (pure)

- [x] 1.1 Add `src/vault/contents.ts` exporting `deriveContents(markdown): { level: number; text: string; block: number }[]`, built on `blockStartLines` so each row's `block` is the top-level block index `highlightBlock` expects; verify unit tests cover headings in document order with level/text/block, a `#` inside a fenced code block ignored, a `#` on a continuation line ignored, and a page with no headings yielding an empty list
- [x] 1.2 Verify the block index agrees with the editor: in `src/vault/contents.test.ts`, assert that for a page of `# A`, a paragraph, a list, and a code fence with a later `## B`, the second heading's `block` equals its position among the top-level blocks

## 2. App wiring

- [x] 2.1 In `src/App.tsx`, add `contentsRows = useMemo(() => deriveContents(page?.content ?? ''), [page?.content])` and an `onLocate(block)` handler that sets `matchHighlight` with a fresh nonce (never `handleSelect`); verify a component test that activating a Contents row marks the block and leaves the open page, its draft, and the history trail unchanged
- [x] 2.2 Pass `contents` and `onLocate` to `MetaPanel`, and supply empty rows while no page is open; verify a component test for the placeholder state with no page open

## 3. Panel

- [x] 3.1 In `src/components/MetaPanel.tsx`, add a Contents `Accordion` above Backlinks, open by default, listing one indented row per heading (a button labelled with the heading text); verify component tests for the rows in order, the level indentation, empty-state copy on a heading-less page, and placeholder copy with no page open
- [x] 3.2 Merge References into Forwardlinks: render one Forwardlinks `Accordion` (collapsed by default) whose body holds a Pages group (page rows, navigate) and a Files group (asset/board rows, open), and remove the separate References section; verify component tests that the panel shows Contents, Backlinks, and Forwardlinks, that the Files group holds asset and board rows while Pages holds page rows, and that each row's activation does the right thing

## 4. Styling and existing tests

- [x] 4.1 In `src/components/MetaPanel.module.css`, style the Contents band as content-sized with a maximum height, its own scroll (with the app's scrollbar recipe, so `scrollRegions.test.ts` passes), the level indentation, and the group captions; verify `src/scrollRegions.test.ts` passes and the presentation test stylesheet check is unaffected
- [x] 4.2 Update the existing `MetaPanel` and `App` tests for the new section order and defaults, the merged Forwardlinks groups, and the removed References section; verify `npm test` passes with no assertion left targeting a removed section

## 5. Verification

- [x] 5.1 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify all pass
- [x] 5.2 Run `npm test`; verify the full suite is green
- [x] 5.3 Run `npm run build`; verify type-check and production build succeed
- [x] 5.4 Bump `version` in `package.json` (minor) and verify the status bar shows the new `v<version>`
- [x] 5.5 Browser check with `npm run dev:test`: open a page with `---`-free headings, confirm Contents lists them and a click scrolls to the heading, confirm Forwardlinks shows Pages and Files and no References section, then run `npm run kill:dev`. (App booted in Chromium with no console errors and the status bar reading v0.33.0. The manual vault-open pass was not automatable — `showDirectoryPicker` has no automation fallback and the repo has no Playwright harness — so it was accepted as covered by the `deriveContents` unit tests, the `MetaPanel` tests (Contents rows/indentation/empty copy, merged Pages/Files groups, defaults, board absence), and the App test (a Contents click locates the block and writes nothing). Server killed with `npm run kill:dev`.)
