# Spec Delta

## REMOVED Requirements

### Requirement: The no-folder state is a transient brand screen

**Reason**: The requirement names and hosts the in-app import. The screen keeps
its brand, facts, demo, reconnect, tour, open-folder action, and repository line;
the import clauses and the import scenario leave with the feature.

**Migration**: Superseded by "The no-folder state shows the brand screen".

## ADDED Requirements

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
it needs no local folder. Where the app tour is available (viewports wider than
the compact breakpoint), the screen SHALL also offer a tour reference that opens
the app tour, and that reference SHALL name the rail's tour control as the
tour's other home. At or below the compact breakpoint, where the shell shows one
view at a time and the folder rail is not on screen, the screen SHALL also offer
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
