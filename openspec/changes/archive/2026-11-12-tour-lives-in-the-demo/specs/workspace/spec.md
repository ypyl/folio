# Spec Delta

## REMOVED Requirements

### Requirement: An app tour explains the shell's regions

**Reason**: The tour is now part of the guided demo. Its only entry point is the
rail's control while the demo vault is open, and the brand screen's reference is
gone, so the requirement's two-entry-point contract no longer describes the app.

**Migration**: Open the guided demo from the brand screen (or, with it already
open, from the rail's demo entry), then the `?` at the bottom of the left rail.
Everything else about the tour — its steps, cut-out, focus contract, and
dismissals — is carried into "The guided demo offers the tour of the shell".

### Requirement: The rail lists open folders and ends with the tour control

**Reason**: The rail's bottom group is one control now, not two. Its slot belongs
to the demo's tour while the demo is open and to feedback everywhere else, so a
requirement that fixes the tour control as the rail's permanent last control and
the feedback control as always present no longer holds.

**Migration**: The behavior is carried into "The rail's bottom group holds the
feedback control, or the demo's tour". The tour control keeps the bottom slot it
had; the feedback control takes that slot in every state where the demo is not
the active folder.

## MODIFIED Requirements

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

## ADDED Requirements

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
