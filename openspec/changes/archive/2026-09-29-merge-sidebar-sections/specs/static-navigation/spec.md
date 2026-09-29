## RENAMED Requirements

- FROM: `### Requirement: Sidebar lists pages and journal entries from the open vault`
- TO: `### Requirement: Sidebar lists the vault's files and journal entries from the open vault`

## MODIFIED Requirements

### Requirement: Sidebar lists the vault's files and journal entries from the open vault

When a vault folder is open, the sidebar SHALL list that vault's files in the Files section as selectable rows, and SHALL render the open vault's journal entries in the Journal section as a calendar. The rows and calendar SHALL come from the active folder's index, not from sample data. The Files section SHALL hold one listing with three kind-ordered groups: the vault's non-journal pages first, then its boards, then its assets. Within the pages, pinned pages (see pinned-pages) SHALL be listed first in pin order — most recently pinned first — followed by the remaining pages in descending order of last-modified time (see vault-index); pages with equal last-modified time SHALL be ordered by path for a stable listing. The vault's boards SHALL follow the pages in path order (whiteboards capability), and the vault's assets SHALL follow the boards in path order (vault-assets capability). A page row SHALL carry no kind badge; a board row SHALL carry a `b` badge before its label, and an asset row an `a` badge before its label. Asset rows SHALL NOT be dimmed, because a row exists only for a file the vault holds; a page row whose page has no file on disk SHALL stay dimmed and clickable. Both sections SHALL retain independent open/close behavior.

The Files listing SHALL render only the rows near the visible part of the Files section's own scroll region: the number of rows in the document SHALL NOT grow with the number of files in the vault. Windowing SHALL NOT change what the listing is: its scroll extent SHALL cover every file, its order SHALL be the order specified above, the open item's row — the open page's or the open board's — SHALL always be rendered and marked, and assistive technology SHALL be able to read each rendered row's position in the list and the list's total size.

#### Scenario: Pages section lists vault pages

- **WHEN** a vault folder is open
- **THEN** the Files listing covers every page, board, and asset in that folder's index, in the order pages then boards then assets, and the first rows are rendered

#### Scenario: Journal section lists vault journal entries

- **WHEN** a vault folder is open
- **THEN** the Journal section shows the journal calendar, and the days that have a journal entry in that folder's index are marked in the grid

#### Scenario: Pinned pages lead the Pages section

- **GIVEN** a vault where `Vision.md` is pinned and `Ideas.md`, `Log.md` are unpinned, and `Ideas.md` was edited most recently
- **WHEN** the Files section renders
- **THEN** `Vision.md` is the first row (pinned, with its star), then `Ideas.md` (edited most recently), then `Log.md`

#### Scenario: Unpinning moves a page into edit order

- **GIVEN** pinned `Vision.md` and unpinned pages `Ideas.md`, `Log.md`
- **WHEN** `Vision.md` is unpinned and `Ideas.md` was edited most recently
- **THEN** the Files listing shows `Ideas.md`, `Log.md`, `Vision.md` in that order, all unpinned

#### Scenario: Boards and assets follow the pages, badged

- **GIVEN** a vault with a page `Log.md`, boards `boards/sprint-14.excalidraw` and `boards/kitchen.excalidraw`, and assets `assets/shot.png` and `assets/q3-report.pdf`
- **WHEN** the Files section renders
- **THEN** `Log.md` is followed by the two board rows (each with a `b` badge) in path order, then the two asset rows (each with an `a` badge) in path order, and `Log.md` carries no badge

#### Scenario: The listing renders a bounded number of rows

- **GIVEN** a vault with thousands of files
- **WHEN** the Files section renders
- **THEN** only a small number of rows near the visible part of the Files scroll region are in the document, and that number does not grow with the vault

#### Scenario: Scrolling reaches every page

- **GIVEN** a vault with thousands of files
- **WHEN** the user scrolls the Files listing to its end
- **THEN** the last file in the listing is rendered and can be activated like any other row, while the Journal section stays in place

#### Scenario: The open page's row is always rendered

- **GIVEN** the open page sits far from the current scroll position in the Files listing
- **WHEN** the Files section renders
- **THEN** that page's row is in the document and marked as the active row

#### Scenario: The open board's row is always rendered

- **GIVEN** an open board sits far from the current scroll position in the Files listing
- **WHEN** the Files section renders
- **THEN** that board's row is in the document and marked as the active row, exactly as an open page's row is

#### Scenario: Assistive technology reads the whole listing

- **WHEN** a row in the Files listing is rendered
- **THEN** it reports its position in the listing and the listing's total size, so a windowed listing is not read as a short list

### Requirement: No-folder state invites opening a folder

When no vault folder is open, the sidebar SHALL render its Journal and Files sections empty — no calendar marks, no rows — and the editor pane SHALL show an empty state inviting the user to open a folder. Where the browser provides the local-folder picker, that empty state SHALL also offer the one-time Logseq import action described by the logseq-import capability; where it does not, the invitation stands alone. Both section summaries SHALL still be rendered, in the order the ui-shell capability specifies.

#### Scenario: Before any folder is opened

- **WHEN** the app loads and no folder has been opened or granted
- **THEN** the Journal and Files sections show no rows and no calendar marks, their summaries remain in the sidebar, and the editor pane says "Open a folder to begin."

#### Scenario: Folder permission is not currently granted

- **WHEN** the user has stored folders but none is currently active or writable
- **THEN** the sidebar shows no rows and the editor pane shows the open-a-folder empty state

#### Scenario: The empty state offers the import action

- **WHEN** the app loads with no folder open in a browser that provides the local-folder picker
- **THEN** the editor pane offers the Import from Logseq action beside the open-a-folder invitation

#### Scenario: The empty state offers no import action without a picker

- **GIVEN** a browser whose runtime provides no local-folder picker
- **WHEN** the app loads with no folder open
- **THEN** the editor pane shows the open-a-folder empty state with no Import from Logseq action
