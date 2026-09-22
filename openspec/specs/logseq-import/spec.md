# logseq-import Specification

## Purpose

Import an existing Logseq graph into a Folio vault in one pass: read the Logseq folder,
translate its conventions into Folio's Markdown rules, and merge the result into a
destination folder without overwriting anything already there.

The importer is an input-only, one-time compatibility layer. It does not teach the
index, editor, or parser to read Logseq conventions at runtime (ADR-0012); it produces a
plain Folio vault that the app then reads like any other. The rules it applies are the
validated set in `MIGRATION_LOGSEQ_FOLIO.md`.

## Requirements

### Requirement: The brand screen offers a one-time Logseq import

Where the browser provides the local-folder picker, the no-folder brand screen SHALL
offer an **Import from Logseq** action beside the open-a-folder invitation. Where the
browser provides no picker, the action SHALL NOT be rendered, because the import cannot
be performed. The action introduces no other workflow into the app.

#### Scenario: The action is offered where the picker exists

- **WHEN** the app starts with no vault open in a Chromium-based browser
- **THEN** the brand screen shows an Import from Logseq action

#### Scenario: The action is absent without a picker

- **GIVEN** a browser whose runtime provides no local-folder picker
- **WHEN** the app starts with no vault open
- **THEN** the brand screen shows no Import from Logseq action and names the browser requirement

### Requirement: Import reads a read-only source and writes a read-write destination

Activating the action SHALL first request the Logseq source folder with read-only access
and then the destination vault folder with read-write access. Cancelling either picker
SHALL end the flow with no writes and leave the app in the empty state. The source folder
SHALL NOT be written, renamed, or deleted: import copies out of it.

#### Scenario: Source then destination

- **WHEN** the user activates Import from Logseq and picks a Logseq folder and then a destination folder
- **THEN** the source is read and the import writes into the chosen destination

#### Scenario: Cancelling the source picker

- **WHEN** the user cancels the source folder picker
- **THEN** no destination is requested, nothing is written, and the brand screen remains

#### Scenario: Cancelling the destination picker

- **WHEN** the user picks a source and then cancels the destination picker
- **THEN** nothing is written and the brand screen remains

#### Scenario: The source is left untouched

- **GIVEN** a completed import
- **WHEN** the Logseq source folder is inspected
- **THEN** every file in it is unchanged

### Requirement: Import translates Logseq conventions into Folio Markdown

The importer SHALL translate the source into Folio's on-disk forms so the resulting vault
reads correctly with no runtime compatibility:

- Page and journal filenames SHALL be normalized into legal, visible, referenceable Folio
  names; journal files SHALL use `journals/YYYY-MM-DD.md`.
- Plain `[[Name]]` wikilinks SHALL become `#[[Name]]`; a `| alias` suffix SHALL be dropped.
- A reference whose name is a human-written date (e.g. `Apr 30th, 2025`) SHALL become the
  journal day for that date.
- A block reference `((uuid))` SHALL become a page reference to the page that owns the
  referenced block.
- A task keyword (`DONE`, `TODO`, `DOING`, `LATER`, `NOW`) that begins a list item SHALL
  become a page reference (`#DONE`, `#TODO`, ...).
- Logseq's UI-only block properties and org drawer wrappers SHALL be removed, while
  user data properties SHALL be kept as literal `key:: value` text.
- Asset destinations written relative to a page (`../assets/...`) SHALL become
  vault-relative (`assets/...`), including in property values.
- Journals nested inside the source's `pages/` folder SHALL be folded into the
  destination's `journals/`; `draws/` and `whiteboards/` files SHALL be copied into
  `assets/`.
- Folio's own reference namespace SHALL be respected: text that Folio does not read as a
  reference (including `#tag/with/slash`, `#dotted.tag`, and plain Markdown) SHALL NOT be
  turned into one, and content inside fenced code SHALL be left as written.

#### Scenario: Wikilinks become Folio references

- **GIVEN** a source page containing `See [[Roadmap]]`
- **WHEN** the page is imported
- **THEN** the imported page contains `See #[[Roadmap]]`

#### Scenario: Aliased links keep the page, drop the alias

- **GIVEN** a source page containing `[[Roadmap | this year]]`
- **WHEN** the page is imported
- **THEN** the imported page contains `#[[Roadmap]]`

#### Scenario: A human date reference becomes the journal day

- **GIVEN** a source page containing `[[Apr 30th, 2025]]`
- **WHEN** the page is imported
- **THEN** the imported page contains `#[[2025-04-30]]`

#### Scenario: A block reference becomes a page reference

- **GIVEN** a source block reference whose owning block lives in `journals/2024_07_10.md`
- **WHEN** the containing page is imported
- **THEN** the reference becomes `#[[2024-07-10]]`

#### Scenario: A task keyword becomes a page reference

- **GIVEN** a source list item `- DONE review book`
- **WHEN** the page is imported
- **THEN** the imported item is `- #DONE review book`

