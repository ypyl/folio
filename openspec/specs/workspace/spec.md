# The workspace

## Purpose

The application shell: the three-pane workspace that hosts every Folio feature —
the folder rail, the sidebar, the editor area, and the right panel — with the
status bar beneath it and the no-folder state shown before a vault is opened.

## Requirements

### Requirement: The workspace is a foldable three-pane shell

At viewports wider than the compact breakpoint, Folio SHALL render a full-height
workspace: a leading folder rail, a left sidebar, a flexible editor pane, and a
right panel, with a full-height collapse strip at each outer edge and the status
bar as a full-width row beneath. The folder rail and the left sidebar SHALL fold
together as one left-navigation unit; the right panel SHALL fold on its own; a
folded unit SHALL take no width and leave its strip in place. Each strip SHALL be
a button spanning the workspace's full height, with an arrow pointing to its
unit's outer edge while expanded and toward the editor while folded, an
accessible name naming the unit it folds, and its expanded or folded state
exposed. Both sides SHALL start expanded, and the folded state SHALL last only
for the session, resetting on reload and never being written anywhere. The shell
SHALL NOT scroll, and no pane SHALL scroll the page: a pane whose content
exceeds its height SHALL scroll within itself, inside whichever section holds
it. At or below the compact breakpoint the composition is the compact shell
instead. There SHALL be no header band above the panes in either composition.

#### Scenario: The shell fills the viewport

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the app loads
- **THEN** the shell spans the full viewport height, the panes start at its top
  edge with no band above them, and each strip spans the workspace height

#### Scenario: Long content scrolls within panes, not the page

- **WHEN** content in a pane exceeds that pane's height
- **THEN** it scrolls inside the section that holds it and the shell stays fixed

#### Scenario: Folding the left navigation gives the width to the editor

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the user activates the left strip
- **THEN** the rail and sidebar take no width, the editor takes both, and the
  strip remains with its arrow pointing toward the editor

#### Scenario: The two sides fold independently

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the user folds the left navigation while the right panel is expanded
- **THEN** the left folds and the right stays expanded

#### Scenario: A folded side leaves the tab order

- **GIVEN** a viewport wider than the compact breakpoint and the left navigation
  is folded
- **WHEN** the user moves focus with the keyboard
- **THEN** no control inside the rail or sidebar receives focus

#### Scenario: Folding changes nothing but the layout

- **GIVEN** a viewport wider than the compact breakpoint, a page is open with
  unsaved edits, and the search spotlight is closed
- **WHEN** the user folds a side
- **THEN** the open page, its content, and the spotlight's state are unchanged

#### Scenario: The folded state resets on reload

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the app is reloaded after a fold
- **THEN** both sides are expanded again and nothing stored the previous state

### Requirement: The workspace uses the app's design language

All surfaces, borders, spacing, and text SHALL use the app's own design
language: warm parchment surfaces, one chromatic accent, warm grays, a single
spacing base, and consistent radii. Pure white, cool grays, and any second
chromatic colour SHALL NOT appear as surfaces, and surfaces SHALL be flat, with
hairline borders and no shadows or gradients. Every interactive element SHALL
show a visible focus indicator in the app's accent when focused by keyboard.

#### Scenario: Surfaces are flat and on-palette

- **WHEN** the shell renders
- **THEN** panes and sections have no shadows or gradients, borders are
  hairlines, and no banned colour appears as a surface

#### Scenario: Focus is visible

- **WHEN** the user tabs through the shell's interactive elements
- **THEN** each focused element shows a visible brand-coloured outline

### Requirement: A folder entry can be closed

Every rail entry SHALL carry a close control that removes the entry and forgets
the folder, distinct from the entry's switch action, so activating it SHALL NOT
switch folders. Closing a non-active entry SHALL leave the active folder and the
workspace unchanged; closing the active entry SHALL return to the no-folder
state while the other entries remain listed. Closing a folder SHALL NOT change
anything inside it.

#### Scenario: A close control closes without switching

- **GIVEN** two folders listed with the first active
- **WHEN** the user activates the second entry's close control
- **THEN** the second entry is gone, the first stays active, and the open page is
  unchanged

#### Scenario: Closing the active entry returns to the no-folder state

- **WHEN** the user closes the active entry
- **THEN** no folder is active, the no-folder state shows, and any other entries
  stay listed

#### Scenario: Closing does not touch the folder on disk

- **WHEN** the user closes a folder
- **THEN** the app forgets only its reference and every file remains unchanged

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

### Requirement: The right panel is an accordion of page metadata

The right panel SHALL hold the page sections Contents and Links, followed by the
shortcuts reference as the last section. Contents SHALL be open by default and
Links SHALL be collapsed by default; each SHALL open and close independently. While no page and no board is
open, each SHALL show placeholder copy; while a board is open, the panel SHALL
show the board's Referenced by section instead of the page sections. The Links
section SHALL take the remaining height, scrolling within itself and keeping a
minimum height; Contents SHALL size to its content up to a maximum, except that
when Links is collapsed Contents SHALL take the space it gave up. A collapsed
section SHALL sit at the panel's bottom.

When a page is open, each section SHALL list its rows. Contents SHALL list the
page's headings as an indented tree with a disclosure control on every heading
that has a subtree. Links SHALL list, in one list, the pages that reference the
open page, most recently edited first, then the pages the open page references in
document order, then the files it points at in their order, then the boards it
references in theirs. Every row SHALL carry a badge before its label: `in` for a
backlink, `out` for a forwardlink, `a` for a file, `b` for a board. A section
with no rows SHALL show empty-state copy. Page rows that name a page with no file
SHALL be dimmed but stay clickable; file rows SHALL NOT be dimmed.

#### Scenario: Meta sections are independently collapsible

- **WHEN** the user collapses Links while Contents is open
- **THEN** Links collapses and Contents stays open

#### Scenario: Backlinks list the referrers

