# The workspace

## Purpose

The application shell: the three-pane workspace that hosts every Folio feature —
the folder rail, the sidebar, the editor area, and the right panel — with the
status bar beneath it and the no-folder state shown before a vault is opened.

## Requirements

### Requirement: The workspace is a foldable three-pane shell

Folio SHALL render a full-height workspace: a leading folder rail, a left
sidebar, a flexible editor pane, and a right panel, with a full-height collapse
strip at each outer edge and the status bar as a full-width row beneath. The
folder rail and the left sidebar SHALL fold together as one left-navigation
unit; the right panel SHALL fold on its own; a folded unit SHALL take no width
and leave its strip in place. Each strip SHALL be a button spanning the
workspace's full height, with an arrow pointing to its unit's outer edge while
expanded and toward the editor while folded, an accessible name naming the unit
it folds, and its expanded or folded state exposed. Both sides SHALL start
expanded, and the folded state SHALL last only for the session, resetting on
reload and never being written anywhere. The shell SHALL NOT scroll, and no pane
SHALL scroll the page: a pane whose content exceeds its height SHALL scroll
within itself, inside whichever section holds it. There SHALL be no header band
above the panes.

#### Scenario: The shell fills the viewport

- **WHEN** the app loads
- **THEN** the shell spans the full viewport height, the panes start at its top
  edge with no band above them, and each strip spans the workspace height

#### Scenario: Long content scrolls within panes, not the page

- **WHEN** content in a pane exceeds that pane's height
- **THEN** it scrolls inside the section that holds it and the shell stays fixed

#### Scenario: Folding the left navigation gives the width to the editor

- **WHEN** the user activates the left strip
- **THEN** the rail and sidebar take no width, the editor takes both, and the
  strip remains with its arrow pointing toward the editor

#### Scenario: The two sides fold independently

- **WHEN** the user folds the left navigation while the right panel is expanded
- **THEN** the left folds and the right stays expanded

#### Scenario: A folded side leaves the tab order

- **GIVEN** the left navigation is folded
- **WHEN** the user moves focus with the keyboard
- **THEN** no control inside the rail or sidebar receives focus

#### Scenario: Folding changes nothing but the layout

- **GIVEN** a page is open with unsaved edits and the search spotlight is closed
- **WHEN** the user folds a side
- **THEN** the open page, its content, and the spotlight's state are unchanged

#### Scenario: The folded state resets on reload

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

### Requirement: The folder rail lists open folders and switches between them

The rail SHALL render the Folio brand as its first control, then the search
trigger, then the add control and one entry per open folder. Where the browser
cannot open local folders, the rail SHALL show no add control and the app SHALL
not invoke the picker. Activating an entry SHALL make that folder active, and a
folder whose stored permission is pending SHALL request permission rather than
opening the picker. Opening the same folder twice SHALL NOT add a second entry.
Switching folders SHALL reset the open page to the new folder's today journal.
The rail SHALL render no entries until stored folders have resolved, SHALL keep
a fixed control size, and SHALL scroll vertically only.

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

### Requirement: The sidebar is an accordion of Journal and Files

The sidebar SHALL hold exactly two collapsible sections, Journal then Files,
with no other sections, controls, or navigation row, so Journal is the first
band. Both SHALL be open by default and SHALL open and close independently, and
every summary SHALL render in every state. The Journal section SHALL size to its
content and not scroll internally; the Files section SHALL take the remaining
height, scrolling within itself and keeping a minimum height. When Journal is
collapsed, Files SHALL take the space it gave up. There SHALL be no tags
section, no New Page button, and no History, Back, Forward, or Today control in
the sidebar.

#### Scenario: Sections open and close independently

- **WHEN** the user collapses Files while Journal is open
- **THEN** Files collapses and Journal stays open

#### Scenario: Every summary is always rendered

- **WHEN** the user collapses Files
- **THEN** both summaries remain in order, each one row

#### Scenario: The sidebar holds no navigation controls

- **WHEN** the shell renders in any state
- **THEN** the sidebar contains no Back, Forward, or Today control

### Requirement: The Journal section shows the journal calendar

