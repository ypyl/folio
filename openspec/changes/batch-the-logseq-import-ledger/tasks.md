# Tasks

## 1. Batch the record's writes

- [x] 1.1 Add `LEDGER_BATCH` next to the ledger's constants in
      `src/vault/logseqImport.ts` (value 50) with the reason in its doc comment:
      the bound on what a killed tab can lose, against one write per batch
      instead of one per file. Verify the constant is exported, so the test
      asserts the real number rather than a copy.
- [x] 1.2 Change the write loop's `record` call to run when the completed count
      reaches a batch boundary and once after the loop, keeping the current
      `record` body (add keys, render, write). Verify the existing
      `logseqImport.test.ts` ledger tests still pass unchanged, since the format
      and the key are untouched.

## 2. Keep the record on the failure path

- [x] 2.1 In the function's `catch`, record the batch in hand before returning
      `{ ok: false, error }`, wrapped so a failing ledger write cannot replace
      the error that ended the run. Verify with a test that fails a destination
      write after more files than one batch and asserts the record holds every
      file written before the failure, plus a test that a failing ledger write
      reports the original error and still leaves the written files.
- [x] 2.2 Verify a run that throws inside the first batch still records that
      batch (the boundary test's small-count counterpart), so a short run's
      error cannot lose what it wrote.

## 3. Guard the cost and the loss bound

- [x] 3.1 Add a test that counts writes to `.folio/imports.md` (or calls to
      `renderLedger`) for an import of 120 fresh files and asserts three batch
      writes plus the final one, never one per file. Verify it fails against the
      current per-file loop before the change lands.
- [x] 3.2 Add a test that stops the run after the first completed batch and
      asserts the destination's record holds exactly that batch's files and no
      more, pinning the "at most one batch" loss in the spec.
- [x] 3.3 Run the unit and integration suites, `tsc -b`, `oxlint
      --deny-warnings`, and `npm run build`; all green.

## 4. Record the measured cost

- [x] 4.1 Re-run the design's render measurement against the shipped
      `renderLedger` (5,000 keys) and confirm the design's table still describes
      it; correct the table if the numbers moved.

## Workflow follow-up

- Archive the change and sync the `import` spec after the project's checks pass.
- Bump the version for the feature commit and the archive commit, per AGENTS.md.