- **GIVEN** an open page referenced by two pages, one edited more recently
- **WHEN** the user looks at Links
- **THEN** it lists both, most recently edited first, each badged `in`

#### Scenario: Forwardlinks list the targets in reference order

- **GIVEN** an open page referencing several pages
- **WHEN** the user looks at Links
- **THEN** it lists them in the order the references appear, each badged `out`

#### Scenario: Files follow the page references

- **GIVEN** an open page that references pages and links a file
- **WHEN** the user looks at Links
- **THEN** the page rows come first, then the file row, each with its badge

#### Scenario: Empty sections show copy

- **GIVEN** an open page that nothing references and that references nothing
- **WHEN** the user looks at Links
- **THEN** it shows empty-state copy and no rows

#### Scenario: A page with no file is dimmed but clickable

- **GIVEN** an open page referencing a page with no file
- **WHEN** the user looks at Links
- **THEN** the row is dimmed, still clickable, and still opens the page

#### Scenario: A long section scrolls inside itself

- **GIVEN** an open page with more rows than the panel can show
- **WHEN** the user scrolls the section
- **THEN** only that section's body scrolls and the panel itself does not

#### Scenario: A collapsed section is one row

- **WHEN** the user collapses Links
- **THEN** it occupies exactly its summary row, sitting at the panel's bottom,
  and Contents takes the height it gave up

#### Scenario: A journal day shows its reminders

- **GIVEN** an open journal day that matches a reminder rule
- **WHEN** the user looks at the open day
- **THEN** the day's note holds the reminder's reference line and the right panel
  holds no Reminders section

#### Scenario: A page that is not a journal day has no Reminders section

- **GIVEN** an open page that is not a journal day
- **WHEN** the user looks at the right panel
- **THEN** the panel holds Contents and Links but no Reminders section

#### Scenario: A board shows Referenced by, not Reminders

- **GIVEN** an open board
- **WHEN** the user looks at the right panel
- **THEN** the panel shows the board's Referenced by section and no Reminders
  section

#### Scenario: Links starts collapsed

- **GIVEN** a page has just been opened and Links has not been touched
- **WHEN** the user looks at the right panel
- **THEN** Contents is open, Links shows only its summary row, and the keyboard
  reference is collapsed

### Requirement: The right panel's last section lists the shortcuts the app binds

The right panel SHALL hold the keyboard-shortcuts reference as its last
collapsible section, collapsed by default and labelled "Keyboard shortcuts". Its
summary SHALL sit at the panel's bottom edge whether collapsed or open. Opening
it SHALL expand the reference upward from that edge and SHALL NOT introduce a
scrolling area or height cap of its own. It SHALL list only the shortcuts the
app actually binds — undo and redo in the editor, the chord that opens a
reference at the caret, the two history-trail chords on one shared row, and the
app's search shortcuts — and SHALL list no formatting or table chord, because
the page surface is edited as Markdown so no such action exists. Each row SHALL show a
readable label with its keys as key tokens. The section SHALL be present and
openable in every state, and opening it SHALL move no focus, trap no focus, and
require no dismissal. The panel SHALL carry an accessible name describing the
whole panel.

#### Scenario: The panel ends with the reference

- **WHEN** the shell renders with a folder open
- **THEN** the panel's sections are Contents, Links, then the collapsed
  "Keyboard shortcuts" row, and nothing follows it

#### Scenario: The collapsed reference sits at the panel's bottom

- **WHEN** the reference is collapsed
- **THEN** its row sits at the panel's bottom edge

#### Scenario: The open reference grows upward

- **WHEN** the user opens the reference while its row sits at the panel's bottom
- **THEN** the list expands upward from that edge and is the only part that grows

#### Scenario: The reference is reachable in every state

- **GIVEN** the app with no folder open
- **WHEN** the shell renders
- **THEN** the keyboard-shortcuts section is present and opens

#### Scenario: Opening the reference disturbs nothing

- **GIVEN** a page is open
- **WHEN** the user opens the reference
- **THEN** the open page and the spotlight are unchanged and focus stays where it
  was

#### Scenario: No formatting or table chord is listed

- **WHEN** the user reads the reference
- **THEN** no row names a formatting or table action

#### Scenario: The history chords are listed

- **WHEN** the user reads the reference
- **THEN** it lists one row labelled "Back / Forward" carrying both history
  chords, rather than a row for each

### Requirement: A shortcut row applies its key combination when activated

Every entry in the shortcuts reference SHALL be a control that applies its own
combination when activated, so a row listing more than one combination offers
one control per combination. Activating an editor row SHALL produce the same
result as pressing that combination in the editor; activating a search row SHALL
open the search spotlight, focused and selected; activating a history chord
SHALL step the trail in that chord's direction, exactly as the corresponding
Back or Forward control does. A control SHALL be named for both its own action
and its keys, so the two controls of a shared row keep distinct names. A control
SHALL be disabled when the surface it acts on is unavailable — controls acting
on the editor while no editor is open, the search controls while no folder is
open or the open folder is still loading, and each history chord while the trail
has nowhere to step in its direction — so one chord of a shared row can disable
while the other stays live; the reference SHALL remain listed in every state
whether or not a control is disabled. Activating a control SHALL leave focus
where the user can continue, and a combination the current context does not
claim SHALL leave the document unchanged.

#### Scenario: Each key combination is its own control

- **WHEN** the user opens the reference
- **THEN** a row listing two combinations offers two controls, each applying its
  own

#### Scenario: Unavailable rows are disabled but listed

- **GIVEN** no editor is open, or no folder is open
- **WHEN** the user opens the reference
- **THEN** the rows for the unavailable surface are dimmed and do nothing, while
  every row remains listed

#### Scenario: Activating a search row opens the spotlight

- **GIVEN** a folder is open and loaded
- **WHEN** the user activates the search row's control
- **THEN** the spotlight opens with focus in its input

