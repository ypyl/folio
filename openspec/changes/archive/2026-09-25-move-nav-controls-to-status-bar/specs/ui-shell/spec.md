## REMOVED Requirements

### Requirement: Sidebar is an accordion of Journal, Pages, and Assets sections with a navigation control row
**Reason**: The sidebar's first band holds Back, Forward, and Today. Those controls are moving to the status bar's leading edge, so the sidebar no longer has a navigation control row.
**Migration**: Replaced by "Sidebar is an accordion of Journal, Pages, Boards, and Assets sections". The four sections, their ordering, defaults, and per-section height rules are unchanged; only the control row above them is gone.

### Requirement: The status bar's leading column matches the folder rail
**Reason**: The bar now leads with Back, Forward, and Today, so the pin control can no longer sit in a folder-rail-wide column at the bar's leading edge, and no vertical hairline can continue the rail's right border there.
**Migration**: Superseded by "The shell shows an app-level status bar", which places the navigation controls at the leading edge, then the pin, then the breadcrumb. The pin keeps its size, glyph, label, disabled rules, and states; it loses only its rail-aligned column.

## ADDED Requirements

### Requirement: Sidebar is an accordion of Journal, Pages, Boards, and Assets sections
The sidebar SHALL contain exactly four collapsible sections — Journal, then Pages, then Boards, then Assets — with no other sections, controls, or buttons between them and no navigation control row above them, so Journal is the sidebar's first band. Every section's summary row SHALL be rendered in every app state — open or collapsed, and with or without a vault — and SHALL be all a collapsed section occupies. The Journal section SHALL size to its content and SHALL NOT scroll internally; the Pages, Boards, and Assets sections SHALL share the sidebar's remaining height, each body scrolling within itself, and the Pages body SHALL keep a minimum height so a short window cannot collapse it to nothing. The Boards section's listing and behavior are specified by the whiteboards capability, and the Assets section's by the vault-assets capability. All four sections SHALL support independent open/close (one section's state does not affect the others) and expand/collapse without page reloads or JavaScript manipulation of document state. Journal and Pages SHALL be open by default; Boards and Assets SHALL be collapsed by default. There SHALL be no Tags section, no New Page button, no History section, and no Back, Forward, or Today control in the sidebar.

#### Scenario: Sections open and close independently
- **WHEN** the user collapses the Pages section while Journal is open
- **THEN** Pages collapses and Journal remains open

#### Scenario: Journal leads the sidebar
- **WHEN** the shell renders
- **THEN** the sidebar's first band is the Journal section, followed by Pages, then Boards, then Assets, with no control row and no section between them

#### Scenario: Every section summary is always rendered
- **WHEN** the user collapses Boards and Assets
- **THEN** both summaries remain in the document in order, each occupying one row, with Journal above them

#### Scenario: A collapsed section leaves the others their height
- **WHEN** the user collapses the Assets section
- **THEN** the sections above it expand to use the space the Assets body gave up

#### Scenario: The sidebar holds no navigation controls
- **WHEN** the shell renders in any app state
- **THEN** the sidebar contains no Back, Forward, or Today control, and those controls appear only in the status bar

#### Scenario: The sidebar has no History section
- **WHEN** the shell renders
- **THEN** the sidebar holds no History section, and Back and Forward are the only presentation of the session trail

## MODIFIED Requirements

### Requirement: Journal section shows the journal calendar
When a vault folder is open, the Journal section body SHALL render a month calendar grid for the vault's journal days. The grid SHALL be Sunday-first with one cell per day, and days that have a journal file in the open vault's index SHALL be marked with a background fill. The first and last weeks' cells that fall outside the displayed month SHALL render dimmed but remain clickable as days. The grid SHALL initially display the month of the currently open day (or the current month when no day is open), SHALL provide previous/next month controls that move the displayed month without opening a day, and opening any day SHALL re-anchor the grid to that day's month. The control opening the current day's journal lives in the status bar, not in this section; opening the current day re-anchors the grid to that day's month like opening any other day. When no vault folder is open, the Journal section SHALL NOT render the calendar, keeping the section empty.

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
- **GIVEN** another page is open and the calendar displays a month other than the current one
- **WHEN** the user activates the Today control in the status bar
- **THEN** the editor pane opens the current day's journal, no file is created by the activation itself, and the grid displays the current day's month

