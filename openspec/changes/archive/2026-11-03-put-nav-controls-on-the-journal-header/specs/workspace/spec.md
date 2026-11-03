# Spec Delta

## REMOVED Requirements

### Requirement: The sidebar is an accordion of Journal and Files with a navigation row
**Reason**: The navigation row is no longer a band of its own: the three controls
ride the Journal section's summary row.
**Migration**: Replaced by "The sidebar is an accordion of Journal and Files" and
"The Journal summary holds the session navigation". Both sections, their
ordering, their defaults, and their height rules are unchanged.

### Requirement: The sidebar's navigation row holds the session navigation
**Reason**: The row it named is gone; the same three controls now sit on the
Journal section's summary row.
**Migration**: Replaced by "The Journal summary holds the session navigation".
The controls keep their names, order, availability rules, Today behavior, and
keyboard chords.

## ADDED Requirements

### Requirement: The sidebar is an accordion of Journal and Files
The sidebar SHALL hold exactly two collapsible sections, Journal then Files, with
no other sections, bands, or controls between or around them, so Journal is the
first row. Both SHALL be open by default and SHALL open and close independently,
and every summary SHALL render in every state. The Journal section SHALL size to
its content and not scroll internally; the Files section SHALL take the remaining
height, scrolling within itself and keeping a minimum height. When Journal is
collapsed, Files SHALL take the space it gave up. There SHALL be no tags section,
no New Page button, and no History section.

#### Scenario: Sections open and close independently

- **WHEN** the user collapses Files while Journal is open
- **THEN** Files collapses and Journal stays open

#### Scenario: Every summary is always rendered

- **WHEN** the user collapses Files
- **THEN** both summaries remain in order, each one row

#### Scenario: Journal leads the sidebar

- **WHEN** the shell renders with a folder open
- **THEN** the Journal section is the sidebar's first row and Files follows it

### Requirement: The Journal summary holds the session navigation
The Journal section's summary row SHALL hold the Back and Forward controls
specified by the history capability and a Today control, in that order, at its
trailing edge ahead of the section's disclosure marker, and those three controls
SHALL appear nowhere else in the sidebar. A control in the summary SHALL act as
that control alone: activating it SHALL NOT open or close the section. Back and
Forward SHALL each be disabled when there is nowhere to step on the session
trail. Today SHALL open the current day's journal exactly as choosing a calendar
day does — the file's content when it exists, otherwise a blank in-memory page
that is created on first save and creates nothing on open — and SHALL be disabled
while no folder is usable, activating nothing while disabled. Each control SHALL
name its action. The summary SHALL stay one row tall whether the section is open
or collapsed.

#### Scenario: The summary's controls are in order

- **WHEN** the sidebar renders
- **THEN** Back, Forward, and Today appear in that order on the Journal
  section's summary row, before its disclosure marker

#### Scenario: A control does not toggle its section

- **GIVEN** the Journal section is open
- **WHEN** the user activates Back, Forward, or Today
- **THEN** the section stays open and only that control's action runs

#### Scenario: The controls survive a collapsed Journal

- **WHEN** the user collapses the Journal section
- **THEN** Back, Forward, and Today stay on its summary row, and Files takes the
  height the calendar gave up

#### Scenario: The row reports when there is nowhere to go

- **GIVEN** the session trail holds only the open entry
- **WHEN** the shell renders
- **THEN** Back and Forward are disabled and Today is enabled

#### Scenario: Today opens the current day's journal

- **GIVEN** a folder is open and another page is open
- **WHEN** the user activates Today
- **THEN** the current day's journal opens and nothing is written to the folder

#### Scenario: Today is disabled without a usable folder

- **GIVEN** no folder is open, or the active folder's index is still building
- **WHEN** the shell renders
- **THEN** Today is rendered and disabled, and activating it does nothing

## MODIFIED Requirements

### Requirement: The Journal section shows the journal calendar

When a folder is open, the Journal section SHALL render a month calendar for the
folder's journal days: Sunday-first, one cell per day, with days that have a
note filled in. Cells outside the shown month SHALL be dimmed but clickable as
days. The grid SHALL show the month of the open day, or the current month when
no day is open; previous and next controls SHALL move the shown month without
opening a day; and opening any day SHALL re-anchor the grid to that day's month.
The control that opens the current day's journal lives on this section's
summary row, and it SHALL re-anchor the grid to the
current month even when the current day is already open. With no folder open,
the section SHALL show no calendar.

#### Scenario: Journal days are marked

- **GIVEN** an open folder holding a note for a day
- **WHEN** the Journal section shows that day's month
- **THEN** that day's cell is filled and empty days are not

#### Scenario: Out-of-month days are dimmed but clickable

- **WHEN** the calendar shows a month with leading and trailing days outside it
- **THEN** those cells are dimmed and behave as clickable days