#### Scenario: Activating a history row steps the trail

- **GIVEN** the user has opened Alpha and then Beta
- **WHEN** the user activates the shared row's Back control
- **THEN** Alpha opens and the row's Forward control becomes live

#### Scenario: A history row with nowhere to step is disabled

- **GIVEN** the user has opened Alpha and then Beta and stepped Back to Alpha
- **WHEN** the user opens the reference
- **THEN** the shared row's Back control is dimmed while its Forward control is
  live

#### Scenario: Focus returns to the editor

- **GIVEN** a page is open with the caret in it
- **WHEN** the user activates an editor row's control
- **THEN** the combination is applied and focus is in the editor

#### Scenario: A combination the context does not claim changes nothing

- **GIVEN** a page is open with the caret in an ordinary paragraph
- **WHEN** the user activates a row the context does not claim
- **THEN** the document is unchanged and no error is shown

### Requirement: The status bar's file name locates the open item in the navigation

When the open item is a page or a journal day, the status bar's file-name crumb
SHALL be a control, and at or below the compact breakpoint the app bar's title
SHALL be that control. Activating a page's crumb SHALL show the left navigation —
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
- **WHEN** the user activates the app bar's title
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
- **WHEN** the user activates the app bar's title
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

### Requirement: Panes show loading placeholders while the active folder loads

While the active folder is loading — when it is first opened, when the user
switches to another folder, and when a stored folder's permission is re-granted
— the panes whose content comes from the folder SHALL show loading placeholders
instead of empty content: the editor pane placeholder lines, the sidebar
placeholder blocks in place of the calendar and listing, and the right panel
placeholder rows in place of its placeholder copy. The loading state SHALL be
announced to assistive technology as an in-progress status labelled for
indexing notes, and the placeholder blocks SHALL themselves be decorative. The
loading state SHALL end when the folder resolves, at which point the panes show
its real content: the today journal opens, the sidebar lists the folder's
content, and search enables. With no folder active, the shell SHALL show the
no-folder state, never loading placeholders.

#### Scenario: Opening a folder shows loading placeholders

- **WHEN** a folder is opened
- **THEN** the editor pane, sidebar, and right panel show loading placeholders
  until the folder resolves

#### Scenario: Loading ends with real content

- **WHEN** the active folder resolves
- **THEN** the placeholders are gone, the editor opens the today journal, the
  sidebar lists the folder's content, and search is enabled

#### Scenario: No placeholders while no folder is active

- **WHEN** no folder is active
- **THEN** the shell shows the no-folder state and no loading placeholders

#### Scenario: Loading placeholders are announced, not read as content

- **WHEN** the active folder is loading
- **THEN** the status announces the indexing status and the placeholders are not
  exposed as content

### Requirement: Compact controls are touch-sized and clear the device's safe areas

At or below the compact breakpoint, every control the shell shows SHALL have a
target of at least 48 by 48 CSS pixels, and the shell's text SHALL follow the
compact scale: 18px body text, 17px list text, 15px secondary text, 16px
calendar days, 13px section labels, status text, and nav labels, and no text
below 12px. A navigation view's row SHALL keep at least 16 CSS pixels from the
shell's trailing edge, and a Files row SHALL be 56 CSS pixels tall. The rule
covers the compact navigation bar's destinations, the app bar's title, actions,
and status line, the Journal row's controls, the folder rail's controls and a
folder entry's close control, the accordion summaries, the calendar's month
controls and day cells, the Files listing's rows, the right panel's rows and its
Contents disclosure and expand/collapse controls, the brand screen's actions,
the search spotlight's controls and rows, the menus' items, and the presentation
view's controls. A target MAY be larger than the mark it draws; where a control's
drawn mark is smaller than the minimum, an invisible hit area SHALL make up the
difference. The calendar's seven-column grid is the one exception to the width:
its cells SHALL be 48 tall and as wide as the pane's column share, which SHALL
be at least 44. The compact navigation bar and the app bar SHALL pad themselves
with the device's safe-area insets, so no control sits under a notch, a rounded
corner, or the home indicator, and the shell SHALL size itself to the viewport
height that remains visible, so the on-screen keyboard shrinks the shell rather
than covering the bottom of the editor.

#### Scenario: The app bar's controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** every destination in the navigation bar is at least 48 by 48 CSS
  pixels

#### Scenario: The navigation row's controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and the navigation view shown
- **WHEN** the sidebar renders
- **THEN** Back, Forward, and Today are each at least 48 by 48 CSS pixels

#### Scenario: The rail's controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and a folder listed
- **WHEN** the navigation view is shown
- **THEN** the brand, search, add, and each folder entry are at least 48 by 48
  CSS pixels, and so is the folder entry's close control

#### Scenario: The calendar's cells meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and a folder open
- **WHEN** the navigation view is shown
- **THEN** the month controls are at least 48 by 48 CSS pixels, and every day
  cell is 48 tall and at least 44 wide

#### Scenario: The listings and summaries meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and a folder open
- **WHEN** the navigation or meta view is shown
- **THEN** each accordion summary, each Files row, each right-panel row, and the
  Contents disclosure and its controls are at least 48 by 48 CSS pixels

#### Scenario: The open item's name meets the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and a page with a Files
  row open
- **WHEN** the shell renders
- **THEN** the app bar's title and its page-actions control are each at least 48
  by 48 CSS pixels

#### Scenario: The overlay surfaces' controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the brand screen, the search spotlight, or a menu renders
- **THEN** every control and row it shows is at least 48 by 48 CSS pixels

#### Scenario: The compact text follows the scale

- **GIVEN** a viewport at or below the compact breakpoint and a page open
- **WHEN** the editor, the listing, the calendar, and the app bar render
- **THEN** the editor's body text is 18px, a list row's text is 17px, a section
  label is 13px, and no text is smaller than 12px

