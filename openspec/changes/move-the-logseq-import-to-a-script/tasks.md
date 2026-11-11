# Tasks

Note: `AGENTS.md` bumps `version` in `package.json` on every commit — a minor bump
for this change (a capability leaves the app).

## 1. The script

- [x] 1.1 Add `scripts/import-logseq.ts` with a `NodeVaultStorage` over
  `node:fs/promises` (read, write, read/write binary, recursive list, stat,
  remove; the ADR-0013 path contract; writes create parents) and an
  `importLogseq(sourceDir, destDir)` that runs the existing `runLogseqImport`
  with the source's basename. Verify the adapter with a script integration test.
- [x] 1.2 Add the CLI: two positional folders, `--help`, a refusal of the same
  source and destination, the report printed, non-zero exits. Add
  `"import:logseq": "tsx scripts/import-logseq.ts"` and the `tsx` dev dependency.
  Verify `npm run import:logseq -- --help` and a real run against a temp graph.
- [x] 1.3 Add the integration test: a small Logseq graph in `os.tmpdir()`
  (page, journal, asset), run the script, assert the Folio outputs, the ledger,
  the untouched source, and that a second run reports the source as already
  imported and writes nothing new. Clean the temp folders up.

## 2. The app loses the import

- [x] 2.1 Delete `src/components/LogseqImport.tsx`, its stylesheet, and its
  test; remove the component's import and usage from `App` (the import view, its
  state, the brand action, the main-pane branch, the item key) and the tests that
  drive the flow. Verify the app builds and the remaining tests pass.
- [x] 2.2 Remove `pickSourceFolder` from `src/vault/fs.ts` and
  `addFolderFromHandle` from `src/vault/useVault.ts` (no remaining caller), and
  verify with `tsc -b`.
- [x] 2.3 Remove `brandAction` from `EditorPane` and its test; the brand actions
  are the reconnect, the open-folder action at compact, and the demo. Verify the
  brand-screen tests.

## 3. Documentation and the install surface

- [x] 3.1 Replace the in-app import steps in `README.md` and
  `MIGRATION_LOGSEQ_FOLIO.md` with the script's command and its requirements
  (Node, `npm install`, the two folders, re-runs and the ledger). Update
  `NOTES.md` entries that describe the in-app import.
- [x] 3.2 Regenerate the manifest's phone screenshots, since the brand screen
  lost a button, and confirm the manifest still serves them.

## 4. Integration checks

- [x] 4.1 Run `npx oxlint --fix`, `npm run fmt`,
  `npx oxlint --deny-warnings --format=agent`, `tsc -b`, `npm run build`, and the
  full `npm test`; confirm all are clean.
- [x] 4.2 Run `npm run test:e2e` and confirm the whole suite passes.
- [x] 4.3 Run the script once against a real temp Logseq graph with `--help` and
  a normal run, and confirm the destination opens in the app.

## Workflow follow-up

- Archive the change after the checks pass, syncing the main specs and deleting
  the retired `import` spec file if the archive leaves it empty. Bump the version
  again.
- Push `master` to `origin` and `nas`.
