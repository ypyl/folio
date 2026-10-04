# Importing from Logseq

## Purpose

Import an existing Logseq graph into a Folio vault in one pass: read the Logseq
folder, translate its conventions into Folio's Markdown rules, and merge the
result into a destination folder without overwriting anything already there.

The importer is an input-only, one-time compatibility layer. It does not teach
the app to read Logseq conventions at runtime; it produces a plain Folio vault
that the app then reads like any other.

## Requirements

### Requirement: The no-folder screen offers a one-time Logseq import

Where the browser can open local folders, the no-folder screen SHALL offer an
**Import from Logseq** action beside the invitation to open a folder. Where it
cannot, the action SHALL NOT be shown, because the import cannot be performed.
The action SHALL introduce no other workflow into the app.

#### Scenario: The action is offered where folders can be opened

- **WHEN** the app starts with no folder open in a browser that can open folders
- **THEN** the screen shows an Import from Logseq action

#### Scenario: The action is absent otherwise

- **GIVEN** a browser that cannot open local folders
- **WHEN** the app starts with no folder open
- **THEN** the screen shows no import action and states the browser requirement

### Requirement: Import reads a source and writes a destination

Activating the action SHALL first ask for the Logseq source folder read-only,
then the destination folder read-write. Cancelling either SHALL end the flow with
no writes and leave the app in its no-folder state. The source folder SHALL NOT
be written, renamed, or deleted: import copies out of it.

#### Scenario: Source then destination

- **WHEN** the user activates the action and picks a Logseq folder and a
  destination
- **THEN** the source is read and the import writes into the destination

#### Scenario: Cancelling either picker

- **WHEN** the user cancels the source or the destination picker
- **THEN** nothing is written and the no-folder screen remains

#### Scenario: The source is left untouched

- **GIVEN** a completed import
- **WHEN** the Logseq source folder is inspected
- **THEN** every file in it is unchanged

### Requirement: Import translates Logseq conventions into Folio Markdown

The importer SHALL translate the source into Folio's on-disk forms so the
resulting vault reads correctly with no runtime compatibility:

- Page and journal names SHALL be normalized into legal, visible, referenceable
  Folio names; journal days SHALL use the dated form.
- Plain `[[Name]]` wikilinks SHALL become `#[[Name]]`, with any alias dropped.
- A reference whose name is a human-written date SHALL become the journal day for
  that date.
- A block reference SHALL become a reference to the page or day that owns the
  block.
- A task keyword at the start of a list item SHALL become a page reference.
- Logseq's UI-only block properties and drawer wrappers SHALL be removed, while
  the user's own data properties SHALL be kept as literal text.
- Asset destinations written relative to a page SHALL become vault-relative.
- Journals nested inside the source's pages SHALL be folded into the
  destination's journal days; drawings and whiteboards SHALL be copied in as
  vault files.
- Folio's own reference rules SHALL be respected: text Folio does not read as a
  reference SHALL NOT be turned into one, and content inside fenced code SHALL be
  left as written.

#### Scenario: Wikilinks become Folio references

- **GIVEN** a source page containing `See [[Roadmap]]`
- **WHEN** the page is imported
- **THEN** the imported page contains `See #[[Roadmap]]`

#### Scenario: Aliased links keep the page and drop the alias

- **GIVEN** a source page containing `[[Roadmap | this year]]`
- **WHEN** the page is imported
- **THEN** the imported page contains `#[[Roadmap]]`

#### Scenario: A human date reference becomes the journal day

- **GIVEN** a source page referencing `Apr 30th, 2025`
- **WHEN** the page is imported
- **THEN** the imported page references the journal day for 2025-04-30

#### Scenario: A block reference becomes a reference to its owner

- **GIVEN** a source block reference whose block lives on a dated page
- **WHEN** the containing page is imported
- **THEN** the reference becomes a reference to that page

#### Scenario: A task keyword becomes a page reference

- **GIVEN** a source list item beginning with a task keyword
- **WHEN** the page is imported
- **THEN** the imported item begins with that keyword as a page reference

#### Scenario: UI-only properties are removed and data kept

- **GIVEN** a source block carrying an editor UI property and the user's own
  property
- **WHEN** the page is imported
- **THEN** the UI property is gone and the user's property remains as literal
  text

#### Scenario: Relative asset paths become vault-relative

- **GIVEN** a source page referencing an asset by a page-relative path
- **WHEN** the page is imported
- **THEN** the imported page references it by its vault path and the asset is
  written

#### Scenario: Journal filenames are normalized

- **GIVEN** a source journal file written in Logseq's dated form
- **WHEN** the source is imported
- **THEN** the destination holds it as a journal day