#### Scenario: The panes keep a 16px margin

- **GIVEN** a viewport at or below the compact breakpoint and the navigation view shown
- **WHEN** the listing renders
- **THEN** each row's box ends at least 16 CSS pixels from the shell's trailing
  edge

#### Scenario: The bar clears the safe areas

- **GIVEN** a device whose screen has a safe-area inset at the bottom
- **WHEN** the shell renders
- **THEN** the navigation bar's destinations sit inside the inset and none is
  clipped

#### Scenario: The keyboard shrinks the shell

- **GIVEN** the editor view is shown and the on-screen keyboard opens
- **WHEN** the shell re-renders
- **THEN** the shell's height is the visible height, the navigation bar stays
  visible, and the caret's line is not covered by the keyboard

### Requirement: The guided demo offers the tour of the shell

The workspace SHALL offer an app tour only while the guided demo vault is the
active folder. Its one entry point SHALL be the rail's tour control, which the
rail carries only at viewports wider than the compact breakpoint, and the brand
screen SHALL NOT offer a control that opens it. The tour SHALL be a modal overlay
with an accessible name, and while it is open it SHALL contain focus and require
dismissal. It SHALL present an ordered sequence of steps, each naming one region
of the shell — the folder rail, the sidebar, the editor area, the right panel,
and the status bar — and explaining what that region holds. The step naming the
sidebar SHALL name the session navigation its Journal row holds — Back, Forward,
and Today — as well as the calendar and the listing. The step naming the editor
area SHALL also name the reference forms the page surface accepts — `#word` and
`#[[Page]]` for a page, and `#!word` and `#![[Board]]` for a board — so the tour
teaches linking as well as the pane, and SHALL name the demo vault the tour is
walking as a worked example of every feature. Each step SHALL highlight the
region it names, and a step whose region is not on screen SHALL still show its
explanation rather than fail. Every step except the first SHALL offer a way back
to the previous step, every step except the last a way forward, and the tour
SHALL offer a way to end it at any step, including by Escape. Opening the tour
SHALL move focus into it, and ending it SHALL return focus to the control that
opened it. The tour SHALL be presentational only: it SHALL change no page's
content, write nothing to the vault, and store nothing, and it SHALL NOT launch
on its own. The tour SHALL add no work to the editing or typing path.

#### Scenario: The demo's rail control opens the tour

- **GIVEN** the guided demo vault is open at a viewport wider than the compact
  breakpoint
- **WHEN** the user activates the rail's tour control
- **THEN** the tour opens at its first step, naming the folder rail and
  highlighting it

#### Scenario: A real folder's rail carries no tour control

- **GIVEN** a real folder is open at a viewport wider than the compact breakpoint
- **WHEN** the rail renders
- **THEN** it shows no tour control and offers no other way to open the tour

#### Scenario: The compact shell carries no tour control

- **GIVEN** a viewport at or below the compact breakpoint and the guided demo open
- **WHEN** the navigation view is shown
- **THEN** the rail shows no tour control and the tour cannot be opened

#### Scenario: The brand screen does not open the tour

- **GIVEN** no folder is open at a viewport wider than the compact breakpoint
- **WHEN** the user looks at the brand screen
- **THEN** no control there opens the tour

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

#### Scenario: The editor step names the demo vault

- **WHEN** the user reaches the step naming the editor area
- **THEN** its explanation names the demo vault the tour is walking as a worked
  example of every feature

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

- **GIVEN** a demo page is open with unsaved edits and the search spotlight is
  closed
- **WHEN** the user opens the tour, moves through its steps, and ends it
- **THEN** the open page and its content are unchanged, the spotlight stays
  closed, and nothing is written anywhere

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

### Requirement: The rail's bottom group holds the feedback control, or the demo's tour

The rail SHALL render the Folio brand as its first control, then the search
trigger, then the add control and one entry per open folder, and a bottom group
held to the rail's bottom edge that SHALL hold exactly one control. While the
guided demo vault is the active folder, and only at viewports wider than the
compact breakpoint, that control SHALL be the tour control. In every other state,
and at or below the compact breakpoint whether or not the demo is open, it SHALL
be the feedback control. Where the browser cannot open local folders, the rail
SHALL show no add control and the app SHALL not invoke the picker. Activating an
entry SHALL make that folder active, and a folder whose stored permission is
pending SHALL request permission rather than opening the picker. Opening the same
folder twice SHALL NOT add a second entry. Switching folders SHALL reset the open
page to the new folder's today journal. The rail SHALL render no entries until
stored folders have resolved, SHALL keep a fixed control size, and SHALL scroll
vertically only. The bottom control SHALL keep its place at the rail's bottom
edge however many folders are listed, SHALL carry an accessible name naming the
action it performs, and SHALL show visible keyboard focus.

The feedback control SHALL open the project's new-issue page, where the bug
report and feature request forms are offered, in a new browser tab, SHALL NOT
navigate the app away from its state, and SHALL change nothing in the vault, the
open page, or the app's stored preferences. The tour control SHALL open the app
tour and SHALL exist only where the tour exists.

#### Scenario: The add control opens the picker and lists the folder

- **WHEN** the user activates the add control and picks a folder
- **THEN** an entry for it appears on the rail and the folder becomes active

#### Scenario: Choosing a rail entry switches the folder

- **WHEN** the user activates an entry that is not active
- **THEN** that folder becomes active and the open page becomes its today journal

#### Scenario: The active entry is distinct

- **WHEN** several folders are listed
- **THEN** the active folder's entry is visually distinct

#### Scenario: A pending folder re-grants without the picker

- **WHEN** the user activates a listed folder whose permission is pending
- **THEN** the app requests permission and shows no picker

#### Scenario: No duplicate entry

- **WHEN** the user picks a folder that is already listed
- **THEN** no duplicate appears and the existing entry becomes active

#### Scenario: No add control where folders cannot be opened