#### Scenario: Today re-anchors the grid even when today is already open
- **GIVEN** the current day's journal is already open and the calendar has been browsed to another month
- **WHEN** the user activates the Today control
- **THEN** the grid displays the current day's month

#### Scenario: Month controls browse without opening a day
- **GIVEN** the calendar displays September 2026 with `journals/2026-09-06.md` open
- **WHEN** the user clicks the previous-month control
- **THEN** the grid displays August 2026, the editor pane keeps its open day, and clicking a day in the visited month opens that day and re-anchors the grid

#### Scenario: No calendar without a vault
- **WHEN** no vault folder is open
- **THEN** the Journal section shows no calendar grid

### Requirement: The shell shows an app-level status bar
The shell SHALL render a thin status bar as a full-width row below the workspace, present in every app state — with a vault open, while the index builds, on search-results surfaces, on an open board, and on the brand empty state. The bar SHALL lead with the Back, Forward, and Today controls in that order at its leading edge, followed by the pin control, then three groups: the open document's file path as a breadcrumb (left, immediately after the pin) — a page's, a journal day's, or a board's — a status group holding the save-state text and the indexing label, and the active vault's name and file count (right side). The Back and Forward controls SHALL be the trail controls specified by page-history, each disabled when there is no entry in its direction. Activating Today SHALL open the current day's journal — `journals/YYYY-MM-DD.md` for the current local date — exactly as selecting a calendar day does: the file's content when it exists, otherwise a blank in-memory page that materializes on first save and creates nothing on open. Today SHALL be rendered in every app state and SHALL be disabled while no vault is usable (no folder open, or the active folder's index still building), matching Back and Forward's treatment when they have nowhere to step; activating a disabled Today SHALL do nothing. Beside the vault's file count, at the bar's trailing edge, the bar SHALL show the running application version as `v<version>`, where `<version>` is the `version` field of `package.json`; the version SHALL be non-interactive text, SHALL render in every app state, and SHALL NOT be a control or gate any behavior. A group SHALL be empty when its content has no source: no page and no board open leaves the path group empty; a page or board with nothing to report leaves the status group empty; no active folder leaves the vault group empty. The bar SHALL sit outside all pane scroll regions — its content never scrolls, and the panes scroll independently beneath it — and SHALL use Kami tokens (stone 12px text, hairline top border, flat surfaces). The bar's display-only content SHALL perform no action: the breadcrumb, the status text, and the vault name open no picker, switch no folder, re-grant no permission, and navigate nowhere. The Back, Forward, and Today controls and the pin control are the bar's only controls.

#### Scenario: The bar frames every app state
- **GIVEN** the app on the brand empty state with no vault open
- **WHEN** the shell renders
- **THEN** the status bar is present with the three groups empty, the Back, Forward, and Today controls at its leading edge (Back, Forward, and Today disabled), and the pin control beside them

#### Scenario: The bar hosts the navigation controls
- **WHEN** the shell renders in any app state
- **THEN** Back, Forward, and Today appear at the bar's leading edge in that order, ahead of the pin control and the breadcrumb

#### Scenario: An open page fills the path group
- **WHEN** the user opens a page
- **THEN** the status bar's path group shows the page's file-path breadcrumb

#### Scenario: An open board fills the path group
- **WHEN** the user opens a board
- **THEN** the status bar's path group shows the board's file-path breadcrumb and the status group reflects the board's save state

#### Scenario: The indexing label shows in the bar
- **WHEN** the active folder's index is building
- **THEN** the status bar shows the "Indexing notes…" status in the center group

#### Scenario: The bar shows the running version beside the file count
- **WHEN** the shell renders, in any app state
- **THEN** the status bar shows `v<version>` at its trailing edge, beside the vault's name and file count, and the badge is not an interactive control

#### Scenario: The bar performs no actions
- **WHEN** the user activates the breadcrumb segments, the status text, or the vault name in the status bar
- **THEN** nothing happens: no navigation, no picker, no folder switch, no permission re-grant

#### Scenario: The bar stays put while panes scroll
- **WHEN** the user scrolls a pane beneath the status bar
- **THEN** the bar and its content remain fixed at the shell's bottom
