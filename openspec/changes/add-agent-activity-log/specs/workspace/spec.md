# Spec Delta

## MODIFIED Requirements

### Requirement: The rail's bottom group holds the feedback control, or the demo's tour

The rail SHALL render the Folio brand as its first control, then the search
trigger, then the add control and one entry per open folder, and a bottom group
held to the rail's bottom edge that SHALL hold exactly one control. While the
guided demo vault is the active folder, and only at viewports wider than the
compact breakpoint, that control SHALL be the tour control. In every other state,
and at or below the compact breakpoint whether or not the demo is open, it SHALL
be the feedback control. Where the browser cannot open local folders, the rail
SHALL show no add control and the app SHALL not invoke the picker. Activating an
entry SHALL make that folder active, and a folder whose stored permission is
pending SHALL request permission rather than opening the picker. Opening the same
folder twice SHALL NOT add a second entry. Switching folders SHALL reset the open
page to the new folder's today journal. The rail SHALL render no entries until
stored folders have resolved, SHALL keep a fixed control size, and SHALL scroll
vertically only. The bottom control SHALL keep its place at the rail's bottom
edge however many folders are listed, SHALL carry an accessible name naming the
action it performs, and SHALL show visible keyboard focus.

The rail SHALL also carry the experimental switch as its own slot immediately
above the bottom group, so the group keeps exactly one control and the tour
control stays the rail's last control. The switch SHALL render in every shell
state and at every width the rail renders at.

The feedback control SHALL open the project's new-issue page, where the bug
report and feature request forms are offered, in a new browser tab, SHALL NOT
navigate the app away from its state, and SHALL change nothing in the vault, the
open page, or the app's stored preferences. The tour control SHALL open the app
tour and SHALL exist only where the tour exists.

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

#### Scenario: The demo's rail carries the tour control

- **GIVEN** the guided demo vault is open at a viewport wider than the compact
  breakpoint
- **WHEN** the shell renders
- **THEN** the rail's bottom group holds the tour control and no feedback control

#### Scenario: A real folder's rail carries the feedback control

- **GIVEN** a real folder is open at a viewport wider than the compact breakpoint
- **WHEN** the shell renders
- **THEN** the rail's bottom group holds the feedback control and no tour control

#### Scenario: The compact rail carries the feedback control

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the navigation view is shown
- **THEN** the rail's bottom group holds the feedback control, whether or not the
  guided demo is open

#### Scenario: The bottom control sits at the rail's bottom

- **GIVEN** several folders listed
- **WHEN** the shell renders
- **THEN** the bottom group's control is the rail's last control, held to its
  bottom edge after every folder entry

#### Scenario: The experimental switch sits above the bottom group

- **GIVEN** the guided demo vault is open
- **WHEN** the rail renders
- **THEN** the experimental switch sits between the folder entries and the bottom
  group, and the tour control remains the rail's last control

#### Scenario: The experimental switch is present with no folder

- **GIVEN** no folder is open, or stored folders have not yet resolved
- **WHEN** the rail renders
- **THEN** its experimental switch is present above the bottom group

#### Scenario: The feedback control is present with no folder and while restoring

- **GIVEN** no folder is open, or stored folders have not yet resolved
- **WHEN** the shell renders
- **THEN** the rail shows its feedback control

#### Scenario: The feedback control opens the issue page in a new tab

- **WHEN** the user activates the feedback control
- **THEN** the project's new-issue page opens in a new browser tab and the app
  stays in the state it was in

#### Scenario: Reporting writes nothing

- **WHEN** the user activates the feedback control
- **THEN** no vault file, no stored folder reference, and no app preference changes

### Requirement: The status bar spans the wide workspace

At viewports wider than the compact breakpoint, the shell SHALL render a thin
status bar as a full-width row beneath the workspace, present in every state:
with a folder open, while it loads, on search results, on an open board, and on
the no-folder state. It SHALL show the open item's file path as a breadcrumb, a
status group holding the save-state text and the loading label, and at its
trailing edge the active folder's name and how many notes it holds, with the
running version beside them. A group SHALL be empty when it has no source, and
the bar SHALL sit outside the panes' scroll regions, so its content never
scrolls. The bar's display-only content SHALL perform no action; its controls
SHALL be the running version's disclosure, the open page's name where it has a
Files row, and, while the gate is on, the session activity's disclosure. The bar
SHALL NOT hold a Back, Forward, or Today control: those live on the Journal
section's summary row. At or below the compact breakpoint the bar SHALL NOT
render; the compact navigation bar takes its place.

#### Scenario: The bar is present in every state

- **GIVEN** the app on the no-folder state
- **WHEN** the shell renders
- **THEN** the status bar is present with its groups empty and no navigation
  control in it

#### Scenario: An open page fills the path group

- **WHEN** the user opens a page
- **THEN** the bar shows the page's file path as a breadcrumb

#### Scenario: The loading label shows in the bar

- **WHEN** the active folder is loading
- **THEN** the bar shows the loading label

#### Scenario: The bar shows the running version

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the shell renders in any state
- **THEN** it shows the version beside the folder's name and its note count, as a
  control that discloses the build's recent changes

#### Scenario: The note count is the same before and after the index lands

- **GIVEN** a folder that holds notes, and an index that is still building
- **WHEN** the bar first renders and again once the index lands
- **THEN** the count beside the folder's name is the same number both times

#### Scenario: The note count leaves out what the folder holds besides notes

- **GIVEN** a folder holding notes, an image asset, a board, and its `.folio`
  state
- **WHEN** the bar renders its folder group
- **THEN** the count is the number of notes alone

#### Scenario: The bar carries no session navigation

- **WHEN** the shell renders in any state
- **THEN** the status bar holds no Back, Forward, or Today control, and those
  controls appear on the Journal section's summary row

#### Scenario: The bar stays put while panes scroll

- **WHEN** the user scrolls a pane beneath the status bar
- **THEN** the bar remains fixed at the shell's bottom

#### Scenario: The bar performs no actions

- **WHEN** the user activates the breadcrumb's directory segments, the status
  text, or the folder name
- **THEN** nothing happens

#### Scenario: The wide bar names the open page

- **GIVEN** a viewport wider than the compact breakpoint and a page open
- **WHEN** the shell renders
- **THEN** the open page's name is a control that reveals its row in Files

#### Scenario: The activity disclosure appears only while the gate is on

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the shell renders with the gate off and again with it on
- **THEN** the bar carries no activity control in the first state and carries it
  in the second

#### Scenario: The compact shell carries no status bar controls

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** no status bar is drawn, so the activity disclosure is absent and the
  compact app bar is unchanged
