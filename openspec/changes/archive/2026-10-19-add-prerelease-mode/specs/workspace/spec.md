# Spec Delta

## MODIFIED Requirements

### Requirement: The folder rail lists open folders and switches between them

The rail SHALL render the Folio brand as its first control, then the search
trigger, then the add control and one entry per open folder, then a prerelease
control, and at viewports wider than the compact breakpoint a tour control held
to the rail's bottom edge as its last control. Where the browser cannot open
local folders, the rail SHALL show no add control and the app SHALL not invoke
the picker. At or below the compact breakpoint the rail SHALL show no tour
control. Activating an entry SHALL make that folder active, and a folder whose
stored permission is pending SHALL request permission rather than opening the
picker. Opening the same folder twice SHALL NOT add a second entry. Switching
folders SHALL reset the open page to the new folder's today journal. The rail
SHALL render no entries until stored folders have resolved, SHALL keep a fixed
control size, and SHALL scroll vertically only. The tour control SHALL keep its
place at the rail's bottom edge however many folders are listed, SHALL carry an
accessible name naming the action it performs, and SHALL show visible keyboard
focus. The prerelease control SHALL render in every state, compact included,
SHALL carry an accessible name and `aria-pressed`, and SHALL sit before the tour
control.

#### Scenario: The add control opens the picker and lists the folder

- **WHEN** the user activates the add control and picks a folder
- **THEN** an entry for it appears on the rail and the folder becomes active

#### Scenario: Choosing a rail entry switches the folder

- **WHEN** the user activates an entry that is not active
- **THEN** that folder becomes active and the open page becomes its today journal

#### Scenario: The active entry is distinct

- **WHEN** several folders are listed
- **THEN** the active folder's entry is visually distinct

#### Scenario: A pending folder re-grants without the picker

- **WHEN** the user activates a listed folder whose permission is pending
- **THEN** the app requests permission and shows no picker

#### Scenario: No duplicate entry

- **WHEN** the user picks a folder that is already listed
- **THEN** no duplicate appears and the existing entry becomes active

#### Scenario: No add control where folders cannot be opened

- **GIVEN** a browser that cannot open local folders
- **WHEN** the shell renders
- **THEN** the rail shows no add control while keeping its column

#### Scenario: The tour control sits at the rail's bottom

- **GIVEN** a viewport wider than the compact breakpoint and several folders listed
- **WHEN** the shell renders
- **THEN** the tour control is the rail's last control, held to its bottom edge
  after every folder entry

#### Scenario: The compact rail carries no tour control

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the navigation view is shown
- **THEN** the rail shows no tour control

#### Scenario: The prerelease control renders before the tour

- **WHEN** the rail renders
- **THEN** the prerelease control is present and the tour control, where shown,
  follows it
