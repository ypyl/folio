# Spec Delta

## REMOVED Requirements

### Requirement: The status bar spans the workspace

**Reason**: The compact footer is no longer a status bar. It becomes a
three-destination navigation bar, and the save state it showed at compact moves
into the compact app bar. The wide status bar's behavior is unchanged and is
re-stated as "The status bar spans the wide workspace".

**Migration**: The compact footer is covered by "The compact navigation bar
composes three destinations"; the save state at compact is covered by "The
compact app bar names the open view". The wide bar keeps every behavior.

### Requirement: The compact shell shows one view at a time

**Reason**: The two view controls toggled between a view and the editor. The
footer now carries three destinations (Notes, Page, Details) that select their
view, so the toggle rule no longer describes the shell. The landing and history
rules are re-stated as "The compact shell shows one view at a time, chosen from
its navigation bar".

**Migration**: Selecting a destination is covered by the new requirement; Back
still returns to the editor.

## ADDED Requirements

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
a third of the bar's width, carrying a 24px icon and a visible 12px label. The
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

## MODIFIED Requirements

### Requirement: The compact app bar names the open view

At or below the compact breakpoint the shell SHALL render a 64 CSS pixel app bar
above every compact view. It SHALL hold a title and, under it, the save-state
line. The title SHALL be one line at 16px semibold, truncated rather than
wrapped, naming the view: the open item's title, "Details", the folder's name or
"Folders", and "Folio" on the brand screen. Where the open item is a page or a
journal day, the title SHALL be a control at least 48px tall that locates it as
the status bar's crumb does. The status line SHALL be 12px, outside the title
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

### Requirement: Compact controls are touch-sized and clear the device's safe areas

At or below the compact breakpoint, every control the shell shows SHALL have a
target of at least 48 by 48 CSS pixels, and the shell's text SHALL follow the
compact scale: 16px body and list text, 14px secondary text and calendar days,
12px section labels, status text, and tab labels, and no text below 11px. A
navigation view's row SHALL keep at least 16 CSS pixels from the shell's
trailing edge, and a Files row SHALL be 52 CSS pixels tall. The rule covers the
compact navigation bar's destinations, the app bar's title, actions, and status
line, the Journal row's controls, the folder rail's controls and a folder
entry's close control, the accordion summaries, the calendar's month controls
and day cells, the Files listing's rows, the right panel's rows and its Contents
disclosure and expand/collapse controls, the brand screen's actions, the search
spotlight's controls and rows, the menus' items, and the presentation view's
controls. A target MAY be larger than the mark it draws; where a control's drawn
mark is smaller than the minimum, an invisible hit area SHALL make up the
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
- **THEN** the navigation bar's destinations sit inside the inset and none is
  clipped

#### Scenario: The keyboard shrinks the shell

- **GIVEN** the editor view is shown and the on-screen keyboard opens
- **WHEN** the shell re-renders
- **THEN** the shell's height is the visible height, the navigation bar stays
  visible, and the caret's line is not covered by the keyboard
