# Spec Delta

## MODIFIED Requirements

### Requirement: An app tour explains the shell's regions

The workspace SHALL offer an app tour, opened by activating the folder rail's
tour control. The tour SHALL be a modal overlay with an accessible name, and
while it is open it SHALL contain focus and require dismissal. It SHALL present
an ordered sequence of steps, each naming one region of the shell — the folder
rail, the sidebar, the editor area, the right panel, and the status bar — and
explaining what that region holds. The step naming the editor area SHALL also
name the reference forms the page surface accepts — `#word` and `#[[Page]]` for
a page, and `#!word` and `#![[Board]]` for a board — so the tour teaches linking
as well as the pane. Each step SHALL highlight the region it names, and a step
whose region is not on screen SHALL still show its explanation rather than fail.
Every step except the first SHALL offer a way back to the previous step, every
step except the last a way forward, and the tour SHALL offer a way to end it at
any step, including by Escape. Opening the tour SHALL move focus into it, and
ending it SHALL return focus to the control that opened it. The tour SHALL be
presentational only: it SHALL change no page's content, write nothing to the
vault, and store nothing, and it SHALL NOT launch on its own. The tour SHALL be
available only at viewports wider than the compact breakpoint, where its rail
control exists; it SHALL add no work to the editing or typing path.

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

#### Scenario: The editor step names the reference forms

- **WHEN** the user reaches the step naming the editor area
- **THEN** its explanation names the forms that reference a page and a board

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
