## Why

Folio's Logseq import was built for one graph into one empty vault: a destination path
that already existed was skipped and reported. That is right for a first import and wrong
for the case it now has — combining two Logseq graphs into one Folio vault. The second
graph's day or page with a name the first graph already wrote was **skipped and lost**,
with only a bare skipped count to show for it.

## What Changes

- Existing Markdown targets are **appended to**, not skipped: an incoming page or journal
  whose target file already exists is appended to that file, separated by a blank line.
  New targets are still written as new files.
- Assets keep the skip rule: a target asset that already exists is skipped and reported,
  because bytes cannot be merged.
- A hidden `.folio/imports.md` **ledger** records which source files have been imported
  (keyed by the source folder and the file's source path). A file already recorded is not
  imported again, so re-running an import — including resuming after a partial failure —
  appends only what is new and never duplicates.
- The result summary reports how many files were **merged** into existing files, alongside
  written, skipped, and assets copied, and how many source files were already imported.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `logseq-import`: existing pages and journals are appended to instead of skipped; a new
  ledger requirement; the result summary reports merged files.

## Non-goals

- No content-level merge (interleaving or de-duplicating blocks within a page): the two
  sources' texts sit one after the other, separated by a blank line.
- No continued sync of later edits from a source graph; this stays a one-time import.
- No merge or overwrite of assets.
- No change to the first import into an empty destination, to the rule set, or to the
  progress model.

## Impact

- **Code**: `src/vault/logseqImport.ts` (planner and write phase, ledger read/write,
  report shape), `src/components/LogseqImport.tsx` (summary), `src/App.tsx` (pass the
  source folder's name), and `scripts/migrate-logseq.mjs` to keep the CLI in step
  (ADR-0025).
- **Specs**: `openspec/specs/logseq-import/spec.md` gains a ledger requirement and the
  merge requirement is rewritten.
- **Vault**: a new app-owned meta file, `.folio/imports.md` (ADR-0015 precedent), never a
  page and never indexed.
