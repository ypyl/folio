# Spec Delta

## ADDED Requirements

### Requirement: The compact app bar names the open view

At or below the compact breakpoint the shell SHALL render a 56 CSS pixel app bar
above every compact view. Its title SHALL be one line at 16px semibold,
truncated rather than wrapped, naming the view: the open item's title,
"Details", the folder's name or "Folders", and "Folio" on the brand screen. Where
the open item is a page or a journal day, the title SHALL be a control that
locates it as the status bar's crumb does. The bar SHALL pad the top safe-area
inset.

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

## MODIFIED Requirements

### Requirement: The status bar spans the workspace

The shell SHALL render a thin status bar as a full-width row beneath the
workspace, present in every state — with a folder open, while it loads, on
search results, on an open board, and on the no-folder state. It SHALL show a
status group holding the save-state text and the loading label. At viewports
wider than the compact breakpoint it SHALL also show the open item's file path as
a breadcrumb and, at its trailing edge, the active folder's name and how many
notes it holds, with the running version beside them. At or below the compact
breakpoint it SHALL show the save-state text and the loading label only, and
SHALL show neither the open item's name, nor the folder's name, nor its note
count, nor the version; the app bar carries the open item's name. A group SHALL
be empty when it has no source, and the bar SHALL sit outside the panes' scroll
regions, so its content never scrolls. The bar's display-only content SHALL
perform no action; its controls SHALL be the running version's disclosure, the
open page's name where it has a Files row, and — at or below the compact
breakpoint — the notes-view and details controls the compact shell adds, each
with a visible label beside its glyph and a target of at least 48 by 48. The bar
SHALL NOT hold a Back, Forward, or Today control: those live on the Journal
section's summary row. At or below the compact breakpoint each view control SHALL
show, by the shape it draws rather than by colour alone, whether its view is the
one shown: the pane inside its frame SHALL be filled while that control's view is
open and empty while it is closed, and the open control SHALL additionally carry
the app's recede tint as its background.

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

#### Scenario: The compact bar drops the folder statistics

- **GIVEN** a viewport at or below the compact breakpoint and a page open
- **WHEN** the shell renders
- **THEN** the bar shows the save state and shows neither the page's name, nor
  the folder's name, nor its note count, nor the version, and it is not a
  scrolling row

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
- **THEN** the status bar carries a notes-view control at its leading edge and a
  details control at its trailing edge, each with a visible label

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

### Requirement: Compact controls are touch-sized and clear the device's safe areas

At or below the compact breakpoint, every control the shell shows SHALL have a
target of at least 48 by 48 CSS pixels, and the shell's text SHALL follow the
compact scale: 16px body and list text, 14px secondary text and calendar days,
12px section labels, status text, and tab labels, and no text below 11px. The
navigation panes SHALL keep their content at least 16 CSS pixels from the
shell's edge, and a Files row SHALL be 52 CSS pixels tall. The rule covers the
controls of the status bar and the Journal row, the folder rail's controls and a
folder entry's close control, the app bar's title and actions, the accordion
summaries, the calendar's month controls and day cells, the Files listing's
rows, the right panel's rows and its Contents disclosure and expand/collapse
controls, the brand screen's actions, the search spotlight's controls and rows,
the menus' items, and the presentation view's controls. A target MAY be larger
than the mark it draws; where a control's drawn mark is smaller than the
minimum, an invisible hit area SHALL make up the difference. The calendar's
seven-column grid is the one exception to the width: its cells SHALL be 48 tall
and as wide as the pane's column share, which SHALL be at least 44. The status
bar SHALL pad itself with the device's safe-area insets, so no control sits under
a notch, a rounded corner, or the home indicator, and the shell SHALL size itself
to the viewport height that remains visible, so the on-screen keyboard shrinks
the shell rather than covering the bottom of the editor.

#### Scenario: The app bar's controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** every control in the status bar is at least 48 by 48 CSS pixels

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
- **THEN** the editor's body text is 16px, a list row's text is 16px, a section
  label is 12px, and no text is smaller than 11px

#### Scenario: The panes keep a 16px margin

- **GIVEN** a viewport at or below the compact breakpoint and the navigation view shown
- **WHEN** the listing renders
- **THEN** each row's box ends at least 16 CSS pixels from the shell's trailing
  edge

#### Scenario: The bar clears the safe areas

- **GIVEN** a device whose screen has a safe-area inset at the bottom
- **WHEN** the shell renders
- **THEN** the status bar's controls sit inside the inset and none is clipped

#### Scenario: The keyboard shrinks the shell

- **GIVEN** the editor view is shown and the on-screen keyboard opens
- **WHEN** the shell re-renders
- **THEN** the shell's height is the visible height, the status bar stays
  visible, and the caret's line is not covered by the keyboard

### Requirement: The no-folder state is a transient brand screen

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

The tour reference and the repository line SHALL sit below the facts as the
screen's quietest text.

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
it needs no local folder. Where it can open folders, the screen SHALL
additionally offer the one-time Logseq import and host that import's progress and
result states. Where the app tour is available (viewports wider than the compact
breakpoint), the screen SHALL also offer a tour reference that opens the app
tour, and that reference SHALL name the rail's tour control as the tour's other
home. At or below the compact breakpoint, where the shell shows one view at a
time and the folder rail is not on screen, the screen SHALL also offer an
open-folder action where the browser can open folders, as the action the
screen's own headline names, and activating it SHALL open the folder picker and
add the chosen folder exactly as the rail's add control does.

In every no-folder state, whether or not the browser can open local folders, the
screen SHALL also show, below the position the import action occupies, a line
stating that bugs and feature requests are reported on the project's public
repository, with that repository's link. The link SHALL open the repository in a
new browser tab, SHALL NOT navigate the app away from its screen, and SHALL
carry an accessible name that identifies the repository.

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
- **THEN** the demo and import actions follow the description, and the facts and
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
- **THEN** it offers a control that opens the app tour

#### Scenario: The compact brand screen has no tour reference

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the brand screen shows
- **THEN** it shows no control that opens the app tour

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

#### Scenario: The brand screen hosts the import

- **WHEN** a Logseq import is running or finishes
- **THEN** the center pane shows its progress or its result summary in place of
  the brand screen until the user continues

#### Scenario: The brand screen links to the repository

- **GIVEN** no folder is open
- **WHEN** the user looks at the brand screen
- **THEN** it shows a link to the project's public repository, below the import
  action when that action is present

#### Scenario: The brand screen says where issues go

- **GIVEN** no folder is open
- **WHEN** the user looks at the brand screen
- **THEN** it states that issues are reported on the project's repository,
  beside the repository link

#### Scenario: The repository link opens in a new tab

- **WHEN** the user activates the repository link
- **THEN** the repository opens in a new browser tab and the app stays on the
  brand screen
