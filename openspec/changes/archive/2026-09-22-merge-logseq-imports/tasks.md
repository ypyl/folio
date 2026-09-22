## 1. The ledger

- [x] 1.1 Add read/render/write for `.folio/imports.md` in `src/vault/logseqImport.ts`, keyed `<source folder name>\t<source path>`, and verify unit tests that a missing ledger reads as empty and a written one round-trips
- [x] 1.2 Add the `sourceName` option to `runLogseqImport` and verify the ledger keys carry it

## 2. Merge instead of skip

- [x] 2.1 Drop source files already in the ledger from the plan and count them as already imported, and verify a test that a re-import writes nothing
- [x] 2.2 Append an existing Markdown target (existing text + blank line + incoming) instead of skipping, and verify a test that both graphs' journal and page content survive
- [x] 2.3 Keep assets skipped when present and verify a test that an existing asset is untouched
- [x] 2.4 Persist the ledger as each Markdown file lands, and verify a test that a write failure part-way leaves the already-written files recorded and a re-run appends only the rest

## 3. Report and UI

- [x] 3.1 Add `merged` and `alreadyImported` to `ImportReport` and verify the orchestrator reports them
- [x] 3.2 Show the new rows in `LogseqImport.tsx` and verify the component test for the summary
- [x] 3.3 Pass the source handle's name from `App` and verify the App integration test still imports and opens the destination

## 4. CLI parity

- [x] 4.1 Update `scripts/migrate-logseq.mjs` to append existing Markdown targets and to read/write the same ledger, and verify with a dry run and an apply against a scratch destination

## 5. Verification

- [x] 5.1 Run `npx vitest run src/vault/logseqImport.test.ts src/components/LogseqImport.test.tsx` and confirm every case passes
- [x] 5.2 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, and `npm run build` with no findings
- [x] 5.3 Run `npm test` and confirm the full suite passes with coverage thresholds met
- [x] 5.4 Run `npx openspec validate merge-logseq-imports --strict` and resolve any findings
- [x] 5.5 Bump the minor `version` in `package.json` and commit