#### Scenario: The grid follows the open day

- **GIVEN** a journal day is open
- **WHEN** the Journal section renders
- **THEN** the grid shows that day's month

#### Scenario: Month controls browse without opening a day

- **WHEN** the user activates a previous- or next-month control
- **THEN** the grid shows the visited month and the editor keeps its open day

#### Scenario: Today re-anchors the calendar

- **GIVEN** the current day's journal is open and the calendar shows another month
- **WHEN** the user activates Today on the Journal section's summary row
- **THEN** the grid shows the current day's month

#### Scenario: No calendar without a folder

- **WHEN** no folder is open
- **THEN** the Journal section shows no calendar

### Requirement: The status bar spans the workspace

The shell SHALL render a thin status bar as a full-width row beneath the
workspace, present in every state — with a folder open, while it loads, on
search results, on an open board, and on the no-folder state. It SHALL show a
status group holding the save-state text and the loading label. At viewports
wider than the compact breakpoint it SHALL also show the open item's file path as
a breadcrumb and, at its trailing edge, the active folder's name and how many
notes it holds, with the running version beside them as non-interactive text. At
or below the compact breakpoint it SHALL show the open item's name instead of the
path, and SHALL show neither the folder's name, nor its note count, nor the
version. A group SHALL be empty when it has no source, and the bar SHALL sit
outside the panes' scroll regions, so its content never scrolls. The bar's
display-only content SHALL perform no action; its only controls SHALL be the open
page's name where it has a Files row, and — at or below the compact breakpoint —
the navigation and meta view controls the compact shell adds. The bar SHALL NOT
hold a Back, Forward, or Today control: those live on the Journal section's
summary row. At or below the compact breakpoint each view control SHALL show, by the
shape it draws rather than by colour alone, whether its view is the one shown:
the pane inside its frame SHALL be filled while that control's view is open and
empty while it is closed, and the open control SHALL additionally carry the
app's recede tint as its background.

#### Scenario: The bar is present in every state

- **GIVEN** the app on the no-folder state
- **WHEN** the shell renders
- **THEN** the status bar is present with its groups empty and no navigation
  control in it

#### Scenario: An open page fills the path group

- **WHEN** the user opens a page
- **THEN** the bar shows the page's file path as a breadcrumb

#### Scenario: The loading label shows in the bar

- **WHEN** the active folder is loading
- **THEN** the bar shows the loading label

#### Scenario: The bar shows the running version

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the shell renders in any state
- **THEN** it shows the version beside the folder's name and its note count, as
  non-interactive text

#### Scenario: The note count is the same before and after the index lands

- **GIVEN** a folder that holds notes, and an index that is still building
- **WHEN** the bar first renders and again once the index lands
- **THEN** the count beside the folder's name is the same number both times

#### Scenario: The note count leaves out what the folder holds besides notes

- **GIVEN** a folder holding notes, an image asset, a board, and its `.folio`
  state
- **WHEN** the bar renders its folder group
- **THEN** the count is the number of notes alone

#### Scenario: The compact bar drops the folder statistics

- **GIVEN** a viewport at or below the compact breakpoint and a page open
- **WHEN** the shell renders
- **THEN** the bar shows the page's name and shows neither the folder's name,
  nor its note count, nor the version, and it is not a scrolling row

#### Scenario: The bar carries no session navigation

- **WHEN** the shell renders in any state
- **THEN** the status bar holds no Back, Forward, or Today control, and those
  controls appear on the Journal section's summary row

#### Scenario: The bar stays put while panes scroll

- **WHEN** the user scrolls a pane beneath the status bar
- **THEN** the bar remains fixed at the shell's bottom

#### Scenario: The bar performs no actions

- **WHEN** the user activates the breadcrumb's directory segments, the status
  text, or the folder name
- **THEN** nothing happens

#### Scenario: The compact bar carries the two view controls

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** the status bar carries a navigation view control at its leading edge
  and a meta view control at its trailing edge

#### Scenario: A view control draws its view's state

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** a view control's view is the one shown
- **THEN** that control draws its pane filled and carries the recede tint as its
  background, and the other control draws its pane empty with no background

#### Scenario: A view control exposes whether its view is shown

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** each view control reports whether its view is the one shown, and the
  state it draws agrees with what it reports

### Requirement: Compact controls are touch-sized and clear the device's safe areas

At or below the compact breakpoint, every control in the status bar and every
control of the Journal summary's session navigation SHALL have a target of at
least 44 by 44 CSS pixels. The status bar SHALL pad itself with the device's safe-area insets,
so no control sits under a notch, a rounded corner, or the home indicator, and
the shell SHALL size itself to the viewport height that remains visible, so the
on-screen keyboard shrinks the shell rather than covering the bottom of the
editor.

#### Scenario: The app bar's controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** every control in the status bar is at least 44 by 44 CSS pixels

