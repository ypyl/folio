## REMOVED Requirements

### Requirement: Journal section shows a placeholder, not a calendar
The Journal section body SHALL show placeholder copy stating that the calendar arrives in a later step. It SHALL NOT render a calendar grid, day marks, or date navigation.

**Reason**: Superseded by the journal calendar (PLAN task 10): the placeholder existed to be replaced once the real calendar landed.

**Migration**: The Journal section now renders the journal calendar instead of placeholder copy.

## ADDED Requirements

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