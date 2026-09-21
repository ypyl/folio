## MODIFIED Requirements

### Requirement: Search matches titles and content across the vault
Search SHALL match every indexed page and journal day of the open vault. A page SHALL match when its title matches the query, and SHALL match when its content matches the query, with title matches ranking above content matches (title weighted higher). Search SHALL also match the open vault's assets: every file under `assets/` SHALL match when its label — its path inside `assets/` — matches the query, and an asset's file contents SHALL NOT be read, indexed, or matched. Search SHALL also match the open vault's boards: every board under `boards/` SHALL match when its label — its path inside `boards/` — matches the query, and a board's contents SHALL NOT be read, indexed, or matched. The query SHALL be split into terms; a page, journal day, asset, or board SHALL be returned only when every term of at least 3 characters matches it (AND semantics). Results SHALL be ordered by overall relevance (best match first). Unmaterialized pages — references to pages not yet created — SHALL NOT be searchable.

#### Scenario: A title query surfaces the page
- **WHEN** the user searches for a term that appears in a page's title
- **THEN** that page appears in the results, ranked above content-only matches

#### Scenario: A content query surfaces the page
- **WHEN** the user searches for a term that appears only in a page's body
- **THEN** that page appears in the results

#### Scenario: Every term must match
- **WHEN** the user searches a multi-term query
- **THEN** only pages containing every term appear; pages containing just one term are excluded

#### Scenario: Unmaterialized pages are not searchable
- **WHEN** the user searches for a name that has no file on disk
- **THEN** no result is shown for it

#### Scenario: An asset is found by its name
- **GIVEN** a vault holding `assets/2026/q3-report.pdf`
- **WHEN** the user searches for `q3-report`
- **THEN** the file appears in the results under the Assets group

#### Scenario: An asset is found by its subfolder
- **GIVEN** a vault holding `assets/2026/q3-report.pdf`
- **WHEN** the user searches for `2026`
- **THEN** that file appears in the results

#### Scenario: An asset's contents are never matched
- **GIVEN** a vault holding `assets/report.pdf` whose bytes contain the word `revenue`, and no page or asset name containing `revenue`
- **WHEN** the user searches for `revenue`
- **THEN** no result is shown, because the app does not read a file's contents

#### Scenario: A file outside the assets folder is not searchable
- **GIVEN** a vault holding `pages/diagram.png`, which is not under `assets/`
- **WHEN** the user searches for `diagram`
- **THEN** no asset result is shown for it, matching the Assets section, which lists only files under `assets/`

#### Scenario: A board is found by its name
- **GIVEN** a vault holding `boards/migration.excalidraw`
- **WHEN** the user searches for `migration`
- **THEN** the board appears in the results under the Boards group

#### Scenario: A board's contents are never matched
- **GIVEN** a vault holding `boards/migration.excalidraw` whose scene contains the text `queue`, and no page or board name containing `queue`
- **WHEN** the user searches for `queue`
- **THEN** no result is shown for the board, because the app does not read a board's scene for search

### Requirement: Results are grouped by kind with labels and match snippets
The dropdown SHALL render results in four groups — Pages, Journal, Boards, and Assets — each under a sticky group header, in that order. Each result row SHALL show a label: the page's title, the journal day's pretty date (e.g. "September 2, 2026"), the board's path inside `boards/`, or the asset's path inside `assets/`. A page or journal row SHALL show a short snippet of the matched content with the matched spans highlighted; a title-only match SHALL show the page's opening content as its snippet. A board row SHALL show its label and SHALL NOT show a snippet, because a board is not read for content. An asset row SHALL show its label and SHALL NOT show a snippet, because a file has no content to quote. Results in the dropdown SHALL be capped per group, with the see-all row (see "The dropdown offers a see-all handoff") indicating that further matches exist.

#### Scenario: Results are grouped by kind
- **WHEN** a query matches pages, journal days, boards, and assets
- **THEN** page matches render under the Pages header, journal matches under the Journal header, board matches under the Boards header, and asset matches under the Assets header, in that order, with the group headers pinned while the dropdown scrolls

