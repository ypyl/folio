# Proposal

## Why

The importer rewrites a human date in a reference to the journal day
(`[[Apr 30th, 2025]]` becomes `#[[2025-04-30]]`), but a source *page* with that
name is still written to `pages/Apr 30th, 2025.md`. Every reference to it,
including its own, therefore points at an empty journal day while the imported
page sits orphaned. A page already named `2025-04-30.md` is worse: it lands
under `pages/`, which the app never reads, so the imported page disappears.

## What Changes

- **A source page whose name is a day is written as that journal day.** A
  human date title (`Apr 30th, 2025`) and a zero-padded day name
  (`2025-04-30`) both target `journals/<day>.md`, where the rewritten
  references already point.
- **A day's content folds together.** A date-named page and a journal source
  for the same day concatenate into one file, exactly as several journal
  sources for one day already do.
- **A block reference into such a page names the day.** The block-reference
  rewrite already resolves an owner name; a day-named page's owner is the day,
  so the reference lands where the page does.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `import`: the "Import translates Logseq conventions into Folio Markdown"
  requirement gains the rule for a source page whose name is a day.

## Non-goals

- No change to which source files are read, to the ledger, to asset handling,
  or to the merge/append rules for ordinary pages.
- No new date parsing: the existing human-date reader and the app's own day
  check are reused.
- No change to how a name that is not a day is normalized.
- No change to the importer's one-way, input-only rule (ADR-0025): this only
  changes where one class of page is written.

## Impact

- `src/vault/logseqImport.ts`: the page target, the journal grouping, and the
  block-reference owner name learn about day-shaped names.
- `openspec/specs/import/spec.md`: the translation requirement and its
  scenarios.
- Tests: `src/vault/logseqImport.test.ts` for the two name shapes, the fold
  with a journal source, and the block-reference owner.
- Version: a minor bump (the imported vault reads correctly where it did not);
  the archive commit carries its own patch bump.
