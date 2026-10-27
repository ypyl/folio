# Design

## Context

The importer's planning phase (`runLogseqImport`, `src/vault/logseqImport.ts`)
sorts source files into page sources and journal sources, rewrites each one,
and writes it to a target path. `pageTarget` writes `pages/<normalized stem>.md`
and `journalTarget` writes `journals/<journalFileName>.md`. Journals for one day
are grouped and concatenated before writing; pages are planned one per target
with first-source-wins on a normalized-name collision.

Two rewrites already treat a day-shaped name as the day: a reference whose inner
text is a human date becomes `#[[YYYY-MM-DD]]`, and a block reference becomes a
reference to the owning page's *output name* (`outputNameFor`).

The app's own rules complete the picture: `journalDayName` recognizes a real
zero-padded day, `isPagePath` excludes date-shaped files under `pages/`, and
`resolveReferencePath` sends a day name to the journal day (ADR-0019).

## Goals / Non-Goals

**Goals:**

- A date-named source page lands where every reference to it resolves.
- A day's content (page source, journal source, or both) is one file.
- No new date parsing and no change to ordinary page handling.

**Non-Goals:**

- Reworking the planning phase or the ledger.
- Parsing more date shapes than the importer already understands.

## Decisions

### D1: A page name that is a day targets the journal path

One helper answers "which day does this page name name": the existing
`humanDateToDay` for `Apr 30th, 2025`-style titles, then the app's
`journalDayName` for the zero-padded shape. A page target then becomes
`journals/<day>.md`, the same path the rewritten references and the app's
resolver already name.

Doing it at the target, not at the reference, is the smallest change: the
reference rewrite is already correct, and only the page's destination was
wrong.

### D2: Group by target, not by source kind

The journal grouping becomes the routing point for both kinds. A page source
whose target is a journal day is pushed into the same group map as a journal
source for that day, so the fold, the append-into-existing rule, and the ledger
entry behave as they already do for journals. The map is keyed by the lowercased
target, so two spellings of one day fold into one file.

### D3: The block-reference owner is the day too

`outputNameFor` names the page a block lives on. A date-named page must answer
the day, or a `((uuid))` reference into it would be written as the human title
while the page itself lives at the day. The same helper feeds both, so the two
cannot disagree.

### Rejected: a second pass after writing

Moving a written `pages/Apr 30th, 2025.md` later would read, rewrite, and
delete in the destination, which the importer never does (it never deletes),
and the ledger would already have recorded the wrong target.

## Risks / Trade-offs

- A source page named like a day now merges with that day's journal content
  instead of standing alone. That is the point: the app treats one name as one
  day (ADR-0019).
- A user who genuinely wanted a page named `2025-04-30` cannot have one in
  Folio either, so the import matches the app rather than inventing a rule.
- The `written` report count changes for a date-named page: it is one file
  either way, but it now counts as a journal target.