#### Scenario: UI-only properties are removed and data properties are kept

- **GIVEN** a source block carrying `collapsed:: true` and `cost:: 10`
- **WHEN** the page is imported
- **THEN** the `collapsed::` line is gone and the `cost:: 10` line remains

#### Scenario: Relative asset paths become vault-relative

- **GIVEN** a source page containing `![shot](../assets/shot.png)`
- **WHEN** the page is imported
- **THEN** the imported page contains `![shot](assets/shot.png)` and `assets/shot.png` is written

#### Scenario: Journal filenames are normalized

- **GIVEN** a source file `journals/2024_07_02.md`
- **WHEN** the source is imported
- **THEN** the destination holds `journals/2024-07-02.md`

#### Scenario: Nested source journals are folded in

- **GIVEN** a source file `pages/journals/2026-09-11.md`
- **WHEN** the source is imported
- **THEN** the destination holds `journals/2026-09-11.md`

#### Scenario: Drawings and whiteboards are preserved as assets

- **GIVEN** a source `draws/diagram.excalidraw` and `whiteboards/board.edn`
- **WHEN** the source is imported
- **THEN** both are written under `assets/`

#### Scenario: Non-reference text is not turned into a reference

- **GIVEN** a source page containing a URL with a fragment (`.../file.cs#L109`) and a `#tag/with/slash` token
- **WHEN** the page is imported
- **THEN** neither is rewritten as a page reference

#### Scenario: Fenced code is left as written

- **GIVEN** a source page with a fenced code block containing `[[NotARef]]`
- **WHEN** the page is imported
- **THEN** the code block still contains `[[NotARef]]`

### Requirement: Import merges without overwriting

Import SHALL write only destination paths that do not already exist. A path the
destination already holds SHALL be skipped and reported, never overwritten. The
destination's `.folio/` meta (including its pins file) SHALL NOT be written. Import SHALL
NOT delete any destination file. Because existing paths are skipped, re-running an import
into the same destination SHALL add nothing further.

#### Scenario: An existing destination file is skipped

- **GIVEN** a destination that already holds `pages/Roadmap.md`
- **WHEN** the import would write `pages/Roadmap.md`
- **THEN** the destination file is unchanged and the skip is reported

#### Scenario: Destination meta is preserved

- **GIVEN** a destination with `.folio/pins.md`
- **WHEN** an import runs
- **THEN** `.folio/pins.md` is unchanged

#### Scenario: Re-running the import adds nothing

- **GIVEN** a completed import into a destination
- **WHEN** the same source is imported into that destination again
- **THEN** every file is skipped and the destination is unchanged

### Requirement: Import reports progress while it runs

While an import is running, the app SHALL show progress: the current phase and the number
of items completed against the total. The progress SHALL advance as work proceeds and
SHALL NOT depend on the user interacting. The run SHALL NOT block the browser's main
thread; the app SHALL remain responsive while it runs.

#### Scenario: Progress appears during the run

- **WHEN** an import is running
- **THEN** the brand screen shows a progress indicator naming the phase and a completed-of-total count

#### Scenario: Progress advances

- **GIVEN** an import in progress
- **WHEN** more source items are processed
- **THEN** the completed count increases

### Requirement: Import summarizes the result and opens the destination

When an import finishes, the app SHALL show a result summary reporting at least the
number of files written, the number of files skipped as existing, and the number of
assets copied. The app SHALL then make the destination folder the active vault, so its
index builds and its imported pages and journals are listed.

#### Scenario: The result is summarized

- **WHEN** an import finishes
- **THEN** the app shows how many files were written, skipped, and copied

#### Scenario: The destination becomes the active vault

- **WHEN** an import finishes
- **THEN** the destination folder is active and its imported pages appear in the sidebar

### Requirement: Import ignores non-content Logseq data

Import SHALL NOT carry over app configuration or history: the source's `logseq/`
directory, `custom.css`, backup history, and any `.folio/` tree inside the source SHALL
be ignored. The written vault's Markdown SHALL contain only Folio reference forms.

#### Scenario: Configuration and backups are not imported

- **GIVEN** a source containing `logseq/config.edn`, `logseq/bak/`, and `logseq/custom.css`
- **WHEN** the source is imported
- **THEN** none of them appears in the destination

#### Scenario: Source meta is not imported as a page

- **GIVEN** a source containing `pages/.folio/pins.md`
- **WHEN** the source is imported
- **THEN** it produces no page and no pins entry

### Requirement: Import fails safely

If reading the source or writing the destination fails, the app SHALL stop, show an error
naming what failed, and leave the files already written in place. Because existing paths
are skipped, the user SHALL be able to re-run the import after fixing the cause.

#### Scenario: A failure is reported

- **GIVEN** an import whose destination write fails
- **WHEN** the failure occurs
- **THEN** the app shows an error naming the failure and does not report success
