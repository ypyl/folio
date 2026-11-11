# Spec Delta

## MODIFIED Requirements

### Requirement: Import records the source files it has imported

Import SHALL record each source file it imports, keyed by the source folder and
the file's path. On a later import, a source file already recorded SHALL be
skipped, so an import can be re-run after a partial failure without duplicating
content. The record SHALL be written in batches of at most `LEDGER_BATCH`
imported files, and again when the run ends, whether it succeeded or failed, so
a run that stops with an error records everything it wrote and a run whose tab
is killed records all but at most `LEDGER_BATCH - 1` files. The record SHALL be
app-owned vault metadata, never a page: it produces no page, no search result,
and no backlink, and it SHALL NOT replace or touch any other metadata.

#### Scenario: The record is written after an import

- **WHEN** an import finishes
- **THEN** the record holds every source file that was written or appended

#### Scenario: A re-import skips the recorded files

- **GIVEN** a completed import whose record holds the source's files
- **WHEN** the same source is imported again
- **THEN** no file is written or appended and the run reports them as already
  imported

#### Scenario: A second graph's new files are imported

- **GIVEN** a record holding one graph's files
- **WHEN** another graph is imported into the same destination
- **THEN** its files are written or appended and the record holds both

#### Scenario: A partial failure records what it wrote

- **GIVEN** an import that fails after writing some files
- **WHEN** the run ends
- **THEN** the record holds the files already written and a re-run appends only
  the rest

#### Scenario: A killed run loses at most one batch

- **GIVEN** an import of more files than one batch, killed before it ends
- **WHEN** the destination's record is read afterwards
- **THEN** it holds the files of every completed batch, and at most one batch
  short of what the run had written

#### Scenario: The record is rendered once per batch, not once per file

- **GIVEN** an import of many files
- **WHEN** it runs
- **THEN** the record's text is built once per completed batch and once at the
  end, and never once per imported file