#### Scenario: The navigation row's controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and the navigation view shown
- **WHEN** the sidebar renders
- **THEN** Back, Forward, and Today are each at least 44 by 44 CSS pixels

#### Scenario: The bar clears the safe areas

- **GIVEN** a device whose screen has a safe-area inset at the bottom
- **WHEN** the shell renders
- **THEN** the status bar's controls sit inside the inset and none is clipped

#### Scenario: The keyboard shrinks the shell

- **GIVEN** the editor view is shown and the on-screen keyboard opens
- **WHEN** the shell re-renders
- **THEN** the shell's height is the visible height, the status bar stays
  visible, and the caret's line is not covered by the keyboard

### Requirement: An app tour explains the shell's regions

The workspace SHALL offer an app tour, opened by activating the folder rail's
tour control or the brand screen's tour reference. The tour SHALL be a modal
overlay with an accessible name, and while it is open it SHALL contain focus and
require dismissal. It SHALL present an ordered sequence of steps, each naming
one region of the shell — the folder rail, the sidebar, the editor area, the
right panel, and the status bar — and explaining what that region holds. The
step naming the sidebar SHALL name the session navigation its Journal row holds
— Back, Forward, and Today — as well as the calendar and the listing. The step naming the editor
area SHALL also name the reference forms the page surface accepts — `#word` and
`#[[Page]]` for a page, and `#!word` and `#![[Board]]` for a board — so the tour
teaches linking as well as the pane, and SHALL name the guided demo vault as the
place where every feature can be tried. Each step SHALL highlight the region it
names, and a step whose region is not on screen SHALL still show its explanation
rather than fail. Every step except the first SHALL offer a way back to the
previous step, every step except the last a way forward, and the tour SHALL offer
a way to end it at any step, including by Escape. Opening the tour SHALL move
focus into it, and ending it SHALL return focus to the control that opened it.
The tour SHALL be presentational only: it SHALL change no page's content, write
nothing to the vault, and store nothing, and it SHALL NOT launch on its own. The
tour SHALL be available only at viewports wider than the compact breakpoint,
where its entry points exist; it SHALL add no work to the editing or typing path.

#### Scenario: The rail's tour control opens the tour

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the user activates the rail's tour control
- **THEN** the tour opens at its first step, naming the folder rail and
  highlighting it

#### Scenario: The brand screen's tour reference opens the tour

- **GIVEN** a viewport wider than the compact breakpoint and no folder open
- **WHEN** the user activates the brand screen's tour reference
- **THEN** the tour opens at its first step, naming the folder rail and
  highlighting it

#### Scenario: Steps move forward and back

- **GIVEN** the tour is open at its first step
- **WHEN** the user moves forward
- **THEN** the next step names and highlights its region, and moving back
  returns to the first step

#### Scenario: The sidebar step names the navigation row

- **WHEN** the user reaches the step naming the sidebar
- **THEN** its explanation names Back, Forward, and Today

#### Scenario: The editor step names the reference forms

- **WHEN** the user reaches the step naming the editor area
- **THEN** its explanation names the forms that reference a page and a board

#### Scenario: The editor step points at the guided demo

- **WHEN** the user reaches the step naming the editor area
- **THEN** its explanation names the guided demo vault as the place to try every
  feature

#### Scenario: Skipping ends the tour

- **GIVEN** the tour is open at any step
- **WHEN** the user ends it with the skip or close control
- **THEN** the tour closes

#### Scenario: Escape ends the tour

- **GIVEN** the tour is open
- **WHEN** the user presses Escape
- **THEN** the tour closes

#### Scenario: Focus enters and returns

- **GIVEN** the tour is closed and focus is on the rail's tour control
- **WHEN** the user opens the tour and then ends it
- **THEN** focus moves into the tour while it is open and returns to the tour
  control when it closes

#### Scenario: Focus is contained while the tour is open

- **GIVEN** the tour is open
- **WHEN** the user moves focus with the keyboard
- **THEN** focus stays within the tour

#### Scenario: The tour disturbs nothing

- **GIVEN** a page is open with unsaved edits and the search spotlight is closed
- **WHEN** the user opens the tour, moves through its steps, and ends it
- **THEN** the open page and its content are unchanged, the spotlight stays
  closed, and nothing is written to the vault

#### Scenario: The tour is never shown on its own

- **GIVEN** the app is opened and reloaded
- **WHEN** the user takes no action
- **THEN** the tour is not shown

#### Scenario: A step whose region is off screen still explains it

- **GIVEN** the tour is open on a step whose region is not currently rendered
- **WHEN** the step shows
- **THEN** its explanation is shown without a highlighted region

#### Scenario: The tour adds no editing work

- **GIVEN** a page is open
- **WHEN** the user types in the editor with the tour closed
- **THEN** the tour performs no work on the typing path