#### Scenario: Journal days are labelled with their date
- **WHEN** a journal day matches
- **THEN** its row is labelled with the pretty date of the day, not a raw filename

#### Scenario: Boards are labelled with their path inside the boards folder
- **GIVEN** a vault holding `boards/2026/migration.excalidraw`
- **WHEN** the board matches
- **THEN** its row is labelled `2026/migration.excalidraw`

#### Scenario: A board row carries no snippet and no line
- **WHEN** a board matches
- **THEN** its row shows the label with no snippet and no `· line N`

#### Scenario: Assets are labelled with their path inside the assets folder
- **GIVEN** a vault holding `assets/2026/q3-report.pdf`
- **WHEN** the file matches
- **THEN** its row is labelled `2026/q3-report.pdf`, so two files with the same name in different folders read differently

#### Scenario: An asset row carries no snippet and no line
- **WHEN** an asset matches
- **THEN** its row shows the label with no snippet and no `· line N`

#### Scenario: Snippets highlight the match
- **WHEN** a page matches on content
- **THEN** its row shows a snippet of context around the match with the matched text visually highlighted

#### Scenario: Groups are capped with a note
- **WHEN** a group's matches exceed the per-group cap
- **THEN** the dropdown shows at most the capped number of rows for that group and the see-all row is shown so all matches remain reachable

### Requirement: Selecting a result opens the page
Clicking a page or journal-day result row, or pressing Enter on the active row, SHALL open that page in the editor pane exactly as selecting it in the sidebar would: the pane SHALL render the page's content and the opening SHALL close the dropdown while keeping the query text. Opening a journal day without a file SHALL behave like the calendar's day: a blank page whose file materializes on first write. Selecting a board result SHALL open the board in the main pane exactly as activating a Boards row would, and SHALL close the dropdown while keeping the query text. Selecting an asset result SHALL NOT navigate: it opens the file instead, as that requirement states.

#### Scenario: Clicking a result opens its page
- **WHEN** the user clicks a result row
- **THEN** the editor pane shows that page and the dropdown closes

#### Scenario: Opening keeps the query
- **WHEN** the user opens a page from the results
- **THEN** the dropdown closes and the query text remains in the input

#### Scenario: An uncreated journal day opens blank
- **WHEN** the user selects a journal-day result whose file does not exist yet
- **THEN** the editor pane opens a blank page for that day, creating the file only on first save

#### Scenario: A board result opens the board
- **WHEN** the user selects a board result
- **THEN** the board opens in the main pane, the dropdown closes, and the query text remains in the input

### Requirement: Search results view shows the full match set
The search results view SHALL display the complete match set for the active query without a per-group cap: every matching page, journal day, board, and asset, in the same order and grouping as the dropdown (Pages group first, then Journal, then Boards, then Assets), with sticky group headers, page-title, pretty-date, board-path, or asset-path labels, and match snippets with highlighted spans for pages and journal days, ordered by relevance. The view SHALL be transient UI: opening, browsing, and closing it SHALL NOT create, modify, or remove vault files. Closing the view SHALL return the app to the previously open page.

#### Scenario: The view lists all matches, uncapped
- **WHEN** a query matches more pages and journal days than the dropdown's per-group cap
- **THEN** the results view lists every matching page, journal day, board, and asset without truncation, in that group order

#### Scenario: Opening a result behaves like the dropdown
- **WHEN** the user opens a page result from the results view
- **THEN** the editor pane shows that page, the results view closes, and the query remains in the header input

#### Scenario: An uncreated journal day result opens blank
- **WHEN** the user opens a journal-day result from the results view whose file does not exist yet
- **THEN** the editor pane opens a blank page for that day, creating the file only on first save

#### Scenario: Results view is transient
- **WHEN** the user leaves the results view (opens a result or dismisses with Escape)
- **THEN** no file is created, modified, or removed in the vault, and the previously open page is shown again
