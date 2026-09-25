## REMOVED Requirements

### Requirement: Application renders the workspace shell
**Reason**: The requirement fixes the folder rail as a never-collapsible column and puts the left strip between the rail and the sidebar, so the strip can only fold the sidebar. The left strip now leads the workspace and folds the folder rail together with the left sidebar.
**Migration**: Replaced by "Application renders the shell with a foldable left navigation". The scroll rules, hairline dividers, and no-header-band rule carry over unchanged.

### Requirement: The side panes collapse to thin full-height strips
**Reason**: The requirement places the left strip between the folder rail and the sidebar and folds only the sidebar. The left strip now sits at the workspace's leading edge and folds the folder rail and the left sidebar as one unit.
**Migration**: Replaced by "The left navigation and the right meta panel fold to thin full-height strips". The right meta panel's behavior is unchanged.

## ADDED Requirements

### Requirement: Application renders the shell with a foldable left navigation
Folio SHALL render a full-height shell: a workspace of the left-navigation unit, a flexible center editor pane, and a right meta panel, with two full-height collapse strips and the app-level status bar as a full-width row below the workspace (the status-bar requirement). The workspace SHALL consist of a collapse strip, a fixed-width folder rail, a left sidebar, a flexible center editor pane, a right meta panel, and a collapse strip, in that order from left to right. The folder rail and the left sidebar SHALL fold together as one collapsible left-navigation unit (the side-pane collapse requirement); while expanded each SHALL be fixed-width, and while folded each SHALL occupy no width, leaving their collapse strip in place. The right meta panel SHALL be independently collapsible (the side-pane collapse requirement); while expanded it SHALL be fixed-width, and while collapsed it SHALL occupy no width, leaving its collapse strip in place. Pane dividers SHALL be hairline borders on flat surfaces, with no shadows or gradients. The shell itself SHALL NOT scroll, and no pane SHALL scroll the page: a pane whose content exceeds its height SHALL scroll within itself, and a pane MAY hold more than one scroll region — the sidebar's Pages and Assets sections and the meta panel's Backlinks, Forwardlinks, and References sections each scroll within their own body (the sidebar and meta-panel requirements). The shell SHALL render no header band above the workspace: the panes start at the shell's top edge, and no standing row of chrome sits above them.

#### Scenario: Shell fills the viewport
- **WHEN** the app loads
- **THEN** the shell spans the full viewport height, the panes start at the shell's top edge with no band above them, and each collapse strip spans the workspace's full height

#### Scenario: Long content scrolls within panes, not the page
- **WHEN** content in a pane exceeds that pane's height
- **THEN** it scrolls inside the body of whichever section holds it — in the sidebar or in the meta panel — and the shell layout stays fixed

#### Scenario: Folding the left navigation removes the rail and the sidebar
- **WHEN** the left navigation is folded
- **THEN** the folder rail and the left sidebar each occupy no width, the editor takes both widths, and the collapse strip remains in place

#### Scenario: No header band above the workspace
- **WHEN** the shell renders in any app state
- **THEN** the workspace's panes start at the shell's top edge and no element occupies a standing row above them

### Requirement: The left navigation and the right meta panel fold to thin full-height strips
The workspace's leading edge SHALL hold a thin, vertical, full-height control strip that folds and unfolds the left-navigation unit — the folder rail together with the left sidebar. The right meta panel SHALL be collapsible and expandable through a matching strip at the workspace's right edge beside the panel. Each strip SHALL be a button spanning the workspace's full height and SHALL show an arrow that points toward the unit's own outer edge while the unit is expanded and toward the editor pane while it is collapsed. The left navigation and the right meta panel SHALL both start expanded on every load, and the collapsed/expanded state SHALL be session-only — held in memory, reset by a reload, and never written to the vault or any other storage. Folding the left navigation SHALL remove exactly the folder rail's width and the left sidebar's width, which the flexible center editor pane SHALL take up; collapsing the right meta panel SHALL remove exactly that panel's width. Neither toggle SHALL change the other side, the open page, the search spotlight's open/closed state, or the editor content. A folded unit's content SHALL not be rendered as visible or focusable. The left strip SHALL carry an accessible name naming the left-navigation unit it folds, and the right strip SHALL name the meta panel; each SHALL expose its expanded/collapsed state to assistive technology. Toggling SHALL be possible with a keyboard from the strip button, SHALL cause no navigation, and SHALL NOT require a reload.

#### Scenario: Both sides start expanded
- **WHEN** the app loads
- **THEN** the left navigation and the right meta panel are expanded and each strip's arrow points toward its unit's outer edge

#### Scenario: Folding the left navigation gives the width to the editor
- **GIVEN** the left navigation is expanded
- **WHEN** the user activates the left strip
- **THEN** the folder rail and the left sidebar collapse to no width, the editor pane grows by both widths, and the strip remains in place with its arrow pointing toward the editor

#### Scenario: Collapsing the right meta panel gives the width to the editor
- **GIVEN** the meta panel is expanded
- **WHEN** the user activates the right strip
- **THEN** the meta panel collapses to no width, the editor pane grows by the panel's width, and the strip remains in place with its arrow pointing toward the editor

#### Scenario: The two sides collapse independently
- **WHEN** the user folds the left navigation while the meta panel is expanded
- **THEN** the left navigation folds and the meta panel stays expanded

#### Scenario: The rail folds with the sidebar
- **GIVEN** the left navigation is expanded
- **WHEN** the user activates the left strip
- **THEN** the folder rail and the left sidebar are both hidden and neither is focusable, and the editor pane takes the width of both

#### Scenario: The strips do not move between states
- **WHEN** the user folds and unfolds either side
- **THEN** each strip keeps the same position in the workspace it had before the toggle

#### Scenario: The collapse state resets on reload
- **GIVEN** the user has folded the left navigation
- **WHEN** the app is reloaded
- **THEN** the left navigation and the meta panel are both expanded again and no storage holds the previous state

#### Scenario: Collapsing changes nothing but the layout
- **GIVEN** a page is open with unsaved edits and the search spotlight is closed
- **WHEN** the user collapses the meta panel
- **THEN** the open page, the editor's content, and the search spotlight's open/closed state are unchanged

#### Scenario: A collapsed side leaves the tab order
- **GIVEN** the left navigation is folded
- **WHEN** the user moves focus with the keyboard
- **THEN** no control inside the folder rail or the left sidebar receives focus

#### Scenario: The strip announces what it controls
- **WHEN** the user focuses a strip
- **THEN** it reports an accessible name naming the unit it folds and exposes whether that unit is expanded or folded

## MODIFIED Requirements

### Requirement: A folder rail lists opened folders and switches between them
The shell SHALL render a narrow folder rail as the workspace's leading pane after the collapse strip. Where the browser provides the platform's local-folder picker, the rail SHALL show an add control; where it does not, the rail SHALL show no add control and the app SHALL NOT invoke the picker, with the brand screen stating the browser requirement instead (see the empty-state requirement). The rail SHALL show one entry per opened folder; the entry for the active folder SHALL be visually distinct. Activating a rail entry SHALL make that folder the active one, and when its stored permission is pending it SHALL request permission for that stored folder instead of opening the picker. Opening the same folder twice through the picker SHALL NOT add a second entry. A folder acquired by the Logseq import flow SHALL be listed with the same one-entry-per-folder rule and SHALL become active when the import finishes. Switching folders SHALL reset the open page to the newly active folder's today journal note — a blank in-memory page when no file exists yet, materializing on first save. The rail SHALL render no folder entries until stored folders have been resolved.

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
