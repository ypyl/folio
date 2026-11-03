# Spec Delta

## ADDED Requirements

### Requirement: A section's summary leads with its disclosure marker
Every accordion summary — the sidebar's Journal and Files, and the right panel's
Contents, Links, and shortcuts reference — SHALL draw its disclosure marker ahead
of its label, at the row's leading edge, and SHALL keep the row's trailing edge
for the section's own controls. The marker SHALL point right while its section is
collapsed and down while it is open, SHALL be a decoration rather than a control
of its own (the summary row stays the one disclosure control), and SHALL NOT
change the row's height.

#### Scenario: The marker leads the label

- **WHEN** a section summary renders
- **THEN** its disclosure marker is drawn to the left of its label, and anything
  else the row holds sits at its trailing edge

#### Scenario: The marker reports the section's state

- **GIVEN** a collapsed section
- **WHEN** its summary renders
- **THEN** the marker points right, and it points down once the section is open

#### Scenario: The marker adds no control

- **WHEN** the user reaches a summary row with assistive technology
- **THEN** the row is one control whose expanded state the marker draws, and the
  marker itself is not a separate control

## MODIFIED Requirements

### Requirement: The Journal summary holds the session navigation
The Journal section's summary row SHALL hold the Back and Forward controls
specified by the history capability and a Today control, in that order, at its
trailing edge, and those three controls SHALL appear nowhere else in the
sidebar. A control in the summary SHALL act as
that control alone: activating it SHALL NOT open or close the section. Back and
Forward SHALL each be disabled when there is nowhere to step on the session
trail. Today SHALL open the current day's journal exactly as choosing a calendar
day does — the file's content when it exists, otherwise a blank in-memory page
that is created on first save and creates nothing on open — and SHALL be disabled
while no folder is usable, activating nothing while disabled. Each control SHALL
name its action. The summary SHALL stay one row tall whether the section is open
or collapsed.

#### Scenario: The summary's controls are in order

- **WHEN** the sidebar renders
- **THEN** Back, Forward, and Today appear in that order at the Journal
  section's summary row's trailing edge, after its label

#### Scenario: A control does not toggle its section

- **GIVEN** the Journal section is open
- **WHEN** the user activates Back, Forward, or Today
- **THEN** the section stays open and only that control's action runs

#### Scenario: The controls survive a collapsed Journal

- **WHEN** the user collapses the Journal section
- **THEN** Back, Forward, and Today stay on its summary row, and Files takes the
  height the calendar gave up

#### Scenario: The row reports when there is nowhere to go

- **GIVEN** the session trail holds only the open entry
- **WHEN** the shell renders
- **THEN** Back and Forward are disabled and Today is enabled

#### Scenario: Today opens the current day's journal

- **GIVEN** a folder is open and another page is open
- **WHEN** the user activates Today
- **THEN** the current day's journal opens and nothing is written to the folder

#### Scenario: Today is disabled without a usable folder

- **GIVEN** no folder is open, or the active folder's index is still building
- **WHEN** the shell renders
- **THEN** Today is rendered and disabled, and activating it does nothing