When a folder is open, the Journal section SHALL render a month calendar for the
folder's journal days: Sunday-first, one cell per day, with days that have a
note filled in. Cells outside the shown month SHALL be dimmed but clickable as
days. The grid SHALL show the month of the open day, or the current month when
no day is open; previous and next controls SHALL move the shown month without
opening a day; and opening any day SHALL re-anchor the grid to that day's month.
The control that opens the current day's journal lives in the status bar, and it
SHALL re-anchor the grid to the current month. With no folder open, the section
SHALL show no calendar.

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

#### Scenario: No calendar without a folder

- **WHEN** no folder is open
- **THEN** the Journal section shows no calendar

### Requirement: The right panel is an accordion of page metadata

The right panel SHALL hold the page sections Contents and Links, followed by the
shortcuts reference as the last section. Contents and Links SHALL both be open
by default and SHALL open and close independently. While no page and no board is
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

### Requirement: The right panel's last section lists the shortcuts the app binds

The right panel SHALL hold the keyboard-shortcuts reference as its last
collapsible section, collapsed by default and labelled "Keyboard shortcuts". Its
summary SHALL sit at the panel's bottom edge whether collapsed or open. Opening
it SHALL expand the reference upward from that edge and SHALL NOT introduce a
scrolling area or height cap of its own. It SHALL list only the shortcuts the
app actually binds — undo and redo in the editor, the chord that opens a
reference at the caret, and the app's search shortcuts, one row per bound
combination — and SHALL list no formatting or table chord, because the page
surface is edited as Markdown so no such action exists. Each row SHALL show a
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

### Requirement: A shortcut row applies its key combination when activated

Every entry in the shortcuts reference SHALL be a control that applies its own
combination when activated, so a row listing more than one combination offers
one control per combination. Activating an editor row SHALL produce the same
result as pressing that combination in the editor; activating a search row SHALL
open the search spotlight, focused and selected. A control SHALL be named for
both its action and its keys. A row SHALL be disabled when the surface it acts
on is unavailable — rows acting on the editor while no editor is open, and the
search row while no folder is open or the open folder is still loading — and
rows SHALL remain listed in every state whether or not they are disabled.
Activating a row SHALL leave focus where the user can continue, and a
combination the current context does not claim SHALL leave the document
unchanged.

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

#### Scenario: Focus returns to the editor

- **GIVEN** a page is open with the caret in it
- **WHEN** the user activates an editor row's control
- **THEN** the combination is applied and focus is in the editor

#### Scenario: A combination the context does not claim changes nothing

- **GIVEN** a page is open with the caret in an ordinary paragraph
- **WHEN** the user activates a row the context does not claim
- **THEN** the document is unchanged and no error is shown

### Requirement: The status bar spans the workspace

The shell SHALL render a thin status bar as a full-width row beneath the
workspace, present in every state — with a folder open, while it loads, on
search results, on an open board, and on the no-folder state. It SHALL lead with
Back, Forward, and Today in that order, followed by the open item's file path as
a breadcrumb, a status group holding the save-state text and the loading label,
and the active folder's name and file count at its trailing edge, with the
running version beside them as non-interactive text. Back and Forward SHALL be
the trail controls, each disabled when there is nowhere to step. Activating
Today SHALL open the current day's journal exactly as choosing a calendar day
does, creating nothing on open, and SHALL be disabled while no folder is usable.
A group SHALL be empty when it has no source, and the bar SHALL sit outside the
panes' scroll regions, so its content never scrolls. The bar's display-only
content SHALL perform no action; its only controls SHALL be Back, Forward,
Today, and the open page's name where it has a Files row.

#### Scenario: The bar is present in every state

- **GIVEN** the app on the no-folder state
- **WHEN** the shell renders
- **THEN** the status bar is present with its groups empty and Back, Forward, and
  Today disabled at its leading edge

#### Scenario: An open page fills the path group

- **WHEN** the user opens a page
- **THEN** the bar shows the page's file path as a breadcrumb

#### Scenario: The loading label shows in the bar

- **WHEN** the active folder is loading
- **THEN** the bar shows the loading label

#### Scenario: The bar shows the running version