- **GIVEN** a browser that cannot open local folders
- **WHEN** the shell renders
- **THEN** the rail shows no add control while keeping its column

#### Scenario: The demo's rail carries the tour control

- **GIVEN** the guided demo vault is open at a viewport wider than the compact
  breakpoint
- **WHEN** the shell renders
- **THEN** the rail's bottom group holds the tour control and no feedback control

#### Scenario: A real folder's rail carries the feedback control

- **GIVEN** a real folder is open at a viewport wider than the compact breakpoint
- **WHEN** the shell renders
- **THEN** the rail's bottom group holds the feedback control and no tour control

#### Scenario: The compact rail carries the feedback control

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the navigation view is shown
- **THEN** the rail's bottom group holds the feedback control, whether or not the
  guided demo is open

#### Scenario: The bottom control sits at the rail's bottom

- **GIVEN** several folders listed
- **WHEN** the shell renders
- **THEN** the bottom group's control is the rail's last control, held to its
  bottom edge after every folder entry

#### Scenario: The feedback control is present with no folder and while restoring

- **GIVEN** no folder is open, or stored folders have not yet resolved
- **WHEN** the shell renders
- **THEN** the rail shows its feedback control

#### Scenario: The feedback control opens the issue page in a new tab

- **WHEN** the user activates the feedback control
- **THEN** the project's new-issue page opens in a new browser tab and the app
  stays in the state it was in

#### Scenario: Reporting writes nothing

- **WHEN** the user activates the feedback control
- **THEN** no vault file, no stored folder reference, and no app preference changes

### Requirement: The unsupported-browser state is a visible warning

Where the browser cannot open local folders, the no-folder state SHALL show a
distinct warning rather than a tagline. The warning SHALL carry a heading that
names Chrome, Edge, and Brave, SHALL state that opening local folders needs a
Chromium-based browser, and SHALL remain visually distinct from the surrounding
brand copy. It SHALL still offer the guided demo. The warning SHALL NOT appear
where the browser can open local folders, and it SHALL write and store nothing.

#### Scenario: An unsupported browser shows the warning

- **GIVEN** a browser with no File System Access folder picker
- **WHEN** the app starts with no folder open
- **THEN** the center pane shows a warning with the heading "Chrome, Edge, or
  Brave required" and a body naming the Chromium-based browsers

#### Scenario: The warning stands apart from the tagline

- **GIVEN** the unsupported-browser warning is shown
- **WHEN** the user looks at the brand screen
- **THEN** the warning has its own surface and icon and does not read as the
  ordinary open-folder tagline

#### Scenario: The warning points at the demo

- **GIVEN** the unsupported-browser warning is shown
- **WHEN** the user looks below it
- **THEN** the guided demo is still offered, and activating it opens the demo

#### Scenario: A supported browser has no warning

- **GIVEN** a browser with the File System Access folder picker
- **WHEN** the app starts with no folder open
- **THEN** the brand screen shows its usual tagline and no browser warning

#### Scenario: The warning is presentational only

- **WHEN** the unsupported-browser warning renders
- **THEN** it creates no file, requests no permission, opens no picker, and
  writes nothing

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
trailing edge, and those three controls SHALL appear nowhere else in the
sidebar. A control in the summary SHALL act as
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
- **THEN** Back, Forward, and Today appear in that order at the Journal
  section's summary row's trailing edge, after its label

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

### Requirement: A section's summary leads with its disclosure marker
Every accordion summary — the sidebar's Journal and Files, and the right panel's
Contents, Links, and shortcuts reference — SHALL draw its disclosure marker ahead
of its label, at the row's leading edge, and SHALL keep the row's trailing edge
for the section's own controls. The marker SHALL point right while its section is
collapsed and down while it is open, SHALL be a decoration rather than a control
of its own (the summary row stays the one disclosure control), and SHALL NOT
change the row's height.

#### Scenario: The marker leads the label

- **WHEN** a section summary renders
- **THEN** its disclosure marker is drawn to the left of its label, and anything
  else the row holds sits at its trailing edge

#### Scenario: The marker reports the section's state

- **GIVEN** a collapsed section
- **WHEN** its summary renders
- **THEN** the marker points right, and it points down once the section is open

#### Scenario: The marker adds no control

- **WHEN** the user reaches a summary row with assistive technology
- **THEN** the row is one control whose expanded state the marker draws, and the
  marker itself is not a separate control

### Requirement: The version badge is a disclosure control

The status bar's version SHALL be a button that reports whether its panel is
open and opens, on activation, a panel anchored above the bar's trailing edge.
Where the badge is not rendered — at or below the compact breakpoint — the
disclosure SHALL NOT exist. The badge SHALL be reachable and activatable by
keyboard and SHALL show visible focus.

#### Scenario: Activating the badge opens the recent changes

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the user activates the version badge
- **THEN** a panel opens above the bar and the badge reports its panel open

#### Scenario: The compact bar offers no disclosure

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** no version badge and no recent-changes panel exist

### Requirement: The recent-changes panel lists the build's changes

The panel SHALL list the newest user-facing changes the build carries, newest
first, grouped by the version that shipped them. Each group SHALL show the
version and the date its changes landed, and each change its text; a change SHALL
NOT repeat the date inside its group. Past what the panel shows at once, the list
SHALL scroll inside it, and the bar SHALL neither grow nor scroll. The panel
SHALL hold no control, link, or setting of its own.

#### Scenario: The list reads newest first with the date each change landed

- **GIVEN** the open panel
- **WHEN** the user reads it
- **THEN** each group shows the version that shipped its changes with the date
  they landed, every change sits under its own version, and no group appears
  above a newer one

#### Scenario: A version's changes stay together

- **GIVEN** a version that shipped more than one user-facing change
- **WHEN** the user opens the panel
- **THEN** all of those changes sit under that version's single heading, and the
  next version starts a new group

