# Tasks

## 1. One number, counting notes

- [x] 1.1 In `useVault`, count notes instead of files: rename the folder record's
  `fileCount` to `noteCount` and fill it from the folder listing filtered by the
  index's own `isPagePath`, at all three sites (boot restore, activating a granted
  folder, opening a folder). Verify `useVault.test.ts` with note paths in its
  fixture, and a new test that opens a folder holding notes, an image asset, a
  board, and `.folio` state and asserts the pre-index `noteCount` equals
  `buildIndex(storage).graph.pages.size`; it fails against the old file count.
- [x] 1.2 In `App`, pass the record's `noteCount` for the pre-index value and keep
  `graph.pages.size` once the index is ready. Verify `App.integration.test.tsx`:
  a folder holding the fixture's notes, an asset, and a board shows
  `notes (8 notes)` — the notes alone — which is the number the pre-index count
  already reported (pinned to the index's own page count in 1.1).
- [x] 1.3 In `StatusBar`, rename the prop to `noteCount` and say `notes` in the
  vault text's tooltip. Verify `StatusBar.test.tsx`: the vault group reads
  `notes (12 notes)` with `notes` twice, keeps `Â· 12`, and still renders no
  control.

## 2. Docs and version

- [x] 2.1 Update the status bar's header comment and `useVault`'s comment about
  the count so both say notes and name the rule. Verify DESIGN.md needs no change
  (nothing about the count's look changes).

- [x] 2.2 Bump `version` in `package.json` (patch) and verify the status bar's
  version badge reads the new build.

## 3. Integration verification

- [x] 3.1 Run the whole unit and integration suite, `npx tsc -b`,
  `npx oxlint --deny-warnings --format=agent`, `npm run fmt:check`, and
  `npm run build`; verify all green.

- [x] 3.2 Run the whole e2e suite; verify all green and sweep left-over dev servers
  with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review, syncing the modified
  `workspace` requirement into the main spec.
