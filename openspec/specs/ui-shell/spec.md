# ui-shell Specification

## Purpose

The application shell: the Kami-styled header and three-pane layout that hosts all Folio features — sidebar accordion, editor area, and meta panel — plus the transient empty state shown before a vault is opened.

## Requirements

### Requirement: Application renders the shell layout
Folio SHALL render a full-height shell: a header row above a four-pane workspace. The workspace SHALL consist of a fixed-width folder rail, a fixed-width left sidebar, a flexible center editor pane that scrolls independently, and a fixed-width right meta panel. Pane dividers SHALL be hairline borders on flat surfaces, with no shadows or gradients. The header SHALL mirror the workspace's columns so its brand, search, and slot stay aligned with the panes beneath them.

#### Scenario: Shell fills the viewport
- **WHEN** the app loads
- **THEN** the shell spans the full viewport height and the four panes are visible side by side

#### Scenario: Long content scrolls within panes, not the page
- **WHEN** content in the center pane exceeds the viewport height
- **THEN** only the center pane scrolls and the shell layout remains fixed

#### Scenario: Header columns stay aligned to the panes
- **WHEN** the shell renders at desktop width
- **THEN** the brand sits over the rail and sidebar columns, the search input over the center pane's column, and the slot over the meta panel's column

### Requirement: UI draws exclusively from Kami tokens
All shell colors, surfaces, borders, and spacing SHALL use the Kami tokens defined in `DESIGN.md` — warm parchment surfaces, ink-blue as the only chromatic accent, warm grays only, 4px spacing base, 8px screen radius. Pure white, cool grays, and any second chromatic color SHALL NOT appear.

#### Scenario: No banned values in shipped styles
- **WHEN** the shipped stylesheet is inspected
- **THEN** no banned values are present (pure white as a surface, cool-blue grays, non-Kami chromatic colors) and every surface color referenced exists in the Kami token set

#### Scenario: Surfaces are flat
- **WHEN** the shell renders
- **THEN** panes and sections have no drop shadows or gradients; borders are 1px hairline `--border` values

### Requirement: Header shows brand, centered search, and an active-vault status slot
The header SHALL show the Folio brand at the left, a search input centered over the center pane's column, and in the right slot a display-only status for the active vault: the folder's name and its file count. The slot SHALL NOT perform actions — adding, switching, or re-granting a folder happens on the folder rail. The search input SHALL be visible but inert: it accepts typing without performing search, showing results, or reacting to shortcuts.

#### Scenario: Search sits over the content column
- **WHEN** the shell renders at desktop width
- **THEN** the search input is horizontally aligned with the center pane, not the viewport center

#### Scenario: Search input is present but inert
- **WHEN** the user types into the search input
- **THEN** text is entered with no results, dropdown, or keyboard-shortcut behavior

#### Scenario: The slot shows status and performs no actions
- **WHEN** a vault is active
- **THEN** the header slot shows the folder's name and file count and has no behavior that opens a picker, switches folders, or re-grants permission

### Requirement: Sidebar is an accordion with a New Page button
The sidebar SHALL start with a New Page button at the top, followed by two collapsible sections: Journal and Pages. Both sections SHALL support independent open/close (one section's state does not affect the other), open by default, and expand/collapse without page reloads or JavaScript manipulation of document state. There SHALL be no Tags section and no other sidebar sections.

#### Scenario: Sections open and close independently
- **WHEN** the user collapses the Pages section while Journal is open
- **THEN** Pages collapses and Journal remains open

#### Scenario: New Page button is present and quiet
- **WHEN** the shell renders
- **THEN** the New Page button is the first element of the sidebar, uses the secondary button variant, and is not the only colored element in the viewport

### Requirement: Journal section shows a placeholder, not a calendar
The Journal section body SHALL show placeholder copy stating that the calendar arrives in a later step. It SHALL NOT render a calendar grid, day marks, or date navigation.

#### Scenario: Journal placeholder
- **WHEN** the Journal section is open
- **THEN** its body is placeholder text and no calendar UI is present

### Requirement: Meta panel is an accordion of page metadata
The right meta panel SHALL contain two collapsible sections: Backlinks and Forwardlinks. Each section SHALL show placeholder copy while no page is open, and both SHALL open and close independently.

#### Scenario: Meta sections are independently collapsible
- **WHEN** the user collapses Backlinks while Forwardlinks is open
- **THEN** Backlinks collapses and Forwardlinks remains open

### Requirement: Empty state is a transient brand screen
Before any vault or page is open, the center pane SHALL show a brand screen: the FolioMark as a purely decorative element (`aria-hidden`) with a short tagline. The screen SHALL contain no button that promises an action the app cannot perform.

#### Scenario: Brand screen before a vault opens
- **WHEN** the app starts with no vault open
- **THEN** the center pane shows the FolioMark and a tagline, and no open-folder button or other interactive control is present

### Requirement: All interactive elements show visible keyboard focus
Every interactive element in the shell SHALL show a visible focus indicator using the Kami focus treatment when focused via keyboard.

#### Scenario: Focus is visible and on-palette
- **WHEN** the user tabs through the shell's interactive elements
- **THEN** each element in focus shows a visible brand-colored focus outline

### Requirement: A folder rail lists opened folders and switches between them
The shell SHALL render a narrow folder rail as the leading workspace column. The rail SHALL show an add control and one entry per opened folder; the entry for the active folder SHALL be visually distinct. Activating a rail entry SHALL make that folder the active one, and when its stored permission is pending it SHALL request permission for that stored folder instead of opening the picker. Opening the same folder twice through the picker SHALL NOT add a second entry. Switching folders SHALL reset the open page so no page is selected in the newly active folder. The rail SHALL render no folder entries until stored folders have been resolved.

#### Scenario: The add control opens the picker and lists the folder
- **WHEN** the user activates the add control and picks a folder
- **THEN** the picker opens, an entry for the folder appears on the rail, and the folder becomes active

#### Scenario: Clicking a rail entry switches the active folder
- **WHEN** the user activates a rail entry that is not the active folder
- **THEN** that folder becomes the active one and the open page resets to none

#### Scenario: The active entry is visually distinct
- **WHEN** multiple folders are listed
- **THEN** the active folder's entry is visually distinct from the others

#### Scenario: A pending-permission folder re-grants without the picker
- **WHEN** the user activates a listed folder whose stored permission is pending
- **THEN** the app requests permission for that stored folder and no picker is shown

#### Scenario: Re-picking an opened folder does not duplicate it
- **WHEN** the user picks a folder that is already listed
- **THEN** no duplicate entry appears and the existing entry becomes active

#### Scenario: No entries render while stored folders resolve
- **WHEN** the app is resolving stored folders at startup
- **THEN** the rail renders no folder entries

### Requirement: The folder rail scrolls vertically only
The folder rail SHALL never render a horizontal scrollbar: content wider than the rail's column is clipped at the rail's box edges, never scrollable sideways.

#### Scenario: The rail shows no horizontal scrollbar even with a fixed-width add control
- **GIVEN** an open vault with its folder rail rendered
- **WHEN** the rail's add control and folder entries are laid out
- **THEN** no horizontal scrollbar appears in the rail, and vertical scrolling of the entry list is unchanged
