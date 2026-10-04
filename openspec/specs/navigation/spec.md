# Navigation

## Purpose

Let a user move through a vault's notes: the sidebar lists the open vault's
pages and journal days, and choosing one opens it in the editor pane.

## Requirements

### Requirement: The sidebar lists the open vault's content

When a folder is open, the sidebar SHALL list that vault's content in the Files
section as selectable rows and render its journal days in the Journal section as
a calendar. The rows and calendar SHALL come from the open folder, not from
sample data. The Files listing SHALL hold one list in this order: the vault's
pages, then its boards, then its files. Favorites SHALL be listed first among the
pages, in favorite order, followed by the remaining pages most-recently-edited
first. Boards and files SHALL follow in path order. A page row SHALL carry no
kind badge, a board row a `b` badge, and a file row an `a` badge. A page with no
file SHALL stay dimmed but clickable; board and file rows SHALL NOT be dimmed.
The Journal and Files sections SHALL keep independent open and close state.

The listing SHALL render only the rows near its visible region, so the number of
rows in the document does not grow with the size of the vault. Windowing SHALL
NOT change what the listing is: it SHALL cover the whole vault, keep the order
above, always render the open page's or board's row, and let assistive
technology read each rendered row's position and the listing's total size.

#### Scenario: The Files listing lists the vault's content

- **WHEN** a folder is open
- **THEN** the Files listing covers every page, board, and file in it, pages
  first, then boards, then files

#### Scenario: Favorites lead the pages

- **GIVEN** a vault where Vision is a favorite and Ideas was edited most recently
- **WHEN** the Files listing renders
- **THEN** Vision is the first row, then Ideas, then the other pages in
  most-recently-edited order

#### Scenario: Boards and files follow the pages, badged

- **WHEN** the Files listing renders
- **THEN** page rows carry no badge, board rows a `b` badge, and file rows an
  `a` badge, in that order

#### Scenario: The Journal section marks the days that have notes

- **WHEN** a folder is open
- **THEN** the Journal section shows the journal calendar and marks the days
  that have a note

#### Scenario: The listing renders a bounded number of rows

- **GIVEN** a vault with thousands of files
- **WHEN** the Files listing renders
- **THEN** only a small number of rows near the visible region are in the
  document, and that number does not grow with the vault

#### Scenario: Scrolling reaches every row

- **GIVEN** a vault with thousands of files
- **WHEN** the user scrolls the Files listing to its end
- **THEN** the last row is rendered and can be activated

#### Scenario: The open row is always rendered

- **GIVEN** the open page sits far from the current scroll position
- **WHEN** the Files listing renders
- **THEN** that page's row is in the document and marked active

#### Scenario: Assistive technology reads the whole listing

- **WHEN** a row in the Files listing is rendered
- **THEN** it reports its position and the listing's total size

### Requirement: Choosing a row opens it

Choosing a page row or a calendar day SHALL open that page or day in the editor
pane and mark it as the active item in the sidebar. A calendar day with no note
SHALL still open, as a blank page whose file is created on first save. Choosing
a different row SHALL replace the open one and move the active marking.

#### Scenario: Choosing a page row opens it

- **WHEN** the user chooses a page row
- **THEN** the editor pane opens that page and the row is marked active

#### Scenario: Choosing a journal day opens it like a page

- **WHEN** the user chooses a calendar day
- **THEN** the editor pane opens that day's note, or a blank page when it has
  none, and the active marking moves to that day

#### Scenario: Choosing a second row replaces the first

- **WHEN** the user chooses a second row while one is open
- **THEN** the editor pane shows the second and only the second is marked active

### Requirement: The app opens to today's journal

On load with a folder open, the app SHALL open that folder's journal for the
current local date and mark that day active. A day with no note SHALL open blank
and create nothing until the first save. With no folder open, the editor pane
SHALL show the no-folder state instead.

#### Scenario: Loads to today's journal

