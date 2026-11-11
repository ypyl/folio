# Design

## Context

See `proposal.md` — Why. The parts of the current implementation this design
touches:

- `runLogseqImport` writes planned Markdown and assets in one loop. After each
  landed file it calls `record(sourceKeys)`, which adds the keys to a `Set`,
  renders the whole set (`renderLedger`: spread, sort, join) and writes the file
  (`.folio/imports.md`).
- `VaultStorage` has no append (ADR-0013), so "record one file" is necessarily
  "rewrite the record".
- The whole run is inside one `try`; its `catch` returns `{ ok: false, error }`
  and writes nothing more.

## Goals / Non-Goals

**Goals**

- The record's cost per import is linear in the number of files and in its own
  final size, not quadratic in either.
- The record's losses on the two failure modes — an error the app can see, and a
  tab that dies — are stated and bounded.
- An existing `.folio/imports.md` keeps working, byte for byte.

**Non-Goals**

- No change to the ledger's format, key, or parser.
- No append capability on the storage seam, and no new file per run.
- No attempt to detect and skip content that was appended twice after a lost
  batch: a duplicated page is visible and repairable, and the alternative is a
  second source of truth.

## Decisions

### D1 One render and one write per batch, plus the end of the run

The loop keeps `ledger: Set<string>` in memory and calls `record` only when
`done % LEDGER_BATCH === 0`, and once after the loop. `record` keeps its current
shape (add the keys, render, write), so the on-disk result is exactly what a
per-file run produces.

`LEDGER_BATCH = 50`. The trade is duplicates against writes: at 5,000 files the
ledger is about 215 KB, and the per-file rule writes it 5,000 times while a
50-file batch writes it 100 times plus once at the end.

Measured on the render only (the rule copied from `renderLedger`, 5,000 keys of
about 45 characters, this machine, Node):

| rule | renders | CPU | ledger text built |
|---|---|---|---|
| one per file (today) | 5,000 | 1,228 ms | 670 MB |
| one per 50 files | 100 | 30 ms | 13.5 MB |

And end to end, through the shipped `runLogseqImport` over 5,000 source pages
into an in-memory destination (the unit runner, one run each, so the file round
trip is under-represented — it adds to the first row only):

| rule | whole import |
|---|---|
| one per file (before) | 1,186 ms |
| one per 50 files (after) | 110 ms |

The disk side scales with the same ratio: each write is a `createWritable`,
`write`, `close` round trip through the file process, so 5,000 of them at the
import's scale is where the visible time went. 50 is the smallest bound that
still reads as "a batch" rather than "a checkpoint every handful of files"; it
is a named constant so the number is one edit away if the duplicates ever bite.

Alternatives rejected:

- **Write per file, render incrementally.** Keeps a rendered string in memory
  and appends one line per file. It removes the sort and the join, but not the
  rewrite: the file still grows to 215 KB and still costs 5,000 write round
  trips and about 540 MB written. It buys the smaller half of the problem for a
  second representation of the ledger in memory.
- **Time-based flush (every 2 s).** The loss bound becomes a function of disk
  speed, so a fast machine writes more duplicates than a slow one. A count is a
  bound a person can reason about and a test can assert.
- **One ledger file per source folder, written at the end.** Smaller writes, but
  it splits the record across files keyed by a folder name the user can rename,
  and it loses the record entirely when the run dies.

### D2 The failure path writes the record before it returns the error

The `catch` that already turns any throw into `{ ok: false, error }` first
records the batch in hand. So the loss from an error the app can see is zero:
everything written before the throw is recorded, which is exactly the guarantee
the old requirement gave. Only a *killed* tab — where no code runs — can lose
anything, and that loss is at most the files of the current batch.

`record` itself can throw (its write can fail). That is not a new hazard: the
old code had the same call inside the same `try`, so a failing ledger write
still ends the run with an error, and the files already written still stand. The
catch's own `record` is wrapped: an error there must not replace the error that
ended the run.

### D3 The cost guard is a render count, not a stopwatch

The unit test that proves the rule counts `renderLedger` calls (or the writes to
`.folio/imports.md`) for an import of, say, 120 files, and asserts 3 renders plus
the final one rather than 120. A duration assertion would be machine-dependent;
the count is the property the requirement states ("once per batch, never once
per file").

## Risks / Trade-offs

- [A killed tab re-appends up to 49 files on the next run, duplicating their
  content] → The batch is 50 and the record is written at every batch boundary;
  the spot to change is one constant. A duplicate is visible in the destination
  and repairable by hand, which is the same class of damage the old rule avoided
  at the cost of a quadratic write.
- [A batch's write throws and the run ends before the set is persisted] → Same
  outcome as the old per-file rule at that point (that file's entry was also
  lost), and the error is reported. No new failure mode.
- [The end-of-run write is the only one for a small import] → Intended: an
  import under 50 files writes the record once, which is what the old rule did
  at the end anyway.
- [A future change to the ledger's format forgets the batch constant] → The
  batch constant lives next to the ledger's own constants, and the render-count
  test fails if the write cadence changes.

## Migration Plan

None. The format is unchanged; a destination's existing record is read and
extended exactly as before. Nothing to roll back beyond the commit itself.