#### Scenario: A long list scrolls inside the panel

- **GIVEN** more recent changes than the panel shows at once
- **WHEN** the user opens the panel
- **THEN** the panel's body scrolls and the bar neither grows nor scrolls

### Requirement: Every ordinary dismissal closes the panel

A second activation of the badge, a pointer press anywhere outside the panel,
`Escape`, or the shell losing focus SHALL close the panel and return the badge's
reported state to closed. Closing SHALL NOT move keyboard focus, and opening or
closing SHALL NOT write to the vault or to any stored preference.

#### Scenario: The panel closes without moving focus

- **GIVEN** the open panel and keyboard focus on the badge
- **WHEN** the user presses `Escape`, or activates the badge again, or presses
  the pointer outside the panel
- **THEN** the panel closes, the badge reports it closed, and focus stays on the
  badge

#### Scenario: Reading the changes changes nothing else

- **GIVEN** an open page with unsaved edits
- **WHEN** the user opens and closes the panel
- **THEN** the edits, the open page, and the vault are as they were, and no
  preference is written

### Requirement: The compact app bar names the open view

At or below the compact breakpoint the shell SHALL render a 64 CSS pixel app bar
above every compact view. It SHALL hold a title and, under it, the save-state
line. The title SHALL be one line at 18px semibold, truncated rather than
wrapped, naming the view: the open item's title, "Details", the folder's name or
"Folders", and "Folio" on the brand screen. Where the open item is a page or a
journal day, the title SHALL be a control at least 48px tall that locates it as
the status bar's crumb does. The status line SHALL be 13px, outside the title
control, and announced as a status: the save-state text, or the indexing label
while the index builds, and nothing on the brand screen. The bar SHALL pad the
top safe-area inset.

#### Scenario: The bar shows the open page's title

- **GIVEN** a viewport at or below the compact breakpoint and a page open
- **WHEN** the app bar renders
- **THEN** its title is the page's title and it is one line

#### Scenario: The title locates a page

- **GIVEN** a page open in the editor view
- **WHEN** the user activates the app bar's title
- **THEN** the navigation view shows with the page's row in view and focused

#### Scenario: The title locates a journal day

- **GIVEN** a journal day open in the editor view
- **WHEN** the user activates the app bar's title
- **THEN** the navigation view shows with the day's cell in view and focused

#### Scenario: The navigation view names its folder

- **GIVEN** a folder active and the navigation view shown
- **WHEN** the app bar renders
- **THEN** its title is the folder's name

#### Scenario: The bar shows the save state

- **GIVEN** a page with unsaved edits open
- **WHEN** the app bar renders
- **THEN** its status line reads "Unsaved changes" and is announced as a status

#### Scenario: The brand screen has no save state

- **GIVEN** no folder active and the brand screen shown
- **WHEN** the app bar renders
- **THEN** it shows no status line

### Requirement: The compact app bar carries the open page's actions

On the editor view with a page row, the compact app bar SHALL carry a
page-actions control at its trailing edge, 48 by 48, that opens the page row
menu's items at the control: Favorite or Unfavorite, Remove reminder when the
page has a rule, and Present. The control SHALL NOT show for a journal day, a
board, an asset, the results view, or the brand screen, because none of them has
a page row's menu.

#### Scenario: The overflow holds the page's actions

- **GIVEN** a page with a Files row open in the editor view
- **WHEN** the user activates the page-actions control
- **THEN** the row menu's items open at the control, with Favorite or Unfavorite
  first

#### Scenario: A journal day has no page actions

- **GIVEN** a journal day open in the editor view
- **WHEN** the app bar renders
- **THEN** it carries no page-actions control

#### Scenario: A board has no page actions

- **GIVEN** a board open in the editor view
- **WHEN** the app bar renders
- **THEN** it carries no page-actions control

### Requirement: The status bar spans the wide workspace

At viewports wider than the compact breakpoint, the shell SHALL render a thin
status bar as a full-width row beneath the workspace, present in every state —
with a folder open, while it loads, on search results, on an open board, and on
the no-folder state. It SHALL show the open item's file path as a breadcrumb, a
status group holding the save-state text and the loading label, and at its
trailing edge the active folder's name and how many notes it holds, with the
running version beside them. A group SHALL be empty when it has no source, and
the bar SHALL sit outside the panes' scroll regions, so its content never
scrolls. The bar's display-only content SHALL perform no action; its controls
SHALL be the running version's disclosure and the open page's name where it has
a Files row. The bar SHALL NOT hold a Back, Forward, or Today control: those live
on the Journal section's summary row. At or below the compact breakpoint the bar
SHALL NOT render; the compact navigation bar takes its place.

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
- **THEN** it shows the version beside the folder's name and its note count, as a
  control that discloses the build's recent changes

#### Scenario: The note count is the same before and after the index lands

- **GIVEN** a folder that holds notes, and an index that is still building
- **WHEN** the bar first renders and again once the index lands
- **THEN** the count beside the folder's name is the same number both times

#### Scenario: The note count leaves out what the folder holds besides notes

- **GIVEN** a folder holding notes, an image asset, a board, and its `.folio`
  state
- **WHEN** the bar renders its folder group
- **THEN** the count is the number of notes alone

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

#### Scenario: The wide bar names the open page

- **GIVEN** a viewport wider than the compact breakpoint and a page open
- **WHEN** the shell renders
- **THEN** the open page's name is a control that reveals its row in Files

### Requirement: The compact shell shows one view at a time, chosen from its navigation bar

At or below the compact breakpoint, the shell SHALL show exactly one of three
views in its content area — the navigation view (the folder rail and the
sidebar together), the editor view, or the meta view (the right panel) — drawn
from the same panes and the same data as the three-pane shell. It SHALL render
no collapse strips and SHALL NOT fold a pane. Which view is shown SHALL last
only for the session, resetting on reload and never being written to the vault,
to IndexedDB, or to any other store.

