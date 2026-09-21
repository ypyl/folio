## MODIFIED Requirements

### Requirement: Sidebar lists pages and journal entries from the open vault

When a vault folder is open, the sidebar SHALL list that vault's pages in the Pages section as selectable rows, and SHALL render the open vault's journal entries in the Journal section as a calendar. The rows and calendar SHALL come from the active folder's index, not from sample data. The Boards section is specified by the whiteboards capability and the Assets section by the vault-assets capability, and all four sections SHALL retain independent open/close behavior. Within the Pages section, pinned pages (see pinned-pages) SHALL be listed first in pin order — most recently pinned first — followed by the remaining pages in descending order of last-modified time (see vault-index); pages with equal last-modified time SHALL be ordered by path for a stable listing.

The Pages listing SHALL render only the rows near the visible part of the Pages section's own scroll region: the number of rows in the document SHALL NOT grow with the number of pages in the vault. Windowing SHALL NOT change what the listing is: its scroll extent SHALL cover every page, its order SHALL be the order specified above, the open page's row SHALL always be rendered and marked, and assistive technology SHALL be able to read each rendered row's position in the list and the list's total size.

#### Scenario: Pages section lists vault pages

- **WHEN** a vault folder is open
- **THEN** the Pages listing covers every page in that folder's index, in the specified order, and the first rows are rendered

#### Scenario: Journal section lists vault journal entries

- **WHEN** a vault folder is open
- **THEN** the Journal section shows the journal calendar, and the days that have a journal entry in that folder's index are marked in the grid

#### Scenario: Pinned pages lead the Pages section

- **GIVEN** a vault where `Vision.md` is pinned and `Ideas.md`, `Log.md` are unpinned, and `Ideas.md` was edited most recently
- **WHEN** the Pages section renders
- **THEN** `Vision.md` is the first row (pinned, with its star), then `Ideas.md` (edited most recently), then `Log.md`

#### Scenario: Unpinning moves a page into edit order

- **GIVEN** pinned `Vision.md` and unpinned pages `Ideas.md`, `Log.md`
- **WHEN** `Vision.md` is unpinned and `Ideas.md` was edited most recently
- **THEN** the Pages section shows `Ideas.md`, `Log.md`, `Vision.md` in that order, all unpinned

#### Scenario: The listing renders a bounded number of rows

- **GIVEN** a vault with thousands of pages
- **WHEN** the Pages section renders
- **THEN** only a small number of rows near the visible part of the Pages scroll region are in the document, and that number does not grow with the vault

#### Scenario: Scrolling reaches every page

- **GIVEN** a vault with thousands of pages
- **WHEN** the user scrolls the Pages listing to its end
- **THEN** the last page in the listing is rendered and can be activated like any other row, while the sections below stay in place

#### Scenario: The open page's row is always rendered

- **GIVEN** the open page sits far from the current scroll position in the Pages listing
- **WHEN** the Pages section renders
- **THEN** that page's row is in the document and marked as the active row

#### Scenario: Assistive technology reads the whole listing

- **WHEN** a row in the Pages listing is rendered
- **THEN** it reports its position in the listing and the listing's total size, so a windowed listing is not read as a short list

### Requirement: No-folder state invites opening a folder

When no vault folder is open, the sidebar SHALL render its Journal, Pages, Boards, and Assets sections empty — no calendar marks, no rows — and the editor pane SHALL show an empty state inviting the user to open a folder. The four section summaries SHALL still be rendered, in the order the ui-shell capability specifies.

#### Scenario: Before any folder is opened

- **WHEN** the app loads and no folder has been opened or granted
- **THEN** the Journal, Pages, Boards, and Assets sections show no rows and no calendar marks, their summaries remain in the sidebar, and the editor pane says "Open a folder to begin."

#### Scenario: Folder permission is not currently granted

- **WHEN** the user has stored folders but none is currently active or writable
- **THEN** the sidebar shows no rows and the editor pane shows the open-a-folder empty state
