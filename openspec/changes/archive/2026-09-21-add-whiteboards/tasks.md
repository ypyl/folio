## 1. Dependency and spike

- [x] 1.1 Add `@excalidraw/excalidraw` to `package.json` and confirm install succeeds and the peer range accepts the project's React 19 (`npm ls @excalidraw/excalidraw react`).
- [x] 1.2 Spike the asset path: load the board component from a throwaway route, set the package's asset path so its fonts resolve under Vite's `base`, and confirm a board renders with its hand-drawn font in the dev server. Verify by screenshot/DOM check; record the exact wiring in a code comment. (design D6)

## 2. Vault layer: board tokens and inventory

- [x] 2.1 Extend `REF` in `src/vault/parse.ts` with the `#!` word and bracketed alternatives ahead of the page word form, keep the existing lookbehind/lookahead guards, and make `findReferenceRanges` report a `kind` of `'page' | 'board'`. Verify with unit tests for `#!Migration`, `#![[Migration topology]]`, and the non-matches `#!`, `#!/bin/bash`, `#Migration`, `#[[Migration]]`, and a token inside a code span.
- [x] 2.2 Add a board-reference extractor that records each board name once per page in lexical-form order, mirroring `parseLinks`. Verify with unit tests for both forms, dedupe, and non-board forms.
- [x] 2.3 Add `isBoardPath(path)` (under `boards/`, `.excalidraw`, no hidden segment) and `listBoards(files)` to `src/vault/index.ts`, ordered by path, beside `isPagePath`/`listAssets`. Verify with unit tests for nested paths, hidden segments, and a `.excalidraw` outside `boards/`.
- [x] 2.4 Add `boards`, `boardsByName`, and `boardReferrers` to `Graph`, built in `fold`/`buildIndex` from the page scan already taken. `boardsByName` resolves case-insensitively with first-by-path winning, like `byName`. Verify with unit tests: a board resolves, a missing name stays a valid reference, and `boardReferrers` inverts the tokens.
- [x] 2.5 Ensure the incremental scan carries boards over when only a page's mtime is unchanged and refreshes them when `boards/` changes. Verify with an index test that adds and removes a board file and re-scans.

## 3. Editor layer: badge and completion

- [x] 3.1 Render a board-reference badge over the token's literal text, visually distinct from a page badge, reusing the existing badge pass and its reference-equality short-circuit. Verify with a `milkdown` test that a `#!Migration` token gets a badge and a code-span token does not (spec: badge distinct and inert-to-the-file).
- [x] 3.2 Route board-badge activation to the board open handler, so a click opens the board rather than navigating to a page. Verify with an `EditorPane` test that activation calls the board opener with the token name.
- [x] 3.3 Extend the reference-completion trigger to `#!` / `#![[`, offering `boardsByName` candidates ranked as pages are, and write the canonical token in the on-disk casing and the trigger's lexical form on accept. Verify with a `referenceSuggest` test: a prefix offers matching boards only, accept writes `#!Migration`, and it opens nothing.

## 4. Board view and save lifecycle

- [x] 4.1 Add `src/editor/boardView.ts` (or a component module) that dynamically imports `@excalidraw/excalidraw`, mounts the board from a scene string, and sets the asset path from task 1.2. Verify with a `mount` test using a fake scene (the real component is exercised in the browser check).
- [x] 4.2 Implement the element-only change filter and a debounced saver that writes `serializeAsJSON(...)` through `VaultStorage.write`, mirroring `src/editor/saver.ts`. Verify with unit tests: an element change schedules one write; a camera-only change schedules none; a failed write leaves the file unchanged.
- [x] 4.3 Implement delayed creation: a board whose file is absent opens blank and writes `boards/<name>.excalidraw` on first save. Verify with a board-view test that opening creates no file and the first change writes exactly one.
- [x] 4.4 Route a `.excalidraw` vault path to "open board" in the vault layer beside `openVaultTarget`, so the extension decides the view. Verify with `assetOpen` tests: a `.excalidraw` path returns the board route, other paths keep the existing tab/download behavior.

## 5. App wiring

- [x] 5.1 Widen `App`'s open state to `{ kind: 'page' | 'board', path }` and its mode to `'page' | 'results' | 'board'`, rendering the board view in board mode. Verify with an `App` test that opening a board replaces the editor and opening a page replaces the board.
- [x] 5.2 Store a kind on each `history.ts` entry and make Back/Forward reopen a board or page accordingly. Verify with a `history`/`App` test that Back from a board returns to the page and Forward returns to the board.
- [x] 5.3 Include the board's path in the status bar's path group and reflect the board save state in its status group. Verify with a `StatusBar`/`App` test for a board breadcrumb and a save state.

## 6. Surfaces

- [x] 6.1 Add the sidebar's Boards band, windowed like Pages and Assets, with empty-state copy, an active marking for the open board, and loading placeholders. Verify with a `Sidebar` test for path order, activation, the active row, and bounded rows at scale; assert the memoized sidebar still skips re-rendering while typing.
- [x] 6.2 Add the meta panel's "Referenced by" section for board mode from `boardReferrers`, with a navigating row and empty-state copy. Verify with a `MetaPanel`/`App` test.
- [x] 6.3 Add boards to the search corpus as title-only documents with an empty `text`, a Boards group and label, and board-result selection. Verify with `search/core` and `SearchResultsView` tests: a board matches by name, its contents are never matched, the group and label render, and selecting it opens the board.

## 7. Offline install

- [x] 7.1 Exclude the board chunk and its fonts from the Workbox precache glob in `vite.config.ts` (design D6). Verify by building and inspecting `dist/sw.js`/the precache manifest for the absence of the Excalidraw chunk and fonts, and by confirming the app boots offline with a board unopened.

## 8. Decisions and docs

- [x] 8.1 Amend ADR-0006 to record that whiteboards are in scope, with the reason and date. Verify the ADR's status list and table stay consistent.
- [x] 8.2 Amend ADR-0012 to describe two reference kinds (page and board) distinguished by the `#!` marker. Verify the record's decision text states both kinds.
- [x] 8.3 Write a new ADR for the board file kind (a non-Markdown document the app parses, edits, and writes under `boards/`), with alternatives considered. Verify it is added to `adr/README.md`'s table with the next free number.
- [x] 8.4 Add a numbered `PLAN.md` entry for the shipped feature and bump `package.json`'s `version` (minor). Verify the version badge renders `v<version>`.

## 9. Verification

- [x] 9.1 Run `npx oxlint --fix`, `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`, and `npm run build`. Verify all pass with no warnings.
- [x] 9.2 Run the full test suite (`npm test`) and confirm the new board tests pass with no regressions in the page/asset/search tests.
- [x] 9.3 Browser check on a fresh `npm run dev:test` server: create a board from a `#![[New]]` token in a page, draw, confirm `boards/New.excalidraw` on disk, confirm the Boards band, the Referenced by row, the search result, Back/Forward, and the status bar, and confirm pan does not write. Run `npm run kill:dev` afterward. Verify against the spec scenarios; record the measurements or observations.