- **WHEN** the shell renders in any state
- **THEN** it shows the version beside the folder's name and file count, as
  non-interactive text

#### Scenario: The bar stays put while panes scroll

- **WHEN** the user scrolls a pane beneath the status bar
- **THEN** the bar remains fixed at the shell's bottom

#### Scenario: The bar performs no actions

- **WHEN** the user activates the breadcrumb's directory segments, the status
  text, or the folder name
- **THEN** nothing happens

### Requirement: The status bar's page name reveals the open page in the Files listing

When the open item is a page with a row in the Files listing, the status bar's
page-name crumb SHALL be a control. Activating it SHALL unfold the left
navigation, open the Files section if collapsed, scroll the page's row into view,
and move keyboard focus to that row. It SHALL be named for the page it reveals
and the action it performs, reachable and activatable by keyboard, and show
visible focus. Revealing SHALL change nothing else: it SHALL NOT navigate, change
the open page or its content, change the listing's order or any other section's
state, or write to the vault. For a board, a journal day, or nothing open, the
file-name crumb SHALL stay non-interactive text, and directory crumbs SHALL
always stay non-interactive.

#### Scenario: Activating the page name reveals its row

- **GIVEN** a long Files listing with the open page's row outside the visible part
- **WHEN** the user activates the status bar's page name
- **THEN** the row is scrolled into view and keyboard focus is on it

#### Scenario: Revealing unfolds a folded left navigation

- **GIVEN** the left navigation is folded and the open page has a Files row
- **WHEN** the user activates the page name
- **THEN** the left navigation unfolds and the row is visible and focused

#### Scenario: Revealing opens a collapsed Files section

- **GIVEN** the Files section is collapsed and the open page has a row
- **WHEN** the user activates the page name
- **THEN** the Files section opens with the row in view and focused

#### Scenario: Revealing changes nothing else

- **GIVEN** a page is open with unsaved edits
- **WHEN** the user activates the page name
- **THEN** the open page and its content are unchanged and nothing is written

#### Scenario: A journal day's breadcrumb is not a control

- **GIVEN** a journal day is open
- **WHEN** the user activates the status bar's file-name crumb
- **THEN** nothing happens

### Requirement: The no-folder state is a transient brand screen

When no folder is active, the center pane SHALL show a brand screen: the Folio
mark, decorative only, with a short tagline. It SHALL be reachable at startup
when no folder is stored, by activating the brand, and by closing the active
folder. Where the browser cannot open local folders, the screen SHALL state the
browser requirement in place of the open-folder tagline, and SHALL contain no
control that promises an action the app cannot perform. Where it can, the screen
SHALL additionally offer the one-time Logseq import and host that import's
progress and result states.

In every no-folder state, whether or not the browser can open local folders, the
screen SHALL also show a link to the project's public repository, placed below
the position the import action occupies. The link SHALL open the repository in a
new browser tab, SHALL NOT navigate the app away from its screen, and SHALL
carry an accessible name that identifies the repository.

#### Scenario: The brand screen shows before a folder opens

- **WHEN** the app starts with no folder open
- **THEN** the center pane shows the Folio mark and a tagline and no open-folder
  button

#### Scenario: The brand screen shows while folders are listed

- **GIVEN** folders listed on the rail
- **WHEN** the user activates the brand to return home
- **THEN** the center pane shows the brand screen and every folder remains listed

#### Scenario: The brand screen names the browser requirement

- **GIVEN** a browser that cannot open local folders
- **WHEN** the app starts with no folder open
- **THEN** the center pane states the browser requirement instead of the
  open-folder tagline

#### Scenario: The brand screen hosts the import

- **WHEN** a Logseq import is running or finishes
- **THEN** the center pane shows its progress or its result summary in place of
  the tagline until the user continues

#### Scenario: The brand screen links to the repository

- **GIVEN** no folder is open
- **WHEN** the user looks at the brand screen
- **THEN** it shows a link to the project's public repository, below the import
  action when that action is present

#### Scenario: The repository link opens in a new tab

- **WHEN** the user activates the repository link
- **THEN** the repository opens in a new browser tab and the app stays on the
  brand screen

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
