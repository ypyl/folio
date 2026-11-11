# Spec Delta

## REMOVED Requirements

### Requirement: The no-folder state invites opening a folder

**Reason**: The requirement offers the in-app import where folders can be
opened. The invitation and the guided demo stay; the import does not.

**Migration**: Superseded by "The no-folder state invites a folder and offers
the demo".

## ADDED Requirements

### Requirement: The no-folder state invites a folder and offers the demo

When no folder is open, the sidebar's Journal and Files sections SHALL render
empty, and the editor pane SHALL invite the user to open a folder. In every
no-folder state, that state SHALL also offer the guided demo, in every browser.

#### Scenario: Before any folder is opened

- **WHEN** the app loads and no folder has been opened
- **THEN** both sections show no rows, their summaries remain, and the editor
  pane says "Open a folder to begin."

#### Scenario: No folder is currently active

- **WHEN** the user has opened folders before but none is active
- **THEN** the sidebar shows no rows and the editor pane shows the no-folder
  state

#### Scenario: The no-folder state offers the guided demo

- **WHEN** the app loads with no folder open
- **THEN** the editor pane offers a control that opens the guided demo, and
  activating it shows the demo's Welcome page
