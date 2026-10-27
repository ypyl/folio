# Spec Delta

## MODIFIED Requirements

### Requirement: Activating a file row opens the file and changes nothing else

Activating a file row — in the Files listing or in a page's Links list — SHALL
open the file: a type the app shows from a copy SHALL be shown in a new window,
and any other type, SVG included, SHALL be downloaded for the operating
system's application. SVG SHALL NOT be shown as a document: a document built
from a `blob:` URL carries the app's origin, so an SVG's own script would run
with the app's access. An SVG shown inline in a page is not affected: it is an
image element, which cannot run script. The file's name SHALL be used as it is.
The file SHALL NOT be written, the page's Markdown SHALL NOT change, and no app
state SHALL change: the open page stays open, the active marking does not move,
the history trail gains no entry, and the search surface is unchanged. A file
the vault can no longer read SHALL open nothing and leave the app as it is.

#### Scenario: A displayable file opens in a window

- **GIVEN** a vault containing a PDF, with a page open
- **WHEN** the user activates its row
- **THEN** the file opens in a new window and the open page and panes are
  unchanged

#### Scenario: A non-displayable file downloads

- **GIVEN** a vault containing an archive file
- **WHEN** the user activates its row
- **THEN** the browser downloads the file

#### Scenario: An SVG downloads instead of opening as a document

- **GIVEN** a vault containing an SVG file, with a page open
- **WHEN** the user activates its row
- **THEN** the browser downloads the file and no window is opened

#### Scenario: An SVG image in a page still renders

- **GIVEN** an open page holding `![chart](assets/chart.svg)`
- **WHEN** the page renders
- **THEN** the image shows in the page, exactly as before

#### Scenario: Opening a file leaves the session alone

- **GIVEN** a page open with unsaved edits, and a vault holding a file
- **WHEN** the user activates the file's row
- **THEN** the same page stays open, its save state is unchanged, no history
  entry is added, and Back and Forward step where they did before

#### Scenario: A name carrying a percent sign opens the file it names

- **GIVEN** a vault containing a file whose name holds a percent sign
- **WHEN** the user activates its row
- **THEN** the file is read and opened, not a decoded approximation of the name

#### Scenario: An unreadable file opens nothing

- **GIVEN** a file row whose file was deleted outside the app
- **WHEN** the user activates the row
- **THEN** nothing opens and the app remains as it was