The landing view SHALL follow what is open: with no folder open it SHALL be the
editor view, whose center pane is the brand screen; with a folder open and
nothing open in it, the navigation view; with an item open, the editor view.
Returning home — by activating the brand or by closing the active folder — SHALL
land on the brand screen. Selecting a row in the navigation view SHALL show the
editor view. Activating a destination SHALL show that destination's view; the
destination already shown SHALL do nothing. The editor is the base: selecting it
SHALL return to it, and selecting either other view from the editor SHALL push
one history entry, so the browser's back step — the Android Back button and the
Back gesture — returns to the editor instead of leaving the app. Switching
directly between the two non-editor views SHALL NOT push another entry, so Back
still returns to the editor in one step. Selecting a view SHALL change nothing
else: it SHALL NOT navigate, change the open page or its content, change the
search spotlight's state, or write to the vault.

#### Scenario: The brand screen is the landing view with no folder open

- **GIVEN** a viewport at or below the compact breakpoint and no folder active
- **WHEN** the app loads
- **THEN** the editor view is shown and its center pane is the brand screen

#### Scenario: The navigation view is the landing view with nothing open

- **GIVEN** a viewport at or below the compact breakpoint, a folder open, and no
  page open
- **WHEN** the app loads
- **THEN** the navigation view is shown

#### Scenario: The editor view is the landing view with a page open

- **GIVEN** a viewport at or below the compact breakpoint and a page open
- **WHEN** the app loads
- **THEN** the editor view is shown

#### Scenario: Returning home shows the brand screen

- **GIVEN** a viewport at or below the compact breakpoint and an active folder
- **WHEN** the user activates the brand or closes the active folder
- **THEN** the brand screen is shown, not the navigation view

#### Scenario: Selecting a row shows the editor

- **GIVEN** the navigation view is shown
- **WHEN** the user selects a page row
- **THEN** the editor view is shown with that page open

#### Scenario: A destination shows its view

- **GIVEN** the editor view is shown
- **WHEN** the user activates the Details destination
- **THEN** the meta view is shown and the editor view is not

#### Scenario: The shown destination does nothing

- **GIVEN** the navigation view is shown and its destination is active
- **WHEN** the user activates the Notes destination
- **THEN** the navigation view stays shown

#### Scenario: The editor destination returns to the page

- **GIVEN** the meta view is shown
- **WHEN** the user activates the Page destination
- **THEN** the editor view is shown

#### Scenario: Back returns to the editor instead of leaving the app

- **GIVEN** the meta view is shown and the app is installed as a standalone app
- **WHEN** the user presses the device's Back button or performs the Back gesture
- **THEN** the editor view is shown and the app is still open

#### Scenario: Switching between the two non-editor views adds no back step

- **GIVEN** the navigation view is shown after selecting it from the editor
- **WHEN** the user activates the Details destination and then presses Back
- **THEN** the editor view is shown in one step

#### Scenario: Selecting a view disturbs nothing else

- **GIVEN** a page is open with unsaved edits and the search spotlight is closed
- **WHEN** the user selects either other view
- **THEN** the open page and its content are unchanged, the spotlight stays
  closed, and nothing is written to the vault

#### Scenario: The shown view does not persist

- **GIVEN** the meta view is shown
- **WHEN** the app is reloaded
- **THEN** the view follows the landing rule again and nothing stored the
  previous view

### Requirement: The compact navigation bar composes three destinations

At or below the compact breakpoint the shell's footer SHALL be a navigation bar,
64 CSS pixels tall plus the device's bottom safe-area inset, holding exactly
three equal destinations: Notes (the navigation view), Page (the editor view),
and Details (the meta view). Each destination SHALL be a full-height segment of
a third of the bar's width, carrying a 24px icon and a visible 13px label. The
destination whose view is shown SHALL carry a 56 by 32 rounded active indicator
in the app's recede tint behind its icon, with its icon and label in the brand
ink; the other destinations SHALL carry no indicator and use the tertiary ink.
Each destination SHALL report the active state to assistive technology, and the
bar SHALL hold no status text. The bar SHALL sit outside the panes' scroll
regions, so its content never scrolls.

#### Scenario: The bar carries three destinations

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** the footer shows Notes, Page, and Details, in that order

#### Scenario: A destination fills a third of the bar

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the navigation bar renders
- **THEN** each destination is one third of the bar's width and the full 64px
  height

#### Scenario: The active destination carries the indicator

- **GIVEN** a viewport at or below the compact breakpoint and the editor view
  shown
- **WHEN** the navigation bar renders
- **THEN** Page carries the 56 by 32 rounded indicator and the brand ink, and
  Notes and Details carry neither

#### Scenario: The destination reports its state

- **GIVEN** a viewport at or below the compact breakpoint and the meta view shown
- **WHEN** the user reads the navigation bar's destinations with assistive
  technology
- **THEN** Details reports the current state and the other two do not

#### Scenario: The bar carries no status text

- **GIVEN** a viewport at or below the compact breakpoint and a page with unsaved
  edits open
- **WHEN** the navigation bar renders
- **THEN** it shows only the three destinations; the save state is in the app bar

#### Scenario: The bar clears the safe areas

- **GIVEN** a device whose screen has a safe-area inset at the bottom
- **WHEN** the shell renders
- **THEN** the destinations sit inside the inset and none is clipped

#### Scenario: The bar exists only at compact

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the shell renders
- **THEN** no navigation bar and no destination render

### Requirement: The no-folder state shows the brand screen

When no folder is active, the center pane SHALL show a brand screen: the Folio
mark, decorative only, a short tagline as the screen's headline, and one short
description of the app that names it as local-first and the Markdown folder as
the database. The screen SHALL show the actions it offers directly under that
introduction, before any supporting detail.

