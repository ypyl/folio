## MODIFIED Requirements

### Requirement: Sidebar lists pages and journal entries from the open vault
When a vault folder is open, the sidebar SHALL list that vault's pages in the Pages section and its journal entries in the Journal section as selectable rows. The rows SHALL come from the active folder's index, not from sample data. Both sections SHALL retain independent open/close behavior.

#### Scenario: Pages section lists vault pages
- **WHEN** a vault folder is open
- **THEN** the Pages section shows a row for each page in that folder's index

#### Scenario: Journal section lists vault journal entries
- **WHEN** a vault folder is open
- **THEN** the Journal section shows a row for each journal entry in that folder's index

### Requirement: App loads to the empty state
On load, no page SHALL be open: the editor pane SHALL show the brand empty state and no sidebar row SHALL be marked active. Nothing SHALL be auto-selected, even when a folder is open.

#### Scenario: Empty state on first load
- **WHEN** the app loads with no prior selection
- **THEN** the editor pane shows the brand empty state and no sidebar row is active

#### Scenario: Empty state with a folder open
- **WHEN** a folder is open but the user has not selected a page
- **THEN** the editor pane shows the brand empty state and no sidebar row is active

## ADDED Requirements

### Requirement: No-folder state invites opening a folder
When no vault folder is open, the sidebar SHALL render its Journal and Pages sections empty, and the editor pane SHALL show an empty state inviting the user to open a folder.

#### Scenario: Before any folder is opened
- **WHEN** the app loads and no folder has been opened or granted
- **THEN** the Journal and Pages sections show no rows and the editor pane says "Open a folder to begin."

#### Scenario: Folder permission is not currently granted
- **WHEN** the user has stored folders but none is currently active or writable
- **THEN** the sidebar shows no rows and the editor pane shows the open-a-folder empty state

## REMOVED Requirements

### Requirement: Mock data is disposable and isolated
**Reason**: The mock vault module is deleted in this change (scan-parse-index); its portable content is lifted into real test fixtures and the sidebar now lists the real index. The disposable-data requirement described the mock era and no longer applies.

**Migration**: Components continue to receive page data through props, now supplied by the active folder's index (vault-index capability) instead of the mock module.