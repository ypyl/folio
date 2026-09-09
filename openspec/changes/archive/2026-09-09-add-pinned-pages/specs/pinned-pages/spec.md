## Purpose

Lets users pin pages so notes that need attention stay at the top of the sidebar, with pin state kept as an ordered list inside the vault and rebuildable from the folder.

## ADDED Requirements

### Requirement: User can pin and unpin the open page

The user SHALL be able to pin and unpin the currently open page from the star control in the status bar's leading corner, before the file path. The control SHALL be enabled only when a file-backed page is open — a page that exists on disk in the active folder's index — and SHALL be disabled for a journal day, an unmaterialized page with no file, the search results view, and every other non-page surface. The control SHALL report its state with `aria-pressed` (pinned) and a label reading "Unpin <name>" or "Pin <name>". Pin state SHALL be a per-page boolean from the user's point of view — a page is either pinned or not.

#### Scenario: Pinning the open page from the status bar

- **WHEN** a file-backed page is open and the user activates the status bar's star
- **THEN** the page becomes pinned, appears among the pinned rows at the top of the Pages list, its row gains the pinned marker, and the star reads as pinned

#### Scenario: Unpinning returns the page to the edit-ordered rows

- **WHEN** the user activates the filled star while a pinned page is open
- **THEN** the page is no longer pinned, appears among the unpinned rows ordered by last-modified time, and its row loses the pinned marker

#### Scenario: The star is disabled for a journal day

- **WHEN** a journal day is open
- **THEN** the status bar's star is disabled, and activating it does nothing

#### Scenario: The star is disabled while the search results view is open

- **WHEN** the search results view is open
- **THEN** the status bar's star is disabled, and activating it does nothing

#### Scenario: The star is disabled for a page with no file yet

- **WHEN** an unmaterialized page (no file on disk) is open
- **THEN** the status bar's star is disabled, and activating it does nothing

#### Scenario: The star is disabled when no page is open

- **WHEN** no page is open
- **THEN** the status bar's star is disabled, and activating it does nothing

### Requirement: Pins persist in a hidden vault meta file

Pin state SHALL persist inside the vault as an ordered list of page paths in a hidden meta file (`.folio/pins.md`), so pins survive reopening the vault, belong to that vault alone, and can be rebuilt by scanning the folder (ADR-0001). The meta file SHALL NOT appear as a page in the Pages section, in search results, or anywhere else in the app. The list's order SHALL be pin order with the most recently pinned page first. Editing the meta file in another tool SHALL reorder the pins accordingly, and the app SHALL pick up such a change on its normal refresh.

#### Scenario: Reopening the vault restores pins

- **GIVEN** the user pinned `Ideas.md` and `Vision.md`, with `Ideas.md` pinned most recently
- **WHEN** the folder is closed and reopened
- **THEN** both pages are still pinned and `Ideas.md` sits above `Vision.md` in the pinned ordering

#### Scenario: The pin file is invisible to the app as a page

- **GIVEN** a vault whose `.folio/pins.md` lists several pages
- **WHEN** the user opens the Pages section or searches
- **THEN** no "pins" page or entry appears, and the pin file itself is not listed or searchable

#### Scenario: An external edit to the pin file reorders pins

- **GIVEN** `.folio/pins.md` lists `a.md` then `b.md`
- **WHEN** another tool rewrites it to list `b.md` then `a.md` and a refresh occurs
- **THEN** the pinned rows show `b.md` first

#### Scenario: No pin file means nothing pinned and nothing created

- **WHEN** a vault has no `.folio/pins.md`
- **THEN** the Pages list has no pinned rows and the app creates no file merely by rendering the sidebar

### Requirement: Pinned pages stay in the Pages list, styled as pinned

Pinned pages SHALL remain rows in the Pages list — there SHALL be no separate pinned section. Pinned rows SHALL be listed first, in pin order, and each SHALL be visually marked by the row's own style — a bolder title — with no icon and no extra control on the row. Unpinned rows SHALL render with the normal row style. The pin toggle SHALL live only in the status bar.

#### Scenario: A pinned page stays in the list at the top with its pinned style

- **WHEN** a page is pinned
- **THEN** it remains a row in the Pages list, appears at the top among pinned rows, and its row renders with the pinned style (bolder title)

#### Scenario: The pinned style is not a control

- **WHEN** a pinned page's row is activated
- **THEN** the row navigates to the page; no icon, star control, or nested button appears on the row

#### Scenario: Unpinned rows render with the normal style

- **WHEN** a page is unpinned
- **THEN** its row returns to the normal style and leaves the pinned ordering