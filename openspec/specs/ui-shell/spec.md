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

### Requirement: The brand returns to the empty state
The Folio brand (the mark and title in the header's top-left) SHALL act as a home control: activating it SHALL make no folder active and show the empty state, leaving every listed folder on the rail. It SHALL work whether or not a folder is currently active, SHALL NOT close or forget any folder, and SHALL be a no-op when the empty state is already showing.

#### Scenario: Activating the brand returns home
- **GIVEN** an active folder with an open page
- **WHEN** the user activates the brand
- **THEN** no folder is active, the empty state shows, and the open page is no longer shown

#### Scenario: Activating the brand forgets nothing
- **GIVEN** one or more folders listed on the rail
- **WHEN** the user activates the brand
- **THEN** every listed folder remains listed and none is closed

#### Scenario: Activating the brand from the empty state is a no-op
- **GIVEN** the empty state is showing with no active folder
- **WHEN** the user activates the brand
- **THEN** the empty state remains showing and no folder becomes active

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
When no folder is active, the center pane SHALL show a brand screen: the FolioMark as a purely decorative element (`aria-hidden`) with a short tagline. This empty state SHALL be reachable at startup when no folder is stored, by activating the brand while folders are listed, and by closing the active folder. The screen SHALL contain no button that promises an action the app cannot perform; returning to a folder is done from the rail.

#### Scenario: Brand screen before a vault opens
- **WHEN** the app starts with no vault open
- **THEN** the center pane shows the FolioMark and a tagline, and no open-folder button or other interactive control is present

#### Scenario: Brand screen shows while folders are listed
- **GIVEN** one or more folders listed on the rail
- **WHEN** the user activates the brand to return home
- **THEN** the center pane shows the brand screen and every listed folder remains on the rail

### Requirement: Panes show loading placeholders while the index builds
While the active folder's index is being built — when a folder is first opened, when the user switches to another listed folder, and when a stored folder's permission is re-granted — the shell SHALL show loading placeholders in the panes whose content derives from the index, replacing the empty content those panes would otherwise show. The editor pane SHALL show placeholder body lines in place of its notes hint, the sidebar SHALL show placeholder rows in place of the Journal and Pages listings, and the meta panel SHALL show placeholder rows in its Backlinks and Forwardlinks sections in place of their placeholder copy. The loading state SHALL be announced to assistive technology as an in-progress status labeled "Indexing notes…", and the placeholder blocks themselves SHALL be purely decorative. The loading state SHALL end when the active folder's index resolves, at which point the panes SHALL render the folder's real content and all post-index behavior is unchanged: the today journal opens in the editor, the sidebar lists the folder's pages, and search enables. While no folder is active, the shell SHALL show the brand empty state, never loading placeholders.

#### Scenario: Opening a folder shows loading placeholders
- **WHEN** a folder whose index takes measurable time to build is opened
- **THEN** the editor pane, sidebar, and meta panel show loading placeholders instead of empty content, and they keep showing them until the index resolves

#### Scenario: The meta panel shows loading placeholders
- **WHEN** the active folder's index is building and no page is open
- **THEN** the Backlinks and Forwardlinks sections show placeholder rows instead of their placeholder copy

#### Scenario: Switching folders re-enters the loading state
- **WHEN** the user activates a second listed folder while one is open
- **THEN** the panes show loading placeholders while the new folder's index builds, and the placeholder content is replaced by the new folder's pages once the index resolves

#### Scenario: Loading ends with real content
- **WHEN** the active folder's index resolves after its loading state was showing
- **THEN** the placeholders are gone, the editor opens the folder's today journal, the sidebar lists the folder's pages, and search is enabled

#### Scenario: No placeholders while no folder is active
- **WHEN** no folder is active, including after the user returns home via the brand
- **THEN** the shell shows the brand empty state and no loading placeholders

#### Scenario: Loading placeholders are announced, not read as content
- **WHEN** the panes are showing loading placeholders
- **THEN** assistive technology is informed of an in-progress status labeled "Indexing notes…", and the placeholder blocks themselves are not read as page or note content

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

### Requirement: A folder rail entry can be closed
Every folder rail entry SHALL carry a close control that removes that entry from the rail and forgets its folder. The close control SHALL be a distinct surface from the entry's switch action: activating it SHALL NOT activate the entry or switch folders. Closing a non-active entry SHALL leave the active folder, its open page, and the workspace unchanged. Closing the active entry SHALL return the app to the empty state with no active folder, while any other listed folders remain on the rail. Closing an entry SHALL leave all other entries listed. Closing a folder SHALL NOT delete or modify its files on disk.

#### Scenario: A close control closes an entry without switching
- **GIVEN** two granted folders listed on the rail with the first active
- **WHEN** the user activates the close control of the second entry
- **THEN** the second entry is no longer listed, the first folder stays active, and the open page is unchanged

#### Scenario: Closing the active entry returns to the empty state
- **GIVEN** the active folder entry at the top of the rail with two other folders listed below it
- **WHEN** the user closes the active entry
- **THEN** the entry is removed, no folder is active, the empty state shows, and the two other folders remain listed

#### Scenario: The close control never triggers a switch
- **WHEN** the user activates an entry's close control while that entry is not the active folder
- **THEN** the entry is removed and the active folder does not change

#### Scenario: Closing a folder leaves the other entries listed
- **GIVEN** three granted folders listed on the rail
- **WHEN** the user closes one of them
- **THEN** the closed folder's entry is gone and the other two entries remain listed

#### Scenario: Closing does not touch the folder on disk
- **GIVEN** a listed folder whose Markdown files exist on disk
- **WHEN** the user closes that folder
- **THEN** the app forgets only its reference and every file in the folder remains on disk unchanged

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
