# Spec Delta

## MODIFIED Requirements

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
and activating it SHALL open the demo vault's Welcome page. Where the browser
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

### Requirement: The compact shell shows one view at a time

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
editor view. Activating the navigation or meta view control SHALL show that
view, and activating the control of the view already shown SHALL return to the
editor view. Showing a view SHALL push a history entry, so the browser's back
step — the Android Back button and the Back gesture — returns to the editor view
instead of leaving the app. Showing a view SHALL change nothing else: it SHALL
NOT navigate, change the open page or its content, change the search spotlight's
state, or write to the vault.

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

#### Scenario: A view control shows its view

- **GIVEN** the editor view is shown
- **WHEN** the user activates the meta view control
- **THEN** the meta view is shown and the editor view is not

#### Scenario: The shown view's own control returns to the editor

- **GIVEN** the navigation view is shown
- **WHEN** the user activates the navigation view control
- **THEN** the editor view is shown

#### Scenario: Back returns to the editor instead of leaving the app

- **GIVEN** the meta view is shown and the app is installed as a standalone app
- **WHEN** the user presses the device's Back button or performs the Back gesture
- **THEN** the editor view is shown and the app is still open

#### Scenario: Showing a view disturbs nothing else

- **GIVEN** a page is open with unsaved edits and the search spotlight is closed
- **WHEN** the user shows either view
- **THEN** the open page and its content are unchanged, the spotlight stays
  closed, and nothing is written to the vault

#### Scenario: The shown view does not persist

- **GIVEN** the meta view is shown
- **WHEN** the app is reloaded
- **THEN** the view follows the landing rule again and nothing stored the
  previous view

### Requirement: Compact controls are touch-sized and clear the device's safe areas

At or below the compact breakpoint, every control the shell shows SHALL have a
target of at least 44 by 44 CSS pixels. The rule covers the controls of the
status bar and the Journal row, the folder rail's controls and a folder entry's
close control, the accordion summaries, the calendar's month controls and day
cells, the Files listing's rows, the right panel's rows and its Contents
disclosure and expand/collapse controls, the status bar's open-item name, the
brand screen's actions, the search spotlight's controls and rows, the menus'
items, and the presentation view's controls. A target MAY be larger than the
mark it draws; where a control's drawn mark is smaller than the minimum, an
invisible hit area SHALL make up the difference. The status bar SHALL pad itself
with the device's safe-area insets,
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

#### Scenario: The rail's controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and a folder listed
- **WHEN** the navigation view is shown
- **THEN** the brand, search, add, and each folder entry are at least 44 by 44
  CSS pixels, and so is the folder entry's close control

#### Scenario: The calendar's cells meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and a folder open
- **WHEN** the navigation view is shown
- **THEN** the month controls and every day cell are at least 44 by 44 CSS
  pixels

#### Scenario: The listings and summaries meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and a folder open
- **WHEN** the navigation or meta view is shown
- **THEN** each accordion summary, each Files row, each right-panel row, and the
  Contents disclosure and its controls are at least 44 by 44 CSS pixels

#### Scenario: The open item's name meets the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and a page with a Files
  row open
- **WHEN** the shell renders
- **THEN** the status bar's name control is at least 44 by 44 CSS pixels

#### Scenario: The overlay surfaces' controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the brand screen, the search spotlight, or a menu renders
- **THEN** every control and row it shows is at least 44 by 44 CSS pixels

#### Scenario: The bar clears the safe areas

- **GIVEN** a device whose screen has a safe-area inset at the bottom
- **WHEN** the shell renders
- **THEN** the status bar's controls sit inside the inset and none is clipped

#### Scenario: The keyboard shrinks the shell

- **GIVEN** the editor view is shown and the on-screen keyboard opens
- **WHEN** the shell re-renders
- **THEN** the shell's height is the visible height, the status bar stays
  visible, and the caret's line is not covered by the keyboard
