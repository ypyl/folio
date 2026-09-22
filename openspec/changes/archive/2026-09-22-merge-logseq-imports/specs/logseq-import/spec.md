## MODIFIED Requirements

### Requirement: Import merges without overwriting

Import SHALL append into existing Markdown targets and skip existing assets. When a
planned `pages/<name>.md` or `journals/<date>.md` already exists in the destination, the
incoming content SHALL be appended to it, separated by a blank line, rather than skipped
or overwritten; a page or journal the destination does not hold SHALL be written as a new
file. An asset the destination already holds SHALL be skipped and reported, because bytes
cannot be merged. The destination's `.folio/` meta other than the import ledger SHALL NOT
be written. Import SHALL NOT delete any destination file. A source file already recorded
in the ledger (see the ledger requirement) SHALL NOT be imported again, so re-running an
import into the same destination SHALL append nothing.

#### Scenario: An existing journal is appended to

- **GIVEN** a destination that already holds `journals/2026-09-10.md`
- **WHEN** a second import supplies that day
- **THEN** the incoming day's content is appended to the file after a blank line, and the original content is still there

#### Scenario: An existing page is appended to

- **GIVEN** a destination that already holds `pages/Roadmap.md`
- **WHEN** a second import supplies that page
- **THEN** the incoming page's content is appended to the file after a blank line

#### Scenario: A new page is written

- **GIVEN** a destination with no `pages/New note.md`
- **WHEN** an import supplies it
- **THEN** the file is created with the incoming content

#### Scenario: An existing destination file is skipped

- **GIVEN** a destination that already holds `assets/shot.png`
- **WHEN** an import supplies that asset
- **THEN** the destination file is unchanged and the skip is reported

#### Scenario: Destination meta is preserved

- **GIVEN** a destination with `.folio/pins.md`
- **WHEN** an import runs
- **THEN** `.folio/pins.md` is unchanged

#### Scenario: Re-running the import adds nothing

- **GIVEN** a completed import into a destination
- **WHEN** the same source is imported into that destination again
- **THEN** every source file is skipped as already imported and the destination is unchanged

## ADDED Requirements

### Requirement: Import records the source files it has imported

Import SHALL record each source file it imports in a hidden ledger at
`.folio/imports.md`, one entry per source file keyed by the source folder's name and the
file's source path. On a later import, a source file already recorded SHALL be skipped,
so an import can be re-run after a partial failure without duplicating content. The
ledger SHALL be written as files are imported, so a run that fails part-way still records
what it wrote. The ledger SHALL be app-owned vault meta, never a page: it produces no
page record, no search content, and no reference source, and it SHALL NOT replace or
touch any other `.folio/` file.

#### Scenario: The ledger is written after an import

- **WHEN** an import finishes
- **THEN** `.folio/imports.md` records every source file that was written or appended

#### Scenario: A re-import skips the recorded files

- **GIVEN** a completed import whose ledger records the source's files
- **WHEN** the same source is imported again
- **THEN** no file is written or appended and the run reports the files as already imported

#### Scenario: A second graph's new files are imported

- **GIVEN** a ledger recording graph A's files
- **WHEN** graph B is imported into the same destination
- **THEN** graph B's files are written or appended, and the ledger records both graphs

#### Scenario: A partial failure records what it wrote

- **GIVEN** an import that fails after writing some files
- **WHEN** the run ends
- **THEN** the ledger records the files already written, and a re-run appends only the rest

#### Scenario: The ledger is not a page

- **WHEN** the vault is indexed
- **THEN** `.folio/imports.md` produces no page, no search result, and no backlink

## MODIFIED Requirements

### Requirement: Import summarizes the result and opens the destination

When an import finishes, the app SHALL show a result summary reporting the number of
files written, the number of files merged into existing files, the number of assets
copied, the number of assets skipped as already present, and the number of source files
skipped as already imported. The app SHALL then make the destination folder the active
vault, so its index builds and its imported pages and journals are listed.

#### Scenario: The result is summarized

- **WHEN** an import finishes
- **THEN** the app shows how many files were written, merged, and copied, and how many were skipped

#### Scenario: The destination becomes the active vault

- **WHEN** an import finishes
- **THEN** the destination folder is active and its imported pages appear in the sidebar
