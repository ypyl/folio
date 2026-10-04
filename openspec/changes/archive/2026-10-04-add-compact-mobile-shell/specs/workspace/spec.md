# Spec Delta

## MODIFIED Requirements

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

### Requirement: The status bar spans the workspace

The shell SHALL render a thin status bar as a full-width row beneath the
workspace, present in every state — with a folder open, while it loads, on
search results, on an open board, and on the no-folder state. It SHALL lead with
Back, Forward, and Today in that order, then show a status group holding the
save-state text and the loading label. At viewports wider than the compact
breakpoint it SHALL also show the open item's file path as a breadcrumb and, at
its trailing edge, the active folder's name and file count with the running
version beside them as non-interactive text. At or below the compact breakpoint
it SHALL show the open item's name instead of the path, and SHALL show neither
the folder's name, nor its file count, nor the version. Back and Forward SHALL
be the trail controls, each disabled when there is nowhere to step. Activating
Today SHALL open the current day's journal exactly as choosing a calendar day
does, creating nothing on open, and SHALL be disabled while no folder is usable.
A group SHALL be empty when it has no source, and the bar SHALL sit outside the
panes' scroll regions, so its content never scrolls. The bar's display-only
content SHALL perform no action; its only controls SHALL be Back, Forward,
Today, the open page's name where it has a Files row, and — at or below the
compact breakpoint — the navigation and meta view controls the compact shell
adds.

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

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the shell renders in any state
- **THEN** it shows the version beside the folder's name and file count, as
  non-interactive text

#### Scenario: The compact bar drops the folder statistics

- **GIVEN** a viewport at or below the compact breakpoint and a page open
- **WHEN** the shell renders
- **THEN** the bar shows the page's name and shows neither the folder's name,
  nor its file count, nor the version, and it is not a scrolling row

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
  and a meta view control at its trailing edge, alongside its other controls

#### Scenario: A view control exposes whether its view is shown

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** each view control reports whether its view is the one shown

### Requirement: The status bar's page name reveals the open page in the Files listing

When the open item is a page with a row in the Files listing, the status bar's
page-name crumb SHALL be a control. Activating it SHALL show the left navigation
— unfolding it where the three-pane shell folds it, and showing the navigation
view where the compact shell shows one view at a time — open the Files section
if collapsed, scroll the page's row into view, and move keyboard focus to that
row. It SHALL be named for the page it reveals and the action it performs,
reachable and activatable by keyboard, and show visible focus. Revealing SHALL
change nothing else: it SHALL NOT navigate, change the open page or its content,
change the listing's order or any other section's state, or write to the vault.
For a board, a journal day, or nothing open, the file-name crumb SHALL stay
non-interactive text, and directory crumbs SHALL always stay non-interactive.

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

- **GIVEN** a page is open with unsaved edits
- **WHEN** the user activates the page name
- **THEN** the open page and its content are unchanged and nothing is written

#### Scenario: A journal day's breadcrumb is not a control

- **GIVEN** a journal day is open
- **WHEN** the user activates the status bar's file-name crumb
- **THEN** nothing happens

## ADDED Requirements

### Requirement: The compact shell shows one view at a time

At or below the compact breakpoint, the shell SHALL show exactly one of three
views in its content area — the navigation view (the folder rail and the
sidebar together), the editor view, or the meta view (the right panel) — drawn
from the same panes and the same data as the three-pane shell. It SHALL render
no collapse strips and SHALL NOT fold a pane. Which view is shown SHALL last
only for the session, resetting on reload and never being written to the vault,
to IndexedDB, or to any other store.

With no page open the shell SHALL show the navigation view; with a page open it
SHALL show the editor view. Selecting a row in the navigation view SHALL show
the editor view. Activating the navigation or meta view control SHALL show that
view, and activating the control of the view already shown SHALL return to the
editor view. Showing a view SHALL push a history entry, so the browser's back
step — the Android Back button and the Back gesture — returns to the editor view
instead of leaving the app. Showing a view SHALL change nothing else: it SHALL
NOT navigate, change the open page or its content, change the search spotlight's
state, or write to the vault.

#### Scenario: The navigation view is the landing view with nothing open

- **GIVEN** a viewport at or below the compact breakpoint and no page open
- **WHEN** the app loads
- **THEN** the navigation view is shown

#### Scenario: The editor view is the landing view with a page open

- **GIVEN** a viewport at or below the compact breakpoint and a page open
- **WHEN** the app loads
- **THEN** the editor view is shown

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

At or below the compact breakpoint, every control in the status bar SHALL have a
target of at least 44 by 44 CSS pixels. The status bar SHALL pad itself with the
device's safe-area insets, so no control sits under a notch, a rounded corner,
or the home indicator, and the shell SHALL size itself to the viewport height
that remains visible, so the on-screen keyboard shrinks the shell rather than
covering the bottom of the editor.

#### Scenario: The app bar's controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** every control in the status bar is at least 44 by 44 CSS pixels

#### Scenario: The bar clears the safe areas

- **GIVEN** a device whose screen has a safe-area inset at the bottom
- **WHEN** the shell renders
- **THEN** the status bar's controls sit inside the inset and none is clipped

#### Scenario: The keyboard shrinks the shell

- **GIVEN** the editor view is shown and the on-screen keyboard opens
- **WHEN** the shell re-renders
- **THEN** the shell's height is the visible height, the status bar stays
  visible, and the caret's line is not covered by the keyboard
