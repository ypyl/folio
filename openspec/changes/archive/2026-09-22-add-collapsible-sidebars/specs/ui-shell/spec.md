## MODIFIED Requirements

### Requirement: Application renders the shell layout
Folio SHALL render a full-height shell: a header row above a workspace of four panes plus two full-height collapse strips. The workspace SHALL consist of a fixed-width folder rail, a collapse strip, a left sidebar, a flexible center editor pane, a right meta panel, and a collapse strip, in that order from left to right. The folder rail SHALL be fixed-width and SHALL NOT be collapsible. The left sidebar and the right meta panel SHALL each be collapsible (the side-pane collapse requirement); while expanded they SHALL be fixed-width, and while collapsed they SHALL occupy no width, leaving their collapse strip in place. Pane dividers SHALL be hairline borders on flat surfaces, with no shadows or gradients. The shell itself SHALL NOT scroll, and no pane SHALL scroll the page: a pane whose content exceeds its height SHALL scroll within itself, and a pane MAY hold more than one scroll region — the sidebar's Pages and Assets sections and the meta panel's Backlinks, Forwardlinks, and References sections each scroll within their own body (the sidebar and meta-panel requirements). The header SHALL mirror the workspace's columns so its brand, search, and slot stay aligned with the panes beneath them, including while either side pane is collapsed.

#### Scenario: Shell fills the viewport
- **WHEN** the app loads
- **THEN** the shell spans the full viewport height, the four panes are visible side by side, and each collapse strip spans the workspace's full height

#### Scenario: Long content scrolls within panes, not the page
- **WHEN** content in a pane exceeds that pane's height
- **THEN** it scrolls inside the body of whichever section holds it — in the sidebar or in the meta panel — and the shell layout stays fixed

#### Scenario: Header columns stay aligned to the panes
- **WHEN** the shell renders at desktop width
- **THEN** the brand sits over the rail and sidebar columns, the search input over the center pane's column, and the slot over the meta panel's column

#### Scenario: The rail is never collapsed away
- **WHEN** either side pane is collapsed
- **THEN** the folder rail keeps its width and its contents stay in place

### Requirement: Side panes collapse to a thin full-height strip
The left sidebar and the right meta panel SHALL each be collapsible and expandable through a thin, vertical, full-height control strip on that pane's outer edge: the left strip SHALL sit between the folder rail and the left sidebar, and the right strip SHALL sit at the workspace's right edge beside the meta panel. Each strip SHALL be a button spanning the workspace's full height and SHALL show an arrow that points toward the pane's own outer edge while the pane is expanded and toward the editor pane while the pane is collapsed. Both panes SHALL start expanded on every load, and the collapsed/expanded state SHALL be session-only — held in memory, reset by a reload, and never written to the vault or any other storage. Collapsing a pane SHALL remove exactly that pane's width, which the flexible center editor pane SHALL take up, and SHALL leave the other panes, the header, the open page, the search surface, and the editor content unchanged. A collapsed pane's content SHALL not be rendered as visible or focusable. Each strip SHALL carry an accessible name naming the pane it controls and SHALL expose its expanded/collapsed state to assistive technology. Toggling SHALL be possible with a keyboard from the strip button, SHALL cause no navigation, and SHALL NOT require a reload.

#### Scenario: Both panes start expanded
- **WHEN** the app loads
- **THEN** the left sidebar and right meta panel are expanded and each strip's arrow points toward its pane's outer edge

#### Scenario: Collapsing the left sidebar gives the width to the editor
- **GIVEN** the left sidebar is expanded
- **WHEN** the user activates the left strip
- **THEN** the sidebar collapses to no width, the editor pane grows by the sidebar's width, and the strip remains in place with its arrow pointing toward the editor

#### Scenario: Collapsing the right meta panel gives the width to the editor
- **GIVEN** the meta panel is expanded
- **WHEN** the user activates the right strip
- **THEN** the meta panel collapses to no width, the editor pane grows by the panel's width, and the strip remains in place with its arrow pointing toward the editor

#### Scenario: The two panes collapse independently
- **WHEN** the user collapses the left sidebar while the meta panel is expanded
- **THEN** the sidebar collapses and the meta panel stays expanded

#### Scenario: The strips do not move between states
- **WHEN** the user collapses and expands either pane
- **THEN** each strip keeps the same position in the workspace it had before the toggle

#### Scenario: The header mirrors the collapse
- **GIVEN** the left sidebar is collapsed
- **WHEN** the shell renders
- **THEN** the header no longer reserves the sidebar's column and the search input stays centered over the editor pane's current column

#### Scenario: The collapse state resets on reload
- **GIVEN** the user has collapsed the left sidebar
- **WHEN** the app is reloaded
- **THEN** both panes are expanded again and no storage holds the previous state

#### Scenario: Collapsing changes nothing but the layout
- **GIVEN** a page is open with unsaved edits
- **WHEN** the user collapses the meta panel
- **THEN** the open page, the editor's content, and the search query are unchanged

#### Scenario: A collapsed pane leaves the tab order
- **GIVEN** the meta panel is collapsed
- **WHEN** the user moves focus with the keyboard
- **THEN** no control inside the collapsed panel receives focus

#### Scenario: The strip announces what it controls
- **WHEN** the user focuses a strip
- **THEN** it reports an accessible name naming its pane and exposes whether that pane is expanded or collapsed
