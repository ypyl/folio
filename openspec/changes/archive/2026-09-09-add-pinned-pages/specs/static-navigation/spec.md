## MODIFIED Requirements

### Requirement: Sidebar lists pages and journal entries from the open vault

When a vault folder is open, the sidebar SHALL list that vault's pages in the Pages section as selectable rows, and SHALL render the open vault's journal entries in the Journal section as a calendar. The rows and calendar SHALL come from the active folder's index, not from sample data. Both sections SHALL retain independent open/close behavior. Within the Pages section, pinned pages (see pinned-pages) SHALL be listed first in pin order — most recently pinned first — followed by the remaining pages in descending order of last-modified time (see vault-index); pages with equal last-modified time SHALL be ordered by path for a stable listing.

#### Scenario: Pages section lists vault pages

- **WHEN** a vault folder is open
- **THEN** the Pages section shows a row for each page in that folder's index

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