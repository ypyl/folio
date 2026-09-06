## MODIFIED Requirements

### Requirement: Sidebar lists pages and journal entries from the open vault
When a vault folder is open, the sidebar SHALL list that vault's pages in the Pages section as selectable rows, and SHALL render the open vault's journal entries in the Journal section as a calendar. The rows and calendar SHALL come from the active folder's index, not from sample data. Both sections SHALL retain independent open/close behavior.

#### Scenario: Pages section lists vault pages
- **WHEN** a vault folder is open
- **THEN** the Pages section shows a row for each page in that folder's index

#### Scenario: Journal section lists vault journal entries
- **WHEN** a vault folder is open
- **THEN** the Journal section shows the journal calendar, and the days that have a journal entry in that folder's index are marked in the grid

### Requirement: Selecting a row opens the page in the editor pane
Selecting a page row or a calendar day SHALL replace the editor pane's content with that page or day's rendered content, and SHALL mark the selected item as the active item in the sidebar. A calendar day without a file on disk SHALL still open, as a blank in-memory page whose file materializes on first save (see the unmaterialized-pages requirement).

#### Scenario: Clicking a page row swaps the editor content
- **WHEN** the user clicks a page row in the sidebar
- **THEN** the editor pane shows that page's title and content, and the clicked row is marked active

#### Scenario: Clicking a journal entry opens it like a page
- **WHEN** the user clicks a calendar day in the Journal section
- **THEN** the editor pane shows that day's page (its file's content, or a blank page when the day has no file), and the active marking moves to that day

#### Scenario: Selecting a different row replaces the current one
- **WHEN** the user clicks a second row while one is already open
- **THEN** the editor pane shows the second row's content and only the second row is marked active