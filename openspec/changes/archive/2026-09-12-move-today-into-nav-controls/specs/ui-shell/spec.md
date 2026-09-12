## MODIFIED Requirements

### Requirement: Sidebar is an accordion of Journal and Pages sections with a navigation control row

The sidebar SHALL contain a navigation control row followed by exactly two collapsible sections — Journal, then Pages — with no other sections, controls, or buttons between or below them. The control row SHALL hold the Back and Forward controls specified by page-history and a Today control, SHALL precede both sections, and SHALL stay in place while the sidebar scrolls, so those controls remain reachable however long the page list grows. Activating Today SHALL open the current day's journal — `journals/YYYY-MM-DD.md` for the current local date — exactly as selecting a calendar day does: the file's content when it exists, otherwise a blank in-memory page that materializes on first save and creates nothing on open. Today SHALL be rendered in every app state, and SHALL be disabled while no vault is usable (no folder open, or the active folder's index still building), matching Back and Forward's treatment when they have nowhere to step. Today SHALL NOT be tied to the Journal section's open/closed state: collapsing Journal SHALL leave the control in the row. Both sections SHALL support independent open/close (one section's state does not affect the other), open by default, and expand/collapse without page reloads or JavaScript manipulation of document state. There SHALL be no Tags section, no New Page button, and no History section.

#### Scenario: Sections open and close independently

- **WHEN** the user collapses the Pages section while Journal is open
- **THEN** Pages collapses and Journal remains open

#### Scenario: The Journal section leads the sections

- **WHEN** the shell renders
- **THEN** the sidebar's sections are Journal, then Pages, with no section or control between them, and the navigation control row is the only element above Journal

#### Scenario: The controls stay in reach while the sidebar scrolls

- **GIVEN** a vault whose page list is long enough to make the sidebar scroll
- **WHEN** the user scrolls the sidebar to the end of the list
- **THEN** the Back, Forward, and Today controls remain visible at the sidebar's top

#### Scenario: Today is unavailable without a usable vault

- **WHEN** no folder is open, or the active folder's index is still building
- **THEN** the Today control is rendered but disabled, and activating it does nothing

#### Scenario: Today survives collapsing the Journal section

- **WHEN** the user collapses the Journal section
- **THEN** the Today control stays in the navigation control row and still opens the current day's journal

#### Scenario: The sidebar has no History section

- **WHEN** the shell renders
- **THEN** the sidebar holds no History section, and Back and Forward are the only presentation of the session trail

### Requirement: Journal section shows the journal calendar
When a vault folder is open, the Journal section body SHALL render a month calendar grid for the vault's journal days. The grid SHALL be Sunday-first with one cell per day, and days that have a journal file in the open vault's index SHALL be marked with a background fill. The first and last weeks' cells that fall outside the displayed month SHALL render dimmed but remain clickable as days. The grid SHALL initially display the month of the currently open day (or the current month when no day is open), SHALL provide previous/next month controls that move the displayed month without opening a day, and opening any day SHALL re-anchor the grid to that day's month. The control opening the current day's journal lives in the sidebar's navigation control row, not in this section; opening the current day re-anchors the grid to that day's month like opening any other day. When no vault folder is open, the Journal section SHALL NOT render the calendar, keeping the section empty.

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
- **WHEN** the user activates the Today control in the sidebar's navigation control row
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
