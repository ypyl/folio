## MODIFIED Requirements

### Requirement: Empty state is a transient brand screen
When no folder is active, the center pane SHALL show a brand screen: the FolioMark as a purely decorative element (`aria-hidden`) with a short tagline. Where the browser provides no local-folder picker, the screen SHALL state the browser requirement in place of the open-folder tagline — naming a Chromium-based browser (Chrome, Edge, or Brave) — because the open-folder instruction cannot be carried out there. This empty state SHALL be reachable at startup when no folder is stored, by activating the brand while folders are listed, and by closing the active folder. The screen SHALL contain no control that promises an action the app cannot perform; returning to an existing folder is done from the rail. Where the browser provides the local-folder picker, the screen SHALL additionally offer the one-time Logseq import action (see the logseq-import capability), and SHALL host that import's progress and result states in place of the tagline while it runs and after it finishes.

#### Scenario: Brand screen before a vault opens
- **WHEN** the app starts with no vault open
- **THEN** the center pane shows the FolioMark and a tagline, and no open-folder button is present

#### Scenario: Brand screen shows while folders are listed
- **GIVEN** one or more folders listed on the rail
- **WHEN** the user activates the brand to return home
- **THEN** the center pane shows the brand screen and every listed folder remains on the rail

#### Scenario: Brand screen names the browser requirement
- **GIVEN** a browser whose runtime provides no local-folder picker
- **WHEN** the app starts with no vault open
- **THEN** the center pane shows the FolioMark with the browser requirement naming a Chromium-based browser, and the open-folder tagline is not shown

#### Scenario: Brand screen hosts the import progress
- **WHEN** a Logseq import is running
- **THEN** the center pane shows the import's progress in place of the tagline

#### Scenario: Brand screen hosts the import result
- **WHEN** a Logseq import finishes
- **THEN** the center pane shows the import's result summary until the user continues

### Requirement: A folder rail lists opened folders and switches between them
The shell SHALL render a narrow folder rail as the leading workspace column. Where the browser provides the platform's local-folder picker, the rail SHALL show an add control; where it does not, the rail SHALL show no add control and the app SHALL NOT invoke the picker, with the brand screen stating the browser requirement instead (see the empty-state requirement). The rail SHALL show one entry per opened folder; the entry for the active folder SHALL be visually distinct. Activating a rail entry SHALL make that folder the active one, and when its stored permission is pending it SHALL request permission for that stored folder instead of opening the picker. Opening the same folder twice through the picker SHALL NOT add a second entry. A folder acquired by the Logseq import flow SHALL be listed with the same one-entry-per-folder rule and SHALL become active when the import finishes. Switching folders SHALL reset the open page to the newly active folder's today journal note — a blank in-memory page when no file exists yet, materializing on first save. The rail SHALL render no folder entries until stored folders have been resolved.

#### Scenario: The add control opens the picker and lists the folder
- **WHEN** the user activates the add control and picks a folder
- **THEN** the picker opens, an entry for the folder appears on the rail, and the folder becomes active

#### Scenario: Clicking a rail entry switches the active folder
- **WHEN** the user activates a rail entry that is not the active folder
- **THEN** that folder becomes the active one and the open page becomes that folder's today journal note

#### Scenario: The active entry is visually distinct
- **WHEN** multiple folders are listed
- **THEN** the active folder's entry is visually distinct from the others

#### Scenario: A pending-permission folder re-grants without the picker
- **WHEN** the user activates a listed folder whose stored permission is pending
- **THEN** the app requests permission for that stored folder and no picker is shown

#### Scenario: Re-picking an opened folder does not duplicate it
- **WHEN** the user picks a folder that is already listed
- **THEN** no duplicate entry appears and the existing entry becomes active

#### Scenario: An imported destination joins the rail once
- **GIVEN** a folder already listed on the rail
- **WHEN** the user imports Logseq into that same folder
- **THEN** no second entry appears and that folder is active

#### Scenario: No entries render while stored folders resolve
- **WHEN** the app is resolving stored folders at startup
- **THEN** the rail renders no folder entries

#### Scenario: No add control where the browser cannot open folders
- **GIVEN** a browser whose runtime provides no local-folder picker
- **WHEN** the shell renders
- **THEN** the rail shows no add control and the app offers no other control that opens the picker, while the rail keeps its column in the workspace
