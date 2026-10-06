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
screen SHALL also show, below the position the import action occupies, a line
stating that bugs and feature requests are reported on the project's public
repository, with that repository's link. The link SHALL open the repository in a
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

#### Scenario: The brand screen says where issues go

- **GIVEN** no folder is open
- **WHEN** the user looks at the brand screen
- **THEN** it states that issues are reported on the project's repository,
  beside the repository link

#### Scenario: The repository link opens in a new tab

- **WHEN** the user activates the repository link
- **THEN** the repository opens in a new browser tab and the app stays on the
  brand screen
