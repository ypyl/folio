# Spec Delta

## MODIFIED Requirements

### Requirement: The no-folder state invites opening a folder

When no folder is open, the sidebar's Journal and Files sections SHALL render
empty, and the editor pane SHALL invite the user to open a folder. In every
no-folder state, that state SHALL also offer the guided demo, in every browser.
Where the browser can open local folders, that state SHALL also offer the
one-time Logseq import; where it cannot, the invitation and the guided demo
stand alone.

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

#### Scenario: The no-folder state offers the import

- **WHEN** a browser that can open local folders loads with no folder open
- **THEN** the editor pane offers the Import from Logseq action beside the
  invitation

#### Scenario: No import where folders cannot be opened

- **GIVEN** a browser that cannot open local folders
- **WHEN** the app loads with no folder open
- **THEN** the editor pane shows the invitation with the guided demo and no
  import action