#### Scenario: Drawings and whiteboards are preserved as vault files

- **GIVEN** a source holding drawings and whiteboards
- **WHEN** the source is imported
- **THEN** they are written into the destination as vault files

#### Scenario: Non-reference text is not turned into a reference

- **GIVEN** a source page containing a URL with a fragment and a slash-separated
  tag token
- **WHEN** the page is imported
- **THEN** neither is rewritten as a reference

#### Scenario: Fenced code is left as written

- **GIVEN** a source page with a fenced code block containing a wikilink
- **WHEN** the page is imported
- **THEN** the code block still contains it verbatim

### Requirement: Import merges without overwriting

Import SHALL append into existing Markdown targets and skip existing files. When
a planned page or journal day already exists in the destination, the incoming
content SHALL be appended after a blank line rather than skipped or overwritten;
a page or day the destination does not hold SHALL be written new. A file the
destination already holds SHALL be skipped and reported. Import SHALL NOT delete
any destination file and SHALL NOT touch any destination metadata other than its
own record of what it imported. A source file already recorded SHALL NOT be
imported again, so re-running an import into the same destination appends
nothing.

#### Scenario: An existing journal is appended to

- **GIVEN** a destination that already holds a given journal day
- **WHEN** another import supplies that day
- **THEN** the incoming content is appended after a blank line and the original is
  still there

#### Scenario: A new page is written

- **GIVEN** a destination with no note of that name
- **WHEN** an import supplies it
- **THEN** the note is created with the incoming content

#### Scenario: An existing file is skipped

- **GIVEN** a destination that already holds a file
- **WHEN** an import supplies that file
- **THEN** the destination file is unchanged and the skip is reported

#### Scenario: Destination metadata is preserved

- **GIVEN** a destination with its own stored favorites
- **WHEN** an import runs
- **THEN** the favorites are unchanged

#### Scenario: Re-running the import adds nothing

- **GIVEN** a completed import into a destination
- **WHEN** the same source is imported again
- **THEN** every source file is skipped as already imported and the destination is
  unchanged

### Requirement: Import records the source files it has imported

Import SHALL record each source file it imports, keyed by the source folder and
the file's path. On a later import, a source file already recorded SHALL be
skipped, so an import can be re-run after a partial failure without duplicating
content. The record SHALL be written as files are imported, so a run that fails
part-way still records what it wrote. The record SHALL be app-owned vault
metadata, never a page: it produces no page, no search result, and no backlink,
and it SHALL NOT replace or touch any other metadata.

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

### Requirement: Import reports progress while it runs

While an import is running, the app SHALL show its phase and how many items are
done out of the total. The progress SHALL advance as work proceeds and SHALL NOT
depend on the user acting. The app SHALL remain responsive while it runs.

#### Scenario: Progress appears during the run

- **WHEN** an import is running
- **THEN** the screen shows a progress indicator naming the phase and a
  completed-of-total count

#### Scenario: Progress advances

- **GIVEN** an import in progress
- **WHEN** more source items are processed
- **THEN** the completed count increases

### Requirement: Import summarizes the result and opens the destination

When an import finishes, the app SHALL show a summary of what happened: how many
notes were written, how many were merged into existing notes, how many files were
copied, how many were skipped as already present, and how many source files were
skipped as already imported. It SHALL then make the destination the active vault,
so its content is listed.

#### Scenario: The result is summarized

- **WHEN** an import finishes
- **THEN** the app shows how many notes were written or merged, how many files
  were copied, and how many were skipped

#### Scenario: The destination becomes the active vault

- **WHEN** an import finishes
- **THEN** the destination is active and its imported pages appear in the sidebar

### Requirement: Import ignores non-content Logseq data

Import SHALL NOT carry over app configuration or history: the source's settings,
custom styles, backup history, and any app metadata inside the source SHALL be
ignored. The written vault's Markdown SHALL contain only Folio reference forms.

#### Scenario: Configuration and backups are not imported

- **GIVEN** a source containing configuration, backups, and custom styles
- **WHEN** the source is imported
- **THEN** none of them appears in the destination

#### Scenario: Source metadata is not imported as a page

- **GIVEN** a source containing app metadata
- **WHEN** the source is imported
- **THEN** it produces no page and no entries

### Requirement: Import fails safely

If reading the source or writing the destination fails, the app SHALL stop, show
an error naming what failed, and leave the files already written in place.
Because existing paths are skipped, the user SHALL be able to re-run the import
after fixing the cause.

#### Scenario: A failure is reported

- **GIVEN** an import whose destination write fails
- **WHEN** the failure occurs
- **THEN** the app shows an error naming the failure and does not report success
