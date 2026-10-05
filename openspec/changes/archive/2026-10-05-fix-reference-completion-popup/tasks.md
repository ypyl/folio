# Tasks

## 1. Stop CodeMirror re-filtering the rows

- [x] 1.1 In `completionSource` (`src/editor/codemirror.ts`), add `filter: false`
  to the board, page, and file `CompletionResult`s. Verify with unit assertions
  that each trigger kind returns `result.filter === false`, and that a fixture
  where the typed text (`#rea`, `assets/q`) does not fuzzy-match the label still
  yields the row.
- [x] 1.2 Add a mounted-adapter test that types `#rea` and asserts
  `completionStatus(view.state)` is open and `currentCompletions(view.state)`
  holds the fixture pages in the app's order, then accepts the first row and
  asserts the written token and caret. Verify the test fails before 1.1 and
  passes after.

## 2. Refuse to complete inside code

- [x] 2.1 In `completionSource`, resolve `syntaxTree(state).resolveInner(pos)`
  after a trigger matches and return null when an ancestor is `FencedCode` or
  `InlineCode`. Verify a mounted-adapter test places `#rea` inside a fenced block
  and inside inline code and asserts `completionStatus` is not open, while the
  same prefix in prose still opens the popup.
- [x] 2.2 Verify the boards and file-destination triggers still complete outside
  code with a test per kind, so the guard is not over-broad.

## 3. Integration checks

- [x] 3.1 Run `npx oxlint --fix` and `npm run fmt`, then
  `npx oxlint --deny-warnings --format=agent`; verify both are clean.
- [x] 3.2 Run `npm run test:unit`, `npm run test:integration`, and `npm run
  build`; verify all pass.
- [x] 3.3 Start `npm run dev:test`, open a folder, type `#` plus a page's first
  letters in the editor, and confirm the popup lists matching pages and accepts
  one; confirm a `#` inside a fenced block shows no popup. Sweep the server with
  `npm run kill:dev`.
- [x] 3.4 Increment `version` in `package.json` (patch) and verify the status
  bar's version badge names the new build.
