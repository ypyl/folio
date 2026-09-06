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

### Requirement: Header shows brand, content-width search, and an active-vault status slot
The header SHALL show the Folio brand at the left, a search input centered over and spanning the center pane's column, and in the right slot a display-only status for the active vault: the folder's name and its file count. The slot SHALL NOT perform actions — adding, switching, or re-granting a folder happens on the folder rail. The search input's width SHALL match the content column it sits over (capped at a readable maximum), not a fixed narrow box, so the box and its dropdown align with the content beneath. Search behavior — the results dropdown, matching, keyboard, and edge states — is specified by the search capability.

#### Scenario: Search spans the content column
- **WHEN** the shell renders at desktop width
- **THEN** the search input is horizontally aligned with the center pane and spans that column's width, not a fixed-width box

#### Scenario: Search behavior lives with the search capability
- **WHEN** the user types into the search input
- **THEN** the input's behavior is the search capability's: a results dropdown, keyboard shortcuts, and empty states, none of which were present while the input was inert

#### Scenario: The slot shows status and performs no actions
- **WHEN** a vault is active
- **THEN** the header slot shows the folder's name and file count and has no behavior that opens a picker, switches folders, or re-grants permission

### Requirement: Sidebar is an accordion of Journal and Pages sections
The sidebar SHALL contain exactly two collapsible sections — Journal, then Pages — with no other sections, controls, or buttons above or between them. Both sections SHALL support independent open/close (one section's state does not affect the other), open by default, and expand/collapse without page reloads or JavaScript manipulation of document state. There SHALL be no Tags section and no New Page button.

#### Scenario: Sections open and close independently
- **WHEN** the user collapses the Pages section while Journal is open
- **THEN** Pages collapses and Journal remains open

#### Scenario: The Journal section leads the sidebar
- **WHEN** the shell renders
- **THEN** the first element of the sidebar is the Journal section, and no button or other control precedes the accordion

### Requirement: Meta panel is an accordion of page metadata
The right meta panel SHALL contain two collapsible sections: Backlinks and Forwardlinks. Each section SHALL show placeholder copy while no page is open, and both SHALL open and close independently. When a page is open, each section SHALL list its page rows instead of placeholder copy: Backlinks lists every page that references the open page, Forwardlinks lists every page the open page references, both alphabetically. A section with no matching pages SHALL show empty-state copy. Rows SHALL use the sidebar's row styling and `aria-current` marking for the open page; rows that target a page with no file on disk SHALL be visually dimmed to signal the page is not yet created, and remain clickable. Clicking any row navigates (static-navigation links-pane requirements).

#### Scenario: Meta sections are independently collapsible
- **WHEN** the user collapses Backlinks while Forwardlinks is open
- **THEN** Backlinks collapses and Forwardlinks remains open

#### Scenario: Backlinks list the open page's referrers
- **GIVEN** `Topic.md` is open and referenced by `Ideas.md` and `Log.md`
- **WHEN** the user looks at the Backlinks section
- **THEN** the section lists `Ideas` and `Log` rows, alphabetically

#### Scenario: Forwardlinks list the open page's targets
- **GIVEN** an open page whose content references `Roadmap` and the journal day `2026-09-06`
- **WHEN** the user looks at the Forwardlinks section
- **THEN** the section lists `Roadmap` and `2026-09-06` rows, alphabetically, whether or not each target's file exists

#### Scenario: Empty sections show copy instead of rows
- **GIVEN** an open page that no page references
- **WHEN** the user looks at the Backlinks section
- **THEN** the section shows empty-state copy ("Nothing links here yet."), not placeholder copy and no rows

#### Scenario: Unmaterialized targets are dimmed but clickable
- **GIVEN** an open page whose content references `Missing`, and no `Missing.md` exists
- **WHEN** the user looks at the Forwardlinks section
- **THEN** the `Missing` row is rendered dimmed, still clickable, and still navigates

#### Scenario: Placeholders persist only before a page opens
- **WHEN** no page is open
- **THEN** both sections show their placeholder copy
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
The shell SHALL render a narrow folder rail as the leading workspace column. The rail SHALL show an add control and one entry per opened folder; the entry for the active folder SHALL be visually distinct. Activating a rail entry SHALL make that folder the active one, and when its stored permission is pending it SHALL request permission for that stored folder instead of opening the picker. Opening the same folder twice through the picker SHALL NOT add a second entry. Switching folders SHALL reset the open page to the newly active folder's today journal note — a blank in-memory page when no file exists yet, materializing on first save. The rail SHALL render no folder entries until stored folders have been resolved.

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

#### Scenario: No entries render while stored folders resolve
- **WHEN** the app is resolving stored folders at startup
- **THEN** the rail renders no folder entries

### Requirement: The folder rail scrolls vertically only
The folder rail SHALL never render a horizontal scrollbar: content wider than the rail's column is clipped at the rail's box edges, never scrollable sideways.

#### Scenario: The rail shows no horizontal scrollbar even with a fixed-width add control
- **GIVEN** an open vault with its folder rail rendered
- **WHEN** the rail's add control and folder entries are laid out
- **THEN** no horizontal scrollbar appears in the rail, and vertical scrolling of the entry list is unchanged

### Requirement: Journal section shows the journal calendar
When a vault folder is open, the Journal section body SHALL render a month calendar grid for the vault's journal days. The grid SHALL be Sunday-first with one cell per day, and days that have a journal file in the open vault's index SHALL be marked with a background fill. The first and last weeks' cells that fall outside the displayed month SHALL render dimmed but remain clickable as days. The grid SHALL initially display the month of the currently open day (or the current month when no day is open), SHALL provide previous/next month controls that move the displayed month without opening a day, and opening any day SHALL re-anchor the grid to that day's month. The section SHALL provide a Today control that opens and displays the current day's journal. When no vault folder is open, the Journal section SHALL NOT render the calendar, keeping the section empty.

#### Scenario: Journal calendar marks days with entries
- **GIVEN** an open vault whose index contains `journals/2026-09-06.md`
- **WHEN** the Journal section displays September 2026
- **THEN** the 6th day cell is filled, and empty days are not filled

#### Scenario: Out-of-month days are dimmed but clickable
- **GIVEN** the calendar displays September 2026 where the 1st is a Tuesday
- **WHEN** the section renders
- **THEN** the leading cells (Aug 30, 31) and trailing cells (Oct 1–4) render with the dimmed styling and behave as clickable days

#### Scenario: The grid follows the open day
- **GIVEN** `journals/2026-08-14.md` is open
- **WHEN** the Journal section renders or the open day changes
- **THEN** the grid displays August 2026

#### Scenario: Today opens the current day's journal
- **WHEN** the user clicks the Today control
- **THEN** the editor pane opens the current day's journal (creating nothing by itself) and the grid follows that day

#### Scenario: Month controls browse without opening a day
- **GIVEN** the calendar displays September 2026 with `journals/2026-09-06.md` open
- **WHEN** the user clicks the previous-month control
- **THEN** the grid displays August 2026, the editor pane keeps its open day, and clicking a day in the visited month opens that day and re-anchors the grid

#### Scenario: No calendar without a vault
- **WHEN** no vault folder is open
- **THEN** the Journal section shows no calendar grid
