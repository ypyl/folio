## REMOVED Requirements

### Requirement: App loads to the empty state
On load, no page SHALL be open: the editor pane SHALL show the brand empty state and no sidebar row SHALL be marked active. Nothing SHALL be auto-selected, even when a folder is open.

#### Scenario: Empty state on first load
- **WHEN** the app loads with no prior selection
- **THEN** the editor pane shows the brand empty state and no sidebar row is active

#### Scenario: Empty state with a folder open
- **WHEN** a folder is open but the user has not selected a page
- **THEN** the editor pane shows the brand empty state and no sidebar row is active

**Reason**: Replaced by the journal-home change: with a vault open, the app now loads to today's journal note instead of an empty pane.

**Migration**: The app loads to today's journal when a vault is open (see the added requirement of the same name); the brand empty state survives only for the no-vault case, covered by "No-folder state invites opening a folder".

## ADDED Requirements

### Requirement: App loads to today's journal when a vault is open
On load with a vault folder open and its index ready, the app SHALL open that folder's today journal note — `journals/YYYY-MM-DD.md` for the current local date — in the editor pane, and the sidebar SHALL mark that day as the active item. A day without a file on disk SHALL open as a blank in-memory page; merely opening SHALL NOT create a file, and the file SHALL materialize on the first save (see the unmaterialized-pages requirement). When no folder is open, the editor pane SHALL show the brand empty state instead.

#### Scenario: Loads to today's journal with a vault open
- **GIVEN** a vault folder is open and its index is ready
- **WHEN** the app loads
- **THEN** the editor pane shows today's journal note — its file's content when a file exists, or a blank page when none does — and today's cell in the journal calendar is marked active

#### Scenario: Opening today's note creates nothing
- **GIVEN** a vault folder is open and no journal file exists for today
- **WHEN** the app loads and the user does not type
- **THEN** the vault folder contains no new file and the editor pane shows a blank page for today

#### Scenario: Loading with no folder keeps the empty state
- **WHEN** the app loads with no vault folder open
- **THEN** the editor pane shows the brand empty state and no sidebar item is marked active