## Context

`runLogseqImport` (`src/vault/logseqImport.ts`) plans outputs then writes once, skipping
any destination path that exists. The ledger requirement adds app-owned state to the same
destination, alongside `.folio/pins.md` (ADR-0015). See `proposal.md` for the reported
gap. The orchestrator already takes `(source, dest, onProgress)`; it does not know the
source folder's name, which the ledger key needs.

## Goals / Non-Goals

**Goals**

- Combining two Logseq graphs into one vault keeps both graphs' content.
- A re-run (including after a partial failure) never duplicates content.

**Non-Goals**

- Merging content within a page (interleaving blocks, de-duplicating).
- Syncing later edits from a source.

## Decisions

### D1. Append Markdown, skip assets

A planned Markdown target that exists is appended to: the existing text with trailing
newlines trimmed, then a blank line, then the incoming text. An asset target that exists
is skipped (bytes cannot be merged). Alternative: content-level merge — rejected as a
research problem the user did not ask for; concatenation is predictable and reversible by
hand.

### D2. A per-source-file ledger at `.folio/imports.md`

One line per imported source file: `<source folder name>\t<source path>` under a header,
the pins-file shape (ADR-0015). A source file is skipped when its key is present. The
alternative, a per-source fingerprint, cannot tell which files a changed folder added and
would re-append everything, so per-file keys win; the cost is a ledger line per imported
file, in the hundreds, which is what pins already are.

`runLogseqImport` gains a `sourceName` option; `App` passes the picked source handle's
name, the CLI passes the source folder's basename.

### D3. The ledger is read before planning and written as files land

Read the ledger once, up front, and drop recorded source files from the plan. Re-write it
after each successful Markdown write (append the key and persist), so a run that fails
part-way still records what it did and a re-run appends only the rest. Writing a small
file per output is acceptable for a one-time import, and it is the only way to make
resume safe without a two-phase commit.

### D4. The report names what it did

`ImportReport` gains `merged` and `alreadyImported`; `written`/`skipped` keep their rows,
with `skipped` now meaning assets already present. The summary component shows the new
rows, so a multi-graph import is legible instead of a bare "skipped" count.

## Risks / Trade-offs

- **[Duplicated content on a re-import without a ledger]** A destination imported before
  this change has no ledger, so re-importing that source appends again. → Accepted; the
  ledger starts empty and is documented in the summary's "already imported" row. The
  first import after upgrading should target a fresh destination or a known one.
- **[Two source folders with the same name]** Their ledger keys collide, so the second is
  treated as already imported. → Accepted; the folder name is the identity the user
  chose, and the report shows an "already imported" count that surfaces a surprise.
- **[A large ledger]** One line per file. → Same order as `.folio/pins.md`; it is hidden
  meta, never indexed.
- **[Append with no separator]** Content could run together. → The append always inserts
  a blank line and trims trailing newlines on both sides.

## Migration Plan

No stored format changes for pages or journals. `.folio/imports.md` is new and additive;
its absence means "nothing imported yet", which is the correct reading for every existing
vault. The CLI script is updated to the same append + ledger behavior so ADR-0025's "two
places must not drift" holds.
