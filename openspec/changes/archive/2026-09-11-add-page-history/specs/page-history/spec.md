## Purpose

Lets a user return to recently opened pages: every page the app opens is remembered for the session as a trail in the sidebar, so following a link is no longer a one-way trip.

## ADDED Requirements

### Requirement: Opening a page records it in the session trail

The app SHALL record every page it opens in a session trail of page paths, most recently opened first. Every route that opens a page SHALL be recorded: a page row, a calendar day, a backlink or forwardlink row, a search result, a reference badge, and the journal day the app opens on its own when a folder's index becomes ready. Opening a page that is already in the trail SHALL move it to the top of the trail rather than add a second entry, so a page appears in the trail at most once. Recording SHALL leave the open page, the folder's index, and the vault's files unchanged: it writes nothing to disk, so opening an unmaterialized page still creates no file.

#### Scenario: Opening pages records where you came from
- **WHEN** the user opens `Alpha.md` and then `Beta.md`
- **THEN** the trail lists `Beta` before `Alpha`

#### Scenario: Every way of opening a page is recorded
- **WHEN** the user opens a page from a page row, a calendar day, a links-pane row, a search result, and a reference badge
- **THEN** each opened page appears in the trail, most recently opened first

#### Scenario: The app's own journal open is recorded
- **GIVEN** a folder whose index has just become ready
- **WHEN** the app opens that folder's today journal
- **THEN** the today journal is the trail's first entry

#### Scenario: Revisiting a page moves it to the top
- **GIVEN** the user has opened `Alpha`, then `Beta`
- **WHEN** the user opens `Alpha` again
- **THEN** the trail lists `Alpha` then `Beta`, each once

#### Scenario: Opening the page already open adds nothing
- **GIVEN** `Alpha` is the open page
- **WHEN** the user selects `Alpha` again
- **THEN** the trail is unchanged

#### Scenario: Recording creates no file
- **WHEN** the user opens an unmaterialized page and then another page
- **THEN** no file is created for the unmaterialized page and no vault file changes

### Requirement: The trail is capped and lives only for the session

The trail SHALL hold at most 20 pages, discarding its least recently opened entry when a new one would exceed the cap. The trail SHALL exist only in memory for the current session: it SHALL NOT be written to the vault, to browser storage, or to any file, and reloading the app SHALL start with an empty trail.

#### Scenario: The cap drops the oldest entry
- **GIVEN** the trail holds 20 pages
- **WHEN** the user opens a 21st page
- **THEN** the trail still holds 20 pages, the 21st is first, and the page opened longest ago is gone

#### Scenario: A reload starts empty
- **GIVEN** a session in which the user has opened several pages
- **WHEN** the app reloads
- **THEN** the trail holds nothing and the History section shows its empty state

#### Scenario: Nothing is written anywhere
- **WHEN** the user opens several pages
- **THEN** no history file appears in the vault, no page file is added or changed, and no trail data is written to browser storage

### Requirement: Switching the active folder clears the trail

When the active folder changes, the trail SHALL be cleared, so a page from the previous folder never appears in the History section. The newly active folder's own first open SHALL become the trail's first entry like any other.

#### Scenario: A folder switch resets the trail
- **GIVEN** a trail holding pages of vault A
- **WHEN** the user activates vault B
- **THEN** no page of vault A appears in the History section, and vault B's today journal is the trail's first entry

#### Scenario: Returning to a folder does not restore its trail
- **GIVEN** the user navigated in vault A, then switched to vault B
- **WHEN** the user activates vault A again
- **THEN** vault A's earlier pages are absent and vault A's today journal is its only entry

### Requirement: The History section is the sidebar's third section

The sidebar SHALL contain a History section after the Pages section (ui-shell), SHALL render it expanded by default, SHALL keep it present in every app state, and SHALL let it open and close independently of the other sections.

#### Scenario: The section follows Pages
- **WHEN** the shell renders
- **THEN** the sidebar's sections are Journal, then Pages, then History

#### Scenario: The section is expanded by default
- **WHEN** the shell renders
- **THEN** the History section is open and its rows or empty state are visible

#### Scenario: The section collapses independently
- **WHEN** the user collapses History while Journal and Pages are open
- **THEN** History collapses and both other sections remain open

#### Scenario: The section is present with no folder open
- **WHEN** no folder is active
- **THEN** the History section is present and shows its empty state

### Requirement: History lists where the user has been and returns there

The History section SHALL list the trail's pages, most recently opened first, excluding the page currently open, so the section shows pages the user has been to rather than the one they are on. It SHALL NOT mark any of its rows as the current page. Each row SHALL show the page's title, and a row whose page has no file in the folder's index SHALL render dimmed while remaining clickable. Activating a row SHALL open that page, which moves it to the top of the trail. When the trail holds nothing beyond the open page, the section SHALL show empty-state copy reading "Nothing here yet." together with a statement that the section lists pages opened during the current session, and SHALL show no rows.

#### Scenario: The open page is not listed
- **GIVEN** the user opened `Alpha` then `Beta`, and `Beta` is open
- **THEN** History lists `Alpha` only and marks no row as the current page

#### Scenario: Rows run most recent first
- **GIVEN** the user opened `Alpha`, `Beta`, then `Gamma`
- **WHEN** `Gamma` is open
- **THEN** History lists `Beta` then `Alpha`

#### Scenario: Activating a row returns to that page
- **GIVEN** History lists `Alpha` under the open `Beta`
- **WHEN** the user activates the `Alpha` row
- **THEN** `Alpha` opens in the editor pane and becomes the trail's first entry

#### Scenario: A row with no file is dimmed but clickable
- **GIVEN** `Alpha.md` was removed from the folder after it was opened, and `Beta` is open
- **WHEN** History renders
- **THEN** the `Alpha` row is dimmed and still opens `Alpha` when activated

#### Scenario: Nothing to go back to shows copy
- **GIVEN** the only page opened this session is the one open now
- **WHEN** History renders
- **THEN** it shows "Nothing here yet." with its statement of scope, and no page rows
