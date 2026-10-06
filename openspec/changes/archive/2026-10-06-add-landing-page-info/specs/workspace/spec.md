# Spec Delta

## MODIFIED Requirements

### Requirement: The no-folder state is a transient brand screen

When no folder is active, the center pane SHALL show a brand screen: the Folio
mark, decorative only, with a short tagline and a short description of the app
that names it as local-first and the Markdown folder as the database. Below the
description it SHALL show a compact set of facts about what the app does: pages
and journals are plain Markdown, a page is referenced with `#word` or
`#[[Page]]`, and a whiteboard with `#!board`. It SHALL be reachable at startup
when no folder is stored, by activating the brand, and by closing the active
folder. Where the browser cannot open local folders, the screen SHALL state the
browser requirement in place of the open-folder tagline, and SHALL contain no
control that promises an action the app cannot perform. Where it can, the screen
SHALL additionally offer the one-time Logseq import and host that import's
progress and result states. Where the app tour is available (viewports wider
than the compact breakpoint), the screen SHALL also offer a tour reference that
opens the app tour, and that reference SHALL name the rail's tour control as the
tour's other home.

In every no-folder state, whether or not the browser can open local folders, the
screen SHALL also show a link to the project's public repository, placed below
the position the import action occupies. The link SHALL open the repository in a
new browser tab, SHALL NOT navigate the app away from its screen, and SHALL
carry an accessible name that identifies the repository.

#### Scenario: The brand screen shows before a folder opens

- **WHEN** the app starts with no folder open
- **THEN** the center pane shows the Folio mark and a tagline and no open-folder
  button

#### Scenario: The brand screen describes the app

- **WHEN** the app starts with no folder open
- **THEN** the center pane shows a short description of the app and a compact set
  of facts about what it does

#### Scenario: The brand screen references the tour

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the brand screen shows
- **THEN** it offers a control that opens the app tour

#### Scenario: The compact brand screen has no tour reference

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the brand screen shows
- **THEN** it shows no control that opens the app tour

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

### Requirement: An app tour explains the shell's regions

The workspace SHALL offer an app tour, opened by activating the folder rail's
tour control or the brand screen's tour reference. The tour SHALL be a modal
overlay with an accessible name, and while it is open it SHALL contain focus and
require dismissal. It SHALL present an ordered sequence of steps, each naming
one region of the shell — the folder rail, the sidebar, the editor area, the
right panel, and the status bar — and explaining what that region holds. The
step naming the editor area SHALL also name the reference forms the page surface
accepts — `#word` and `#[[Page]]` for a page, and `#!word` and `#![[Board]]` for
a board — so the tour teaches linking as well as the pane. Each step SHALL
highlight the region it names, and a step whose region is not on screen SHALL
still show its explanation rather than fail. Every step except the first SHALL
offer a way back to the previous step, every step except the last a way forward,
and the tour SHALL offer a way to end it at any step, including by Escape.
Opening the tour SHALL move focus into it, and ending it SHALL return focus to
the control that opened it. The tour SHALL be presentational only: it SHALL
change no page's content, write nothing to the vault, and store nothing, and it
SHALL NOT launch on its own. The tour SHALL be available only at viewports wider
than the compact breakpoint, where its entry points exist; it SHALL add no work
to the editing or typing path.

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

#### Scenario: The editor step names the reference forms

- **WHEN** the user reaches the step naming the editor area
- **THEN** its explanation names the forms that reference a page and a board

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
