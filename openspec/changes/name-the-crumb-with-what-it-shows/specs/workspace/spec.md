# Spec Delta

## MODIFIED Requirements

### Requirement: The status bar's file name locates the open item in the navigation

When the open item is a page or a journal day, the status bar's file-name crumb
SHALL be a control. Activating a page's crumb SHALL show the left navigation —
unfolding it where the three-pane shell folds it, and showing the navigation view
where the compact shell shows one view at a time — open the Files section if
collapsed, scroll the page's row into view, and move keyboard focus to that row.
For a page that has no file yet, and so no row, activating it SHALL first create
the page with its current content — the same write its first save would make —
and then reveal the new row. Activating a journal day's crumb SHALL show the left
navigation the same way, open the Journal section if collapsed, move the calendar
to the day's month, scroll that day's cell into view, and move keyboard focus to
the cell. Locating a journal day SHALL NOT open a day, navigate, or write to the
vault. Each control SHALL be named with the text it displays, the action it
performs, and the surface it locates, so that what is written on the crumb is
what a person says to activate it; it SHALL be reachable and activatable by
keyboard and show visible focus. Apart
from what locating itself changes, activating a crumb SHALL change nothing else:
it SHALL NOT navigate, change the open page or its content, change the listing's
order or any other section's state, or write to the vault. For a board, an asset,
or nothing open, the file-name crumb SHALL stay non-interactive text, and
directory crumbs SHALL always stay non-interactive.

#### Scenario: Activating the page name reveals its row

- **GIVEN** a long Files listing with the open page's row outside the visible part
- **WHEN** the user activates the status bar's page name
- **THEN** the row is scrolled into view and keyboard focus is on it

#### Scenario: Revealing unfolds a folded left navigation

- **GIVEN** the left navigation is folded and the open page has a Files row
- **WHEN** the user activates the page name
- **THEN** the left navigation unfolds and the row is visible and focused

#### Scenario: Revealing on the compact shell shows the navigation view

- **GIVEN** a viewport at or below the compact breakpoint, the editor view is
  shown, and the open page has a Files row
- **WHEN** the user activates the status bar's page name
- **THEN** the navigation view is shown with the row in view and keyboard focus
  on it

#### Scenario: Revealing opens a collapsed Files section

- **GIVEN** the Files section is collapsed and the open page has a row
- **WHEN** the user activates the page name
- **THEN** the Files section opens with the row in view and focused

#### Scenario: Revealing changes nothing else

- **GIVEN** a page that already has a file is open with unsaved edits
- **WHEN** the user activates the page name
- **THEN** the open page and its content are unchanged and nothing is written

#### Scenario: A page with no file is created so it can be revealed

- **GIVEN** a blank page opened from a reference, with no file yet and no Files
  row
- **WHEN** the user activates the status bar's page name
- **THEN** the page's file is created with the page's content, its row appears in
  the Files listing, and that row is scrolled into view and focused

#### Scenario: The created page is an ordinary page afterwards

- **GIVEN** a page that was created by revealing it
- **WHEN** the user looks at the Files listing and searches
- **THEN** the page has one row, the search finds it, and following a reference to
  it opens the same page

#### Scenario: Revealing a page with no file keeps its content

- **GIVEN** a page with no file whose editor holds text that has not been saved
- **WHEN** the user activates the status bar's page name
- **THEN** the created file holds that text and the editor is unchanged

#### Scenario: Activating a journal day's name locates its cell

- **GIVEN** a journal day is open and the calendar shows another month
- **WHEN** the user activates the status bar's file-name crumb
- **THEN** the calendar shows the open day's month and that day's cell has
  keyboard focus

#### Scenario: Locating a journal day opens a collapsed Journal section

- **GIVEN** a journal day is open and the Journal section is collapsed
- **WHEN** the user activates the status bar's file-name crumb
- **THEN** the Journal section opens with the day's cell in view and focused

#### Scenario: Locating a journal day unfolds a folded left navigation

- **GIVEN** the left navigation is folded and a journal day is open
- **WHEN** the user activates the status bar's file-name crumb
- **THEN** the left navigation unfolds and the day's cell is visible and focused

#### Scenario: Locating a journal day on the compact shell shows the navigation view

- **GIVEN** a viewport at or below the compact breakpoint, the editor view is
  shown, and a journal day is open
- **WHEN** the user activates the status bar's file-name crumb
- **THEN** the navigation view is shown with the day's cell in view and keyboard
  focus on it

#### Scenario: Locating a journal day changes nothing else

- **GIVEN** a journal day is open with unsaved edits and the calendar on another
  month
- **WHEN** the user activates the status bar's file-name crumb
- **THEN** the open day, its content, and its place in the trail are unchanged,
  nothing is written to the vault, and no other day is opened

#### Scenario: A crumb is named with the text it shows

- **GIVEN** a page is open, and separately a journal day is open
- **WHEN** the user reads the status bar's file-name crumb with a screen reader,
  or names it by voice
- **THEN** its accessible name contains the text the crumb displays and names the
  surface activating it locates

#### Scenario: A board's or an asset's crumb is not a control

- **GIVEN** a board or an asset is open
- **WHEN** the user activates the status bar's file-name crumb
- **THEN** nothing happens
