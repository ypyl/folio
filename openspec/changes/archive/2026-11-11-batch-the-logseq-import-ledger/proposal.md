# Proposal

## Why

The import's ledger — the app-owned record of which source files it has already
imported — is rewritten in full after every single file. That cost grows with
the square of the import: a 5,000-file graph renders 670 MB of ledger text and
spends about 1.2 s of CPU on the rendering alone, before the disk sees it, and
every one of those rewrites is a separate write round trip through the file
system access API.

The record's current shape is a stated requirement (it "SHALL be written as
files are imported"), so this cannot be fixed as a plain performance change: the
requirement has to say how much a failure may lose.

## What Changes

- The ledger is written every `LEDGER_BATCH` imported files, once when the run
  ends, and once in the failure path, instead of after every file.
- The requirement that demanded a write per file becomes a bounded-loss
  requirement: a run that ends in an error still records everything it wrote; a
  run whose tab is killed loses at most one batch, and a re-run re-appends only
  that batch.
- The ledger's on-disk format, its key, and its parsing are unchanged, so an
  existing destination's ledger keeps working and a re-run against an old file
  behaves exactly as before.

**Non-goals**

- No append API on `VaultStorage` (ADR-0013 keeps the seam to read/write/remove).
- No change to what is imported, how a name is normalized, or how a merge
  appends.
- No dedup on re-append: a lost batch's files are appended a second time, which
  is the risk the batch size buys down.
- No progress-reporting change, and no resumable import.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `import`: the requirement **Import records the source files it has imported**
  changes from "written as files are imported" to a batch of at most
  `LEDGER_BATCH` files, written at the end of the run and again in its failure
  path, with the loss a killed tab may cause stated and bounded.

## Impact

- `src/vault/logseqImport.ts`: the write loop's accounting and the failure path.
- `src/vault/logseqImport.test.ts`: the record's scenarios, and the cost guard
  that pins one render per batch rather than one per file.
- No dependency, no storage-seam change, no ADR: the decision is the import
  spec's own, and ADR-0025's one-way property is untouched.