- **GIVEN** a folder is open
- **WHEN** the app loads
- **THEN** the editor pane shows today's journal, or a blank page when it has
  none, and today's cell is marked active

#### Scenario: Opening today's note creates nothing

- **GIVEN** a folder open with no note for today
- **WHEN** the app loads and the user does not type
- **THEN** the folder holds no new file and the editor pane shows a blank page

#### Scenario: Loading with no folder keeps the no-folder state

- **WHEN** the app loads with no folder open
- **THEN** the editor pane shows the no-folder state and no sidebar item is
  active

### Requirement: The no-folder state invites opening a folder

When no folder is open, the sidebar's Journal and Files sections SHALL render
empty, and the editor pane SHALL invite the user to open a folder. Where the
browser can open local folders, that state SHALL also offer the one-time Logseq
import; where it cannot, the invitation stands alone.

#### Scenario: Before any folder is opened

- **WHEN** the app loads and no folder has been opened
- **THEN** both sections show no rows, their summaries remain, and the editor
  pane says "Open a folder to begin."

#### Scenario: No folder is currently active

- **WHEN** the user has opened folders before but none is active
- **THEN** the sidebar shows no rows and the editor pane shows the no-folder
  state

#### Scenario: The no-folder state offers the import

- **WHEN** a browser that can open local folders loads with no folder open
- **THEN** the editor pane offers the Import from Logseq action beside the
  invitation

#### Scenario: No import where folders cannot be opened

- **GIVEN** a browser that cannot open local folders
- **WHEN** the app loads with no folder open
- **THEN** the editor pane shows the invitation with no import action

### Requirement: A page's Links rows navigate

The right panel's Links page rows SHALL open the page each names, exactly like
choosing a sidebar row, with the same active marking. A backlink row — a page
that references the open page — and a forwardlink row — a page the open page
references — both open their page. A row naming a page with no note SHALL still
open a blank page, and a row naming a date SHALL open that journal day. A file
row or a board row is not a page row: it opens the file or board it names and
navigates nowhere.

#### Scenario: A backlink row opens the referring page

- **GIVEN** a page that is referenced by another note
- **WHEN** the user opens the page and chooses the referring row
- **THEN** the editor pane opens the referring page

#### Scenario: A forwardlink row opens the target page

- **GIVEN** an open page referencing another page
- **WHEN** the user chooses that row
- **THEN** the editor pane opens the referenced page and marks it active

#### Scenario: A forwardlink to a missing page still opens it

- **GIVEN** an open page referencing a page that does not exist
- **WHEN** the user chooses that row
- **THEN** the editor pane shows a blank page and no file is created

#### Scenario: A forwardlink to a date opens the journal day

- **GIVEN** an open page referencing a date with no note
- **WHEN** the user chooses that row
- **THEN** the editor pane shows the blank journal day and the calendar marks
  that day open

#### Scenario: A file row opens without navigating

- **GIVEN** an open page whose Links list includes a file row
- **WHEN** the user chooses that row
- **THEN** the file opens and the editor keeps showing the same page

### Requirement: A page with no note opens blank and is created on first save

Opening a page that has no note — through a Links row, a sidebar action, or a
journal day — SHALL open a blank editable page. Merely opening it SHALL create
no file. The file SHALL be created only when the user's edits are saved for the
first time, so the folder holds no files for pages merely viewed. A blank page
created on first save SHALL read as a new page, not as an edit to an existing
one.

#### Scenario: Viewing a missing page creates nothing

- **GIVEN** a vault with no note for a page
- **WHEN** the user opens that page without typing
- **THEN** the vault holds no new file

#### Scenario: First save creates the file

- **GIVEN** a blank page open for a page with no note
- **WHEN** the user types content and the save completes
- **THEN** the file exists in the vault holding exactly what was saved

#### Scenario: The save indicator names a new page

- **GIVEN** a blank page open with no note
- **WHEN** it has unsaved content
- **THEN** the save indicator reads as a new page being created, not as a
  pending edit