Below the actions the screen SHALL show a compact set of facts about what the
app does, as three labeled items rather than a sentence: pages and journals are
plain Markdown files, a page is referenced with `#word` or `#[[Page]]`, and a
whiteboard with `#!board`. Each item SHALL carry a short label and its detail, so
the set is read by scanning, and SHALL NOT carry an icon, a border, or a card.
The items SHALL occupy one row where the pane is wide enough for three and one
column where it is not, so no item is truncated at any width.

The repository line SHALL sit below the facts as the screen's quietest text.
Where the app tour exists, a line above it SHALL name the guided demo as where
the tour is taken.

The screen SHALL be reachable at startup when no folder is stored, by activating
the brand, and by closing the active folder. In every no-folder state, whether or
not the browser can open local folders, the screen SHALL offer the guided demo,
and activating it SHALL open the demo vault's Welcome page. Where a stored folder
is active but its permission is pending, the screen SHALL lead with a
`Continue with <name>` action, primary, that requests the folder's permission
and opens it when the browser grants it; the action SHALL be offered only while
the permission is pending. Where the browser
cannot open local folders, the screen SHALL state the browser requirement in
place of the open-folder headline, and SHALL contain no control that promises an
action the app cannot perform. The guided demo remains available there, because
it needs no local folder. Where the app tour exists (viewports wider than the compact breakpoint), the
screen SHALL name the guided demo and the tour control its rail carries as where
the tour is taken, and SHALL offer no control that opens the tour itself. At or below the compact
breakpoint, where the shell shows one view at a time and the folder rail is not
on screen, the screen SHALL also offer
an open-folder action where the browser can open folders, as the action the
screen's own headline names, and activating it SHALL open the folder picker and
add the chosen folder exactly as the rail's add control does.

In every no-folder state, whether or not the browser can open local folders, the
screen SHALL also show, below the actions, a line stating that bugs and feature
requests are reported on the project's public repository, with that repository's
link. The link SHALL open the repository in a new browser tab, SHALL NOT navigate
the app away from its screen, and SHALL carry an accessible name that identifies
the repository.

Where the screen's content is taller than the pane, the pane SHALL scroll rather
than clip it, and the content SHALL stay centered while it fits.

#### Scenario: The brand screen shows before a folder opens

- **WHEN** the app starts with no folder open
- **THEN** the center pane shows the Folio mark and a tagline and no open-folder
  button

#### Scenario: The brand screen describes the app

- **WHEN** the app starts with no folder open
- **THEN** the center pane shows a short description of the app and a compact set
  of facts about what it does

#### Scenario: The brand screen's facts are scannable

- **WHEN** the user looks at the brand screen's facts
- **THEN** three labeled items state that pages and journals are plain Markdown
  files, that a page is referenced with `#word` or `#[[Page]]`, and that a
  whiteboard uses `#!board`, each as a label with its detail rather than a
  sentence

#### Scenario: The facts fit the pane's width

- **WHEN** the pane is wide enough for three facts
- **THEN** they occupy one row
- **AND WHEN** it is not
- **THEN** they occupy one column

#### Scenario: The actions come before the facts

- **WHEN** the user reads the brand screen from the top
- **THEN** the folder and demo actions follow the description, and the facts and
  their footer follow the actions

#### Scenario: The brand screen offers the guided demo

- **WHEN** the brand screen shows
- **THEN** it offers a control that opens the guided demo vault, and activating
  it opens the demo's Welcome page

#### Scenario: The demo is offered without a folder picker

- **GIVEN** a browser that cannot open local folders
- **WHEN** the brand screen shows
- **THEN** it still offers the guided demo and no control promises an action the
  browser cannot perform

#### Scenario: The brand screen references the tour

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the brand screen shows
- **THEN** it names the guided demo and the tour control its rail carries as
  where the tour is taken, and offers no control that opens the tour itself

#### Scenario: The compact brand screen has no tour reference

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the brand screen shows
- **THEN** it shows no tour reference

#### Scenario: The compact brand screen opens a folder

- **GIVEN** a viewport at or below the compact breakpoint, a browser that can open
  local folders, and no active folder
- **WHEN** the brand screen shows
- **THEN** it offers an open-folder action beside the guided demo, and activating
  it opens the folder picker and adds the chosen folder

#### Scenario: The compact brand screen offers no folder action it cannot perform

- **GIVEN** a viewport at or below the compact breakpoint and a browser that
  cannot open local folders
- **WHEN** the brand screen shows
- **THEN** it shows the browser requirement and no open-folder action

#### Scenario: The brand screen offers a stored folder

- **GIVEN** a stored folder active with its permission pending
- **WHEN** the brand screen shows
- **THEN** it leads with a `Continue with <name>` action, and activating it asks
  the browser for the folder's permission

#### Scenario: The reconnect action goes once the folder opens

- **GIVEN** the brand screen's `Continue with <name>` action and a granted
  permission
- **WHEN** the folder opens
- **THEN** the brand screen is replaced by the folder's today journal and the
  action is gone

#### Scenario: The brand screen shows while folders are listed

- **GIVEN** folders listed on the rail
- **WHEN** the user activates the brand to return home
- **THEN** the center pane shows the brand screen and every folder remains listed

#### Scenario: The brand screen names the browser requirement

- **GIVEN** a browser that cannot open local folders
- **WHEN** the app starts with no folder open
- **THEN** the center pane states the browser requirement instead of the
  open-folder headline

#### Scenario: The brand screen links to the repository

- **GIVEN** no folder is open
- **WHEN** the user looks at the brand screen
- **THEN** it shows a link to the project's public repository below the actions

#### Scenario: The brand screen says where issues go

- **GIVEN** no folder is open
- **WHEN** the user looks at the brand screen
- **THEN** it states that issues are reported on the project's repository,
  beside the repository link

#### Scenario: The repository link opens in a new tab

- **WHEN** the user activates the repository link
- **THEN** the repository opens in a new browser tab and the app stays on the
  brand screen
