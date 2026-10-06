# Spec Delta

## MODIFIED Requirements

### Requirement: The folder rail lists open folders and switches between them

The rail SHALL render the Folio brand as its first control, then the search
trigger, then the add control and one entry per open folder, and at viewports
wider than the compact breakpoint a tour control held to the rail's bottom edge
as its last control. Where the browser cannot open local folders, the rail SHALL
show no add control and the app SHALL not invoke the picker. At or below the
compact breakpoint the rail SHALL show no tour control. Activating an entry
SHALL make that folder active, and a folder whose stored permission is pending
SHALL request permission rather than opening the picker. Opening the same folder
twice SHALL NOT add a second entry. Switching folders SHALL reset the open page
to the new folder's today journal. The rail SHALL render no entries until stored
folders have resolved, SHALL keep a fixed control size, and SHALL scroll
vertically only. The tour control SHALL keep its place at the rail's bottom edge
however many folders are listed, SHALL carry an accessible name naming the
action it performs, and SHALL show visible keyboard focus.

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

## ADDED Requirements

### Requirement: An app tour explains the shell's regions

The workspace SHALL offer an app tour, opened by activating the folder rail's
tour control. The tour SHALL be a modal overlay with an accessible name, and
while it is open it SHALL contain focus and require dismissal. It SHALL present
an ordered sequence of steps, each naming one region of the shell — the folder
rail, the sidebar, the editor area, the right panel, and the status bar — and
explaining what that region holds. Each step SHALL highlight the region it
names, and a step whose region is not on screen SHALL still show its explanation
rather than fail. Every step except the first SHALL offer a way back to the
previous step, every step except the last a way forward, and the tour SHALL
offer a way to end it at any step, including by Escape. Opening the tour SHALL
move focus into it, and ending it SHALL return focus to the control that opened
it. The tour SHALL be presentational only: it SHALL change no page's content,
write nothing to the vault, and store nothing, and it SHALL NOT launch on its
own. The tour SHALL be available only at viewports wider than the compact
breakpoint, where its rail control exists; it SHALL add no work to the editing
or typing path.

#### Scenario: The rail's tour control opens the tour

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the user activates the rail's tour control
- **THEN** the tour opens at its first step, naming the folder rail and
  highlighting it

#### Scenario: Steps move forward and back

- **GIVEN** the tour is open at its first step
- **WHEN** the user moves forward
- **THEN** the next step names and highlights its region, and moving back
  returns to the first step

#### Scenario: Skipping ends the tour

- **GIVEN** the tour is open at any step
- **WHEN** the user ends it with the skip or close control
- **THEN** the tour closes

#### Scenario: Escape ends the tour

- **GIVEN** the tour is open
- **WHEN** the user presses Escape
- **THEN** the tour closes

#### Scenario: Focus enters and returns

- **GIVEN** the tour is closed and focus is on the rail's tour control
- **WHEN** the user opens the tour and then ends it
- **THEN** focus moves into the tour while it is open and returns to the tour
  control when it closes

#### Scenario: Focus is contained while the tour is open

- **GIVEN** the tour is open
- **WHEN** the user moves focus with the keyboard
- **THEN** focus stays within the tour

#### Scenario: The tour disturbs nothing

- **GIVEN** a page is open with unsaved edits and the search spotlight is closed
- **WHEN** the user opens the tour, moves through its steps, and ends it
- **THEN** the open page and its content are unchanged, the spotlight stays
  closed, and nothing is written to the vault

#### Scenario: The tour is never shown on its own

- **GIVEN** the app is opened and reloaded
- **WHEN** the user takes no action
- **THEN** the tour is not shown

#### Scenario: A step whose region is off screen still explains it

- **GIVEN** the tour is open on a step whose region is not currently rendered
- **WHEN** the step shows
- **THEN** its explanation is shown without a highlighted region

#### Scenario: The tour adds no editing work

- **GIVEN** a page is open
- **WHEN** the user types in the editor with the tour closed
- **THEN** the tour performs no work on the typing path
