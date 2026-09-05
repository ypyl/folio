## MODIFIED Requirements

### Requirement: Application renders the shell layout
Folio SHALL render a full-height shell: a header row above a four-pane workspace. The workspace SHALL consist of a fixed-width folder rail, a fixed-width left sidebar, a flexible center editor pane that scrolls independently, and a fixed-width right meta panel. Pane dividers SHALL be hairline borders on flat surfaces, with no shadows or gradients. The header SHALL mirror the workspace's columns so its brand, search, and slot stay aligned with the panes beneath them.

#### Scenario: Shell fills the viewport
- **WHEN** the app loads
- **THEN** the shell spans the full viewport height and the four panes are visible side by side

#### Scenario: Long content scrolls within panes, not the page
- **WHEN** content in the center pane exceeds the viewport height
- **THEN** only the center pane scrolls and the shell layout remains fixed

#### Scenario: Header columns stay aligned to the panes
- **WHEN** the shell renders at desktop width
- **THEN** the brand sits over the rail and sidebar columns, the search input over the center pane's column, and the slot over the meta panel's column

### Requirement: Header shows brand, centered search, and an active-vault status slot
The header SHALL show the Folio brand at the left, a search input centered over the center pane's column, and in the right slot a display-only status for the active vault: the folder's name and its file count. The slot SHALL NOT perform actions — adding, switching, or re-granting a folder happens on the folder rail. The search input SHALL be visible but inert: it accepts typing without performing search, showing results, or reacting to shortcuts.

#### Scenario: Search sits over the content column
- **WHEN** the shell renders at desktop width
- **THEN** the search input is horizontally aligned with the center pane, not the viewport center

#### Scenario: Search input is present but inert
- **WHEN** the user types into the search input
- **THEN** text is entered with no results, dropdown, or keyboard-shortcut behavior

#### Scenario: The slot shows status and performs no actions
- **WHEN** a vault is active
- **THEN** the header slot shows the folder's name and file count and has no behavior that opens a picker, switches folders, or re-grants permission

## ADDED Requirements

### Requirement: A folder rail lists opened folders and switches between them
The shell SHALL render a narrow folder rail as the leading workspace column. The rail SHALL show an add control and one entry per opened folder; the entry for the active folder SHALL be visually distinct. Activating a rail entry SHALL make that folder the active one, and when its stored permission is pending it SHALL request permission for that stored folder instead of opening the picker. Opening the same folder twice through the picker SHALL NOT add a second entry. Switching folders SHALL reset the open page so no page is selected in the newly active folder. The rail SHALL render no folder entries until stored folders have been resolved.

#### Scenario: The add control opens the picker and lists the folder
- **WHEN** the user activates the add control and picks a folder
- **THEN** the picker opens, an entry for the folder appears on the rail, and the folder becomes active

#### Scenario: Clicking a rail entry switches the active folder
- **WHEN** the user activates a rail entry that is not the active folder
- **THEN** that folder becomes the active one and the open page resets to none

#### Scenario: The active entry is visually distinct
- **WHEN** multiple folders are listed
- **THEN** the active folder's entry is visually distinct from the others

#### Scenario: A pending-permission folder re-grants without the picker
- **WHEN** the user activates a listed folder whose stored permission is pending
- **THEN** the app requests permission for that stored folder and no picker is shown

#### Scenario: Re-picking an opened folder does not duplicate it
- **WHEN** the user picks a folder that is already listed
- **THEN** no duplicate entry appears and the existing entry becomes active

#### Scenario: No entries render while stored folders resolve
- **WHEN** the app is resolving stored folders at startup
- **THEN** the rail renders no folder entries