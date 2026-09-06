# static-navigation Specification

## Purpose

Let a user navigate Folio's notes: the sidebar lists the open vault's pages and journal entries, and selecting one renders it in the editor pane.

## Requirements

### Requirement: Sidebar lists pages and journal entries from the open vault
When a vault folder is open, the sidebar SHALL list that vault's pages in the Pages section and its journal entries in the Journal section as selectable rows. The rows SHALL come from the active folder's index, not from sample data. Both sections SHALL retain independent open/close behavior.

#### Scenario: Pages section lists vault pages
- **WHEN** a vault folder is open
- **THEN** the Pages section shows a row for each page in that folder's index

#### Scenario: Journal section lists vault journal entries
- **WHEN** a vault folder is open
- **THEN** the Journal section shows a row for each journal entry in that folder's index

### Requirement: Selecting a row opens the page in the editor pane
Selecting a page or journal entry row SHALL replace the editor pane's content with that page's rendered content, and SHALL mark the selected row as the active row in the sidebar.

#### Scenario: Clicking a page row swaps the editor content
- **WHEN** the user clicks a page row in the sidebar
- **THEN** the editor pane shows that page's title and content, and the clicked row is marked active

#### Scenario: Clicking a journal entry opens it like a page
- **WHEN** the user clicks a journal entry row
- **THEN** the editor pane shows that entry's title and content

#### Scenario: Selecting a different row replaces the current one
- **WHEN** the user clicks a second row while one is already open
- **THEN** the editor pane shows the second row's content and only the second row is marked active

### Requirement: App loads to the empty state
On load, no page SHALL be open: the editor pane SHALL show the brand empty state and no sidebar row SHALL be marked active. Nothing SHALL be auto-selected, even when a folder is open.

#### Scenario: Empty state on first load
- **WHEN** the app loads with no prior selection
- **THEN** the editor pane shows the brand empty state and no sidebar row is active

#### Scenario: Empty state with a folder open
- **WHEN** a folder is open but the user has not selected a page
- **THEN** the editor pane shows the brand empty state and no sidebar row is active

### Requirement: No-folder state invites opening a folder
When no vault folder is open, the sidebar SHALL render its Journal and Pages sections empty, and the editor pane SHALL show an empty state inviting the user to open a folder.

#### Scenario: Before any folder is opened
- **WHEN** the app loads and no folder has been opened or granted
- **THEN** the Journal and Pages sections show no rows and the editor pane says "Open a folder to begin."

#### Scenario: Folder permission is not currently granted
- **WHEN** the user has stored folders but none is currently active or writable
- **THEN** the sidebar shows no rows and the editor pane shows the open-a-folder empty state

### Requirement: Open page renders title and content
When a page is open, the editor pane SHALL show the page's title (its filename stem) as a heading and its body in an editable WYSIWYG Markdown surface: ATX headings, paragraphs, and page references in Folio's two forms — `#word` and `#[[Page]]` — appear as plain editable text, not as chips. References SHALL NOT navigate or respond to clicks. Plain `[[Page]]` wikilinks are not a reference form and SHALL render as literal editable text.

#### Scenario: Page renders title and markdown body
- **WHEN** a page is open in the editor pane
- **THEN** the pane shows the page title as a heading and an editable WYSIWYG body containing the page's Markdown

#### Scenario: Reference chips are inert
- **WHEN** the open page's body contains `#word` or `#[[Page]]`
- **THEN** it appears as plain editable text that neither navigates nor responds to clicks, and no chip is rendered

#### Scenario: Plain wikilink renders as text
- **WHEN** the open page's body contains a plain `[[Page]]` wikilink
- **THEN** it appears as literal text, not as a chip

### Requirement: Meta panel remains placeholder
The meta panel SHALL continue to show placeholder copy in the Backlinks and Forwardlinks sections while a page is open.

#### Scenario: Meta placeholders persist
- **WHEN** a page is open
- **THEN** the Backlinks and Forwardlinks sections still show their placeholder copy