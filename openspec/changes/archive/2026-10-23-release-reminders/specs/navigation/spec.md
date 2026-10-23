# Spec Delta

## MODIFIED Requirements

### Requirement: The sidebar lists the open vault's content

When a folder is open, the sidebar SHALL list that vault's content in the Files
section as selectable rows and render its journal days in the Journal section as
a calendar. The rows and calendar SHALL come from the open folder, not from
sample data. The Files listing SHALL hold one list in this order: the vault's
pages, then its boards, then its files. Favorites SHALL be listed first among the
pages, in favorite order, followed by the remaining pages most-recently-edited
first. Boards and files SHALL follow in path order. A page row SHALL carry no
kind badge, a board row a `b` badge, and a file row an `a` badge. A page row
whose page has a reminder rule SHALL also carry a reminder marker, in the badge
treatment the kind badges use (reminders: A page row marks a page that has a
reminder). A page with no
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

#### Scenario: A page with a reminder keeps its kind badge slot free

- **GIVEN** a vault with a page that has a reminder rule and a board
- **WHEN** the Files listing renders
- **THEN** the page's row shows the reminder marker and no kind badge, and the
  board's row still shows `b`
