# search Specification

## MODIFIED Requirements

### Requirement: Results are grouped by kind with labels and match snippets

The dropdown SHALL render results in four groups — Pages, Journal, Boards, and Assets — each under a sticky group header, in that order. Each result row SHALL show a label: the page's title, the journal day's pretty date (e.g. "September 2, 2026"), the board's path inside `boards/`, or the asset's path inside `assets/`. A page or journal row SHALL show a snippet for **every place the query occurs in the page**, not only the first, with the matched spans highlighted: a run of nearby occurrences SHALL be shown as one snippet covering them, each snippet SHALL carry at most one line of context on each side of the occurrences it covers, and occurrences far apart SHALL be shown as separate snippets. A snippet after the first in a row SHALL be separated from the one above it by a divider, so two snippets do not read as one passage. The dropdown SHALL show at most two snippets per row, and when the page holds more places than that SHALL note the remainder as `+N more on this page`, where N is the number of occurrences not shown. A row's height SHALL NOT be bounded by a clamp that can hide an occurrence inside a shown snippet. A title-only match SHALL show the page's opening content as its snippet. A board row SHALL show its label and SHALL NOT show a snippet, because a board is not read for content. An asset row SHALL show its label and SHALL NOT show a snippet, because a file has no content to quote. Results in the dropdown SHALL be capped per group, with the see-all row (see "The dropdown offers a see-all handoff") indicating that further matches exist.

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

#### Scenario: Every place the query occurs is shown

- **GIVEN** a page whose content contains the query in three places, spread across the page
- **WHEN** the page appears in the dropdown
- **THEN** its row shows a snippet for each of the three places, each with the matched text highlighted, in document order

#### Scenario: Nearby occurrences share one snippet

- **GIVEN** a page whose content contains the query on two adjacent lines
- **WHEN** the page appears in the dropdown
- **THEN** its row shows one snippet covering both occurrences, with both highlighted, rather than two snippets repeating the same text

#### Scenario: A row past the snippet cap notes the remainder

- **GIVEN** a page whose content contains the query in five places, no two of them near each other
- **WHEN** the page appears in the dropdown
- **THEN** its row shows the first two snippets and a `+3 more on this page` note, counting the occurrences not shown

#### Scenario: A snippet never hides an occurrence it covers

- **GIVEN** a page whose query occurrences sit on consecutive lines
- **WHEN** the page appears in the dropdown
- **THEN** the snippet covering them shows every one of those occurrences highlighted, none cut off

#### Scenario: A single-occurrence page shows one snippet

- **WHEN** a page's content contains the query exactly once
- **THEN** its row shows that one occurrence's snippet with no `+N more on this page` note

#### Scenario: Separate snippets are visibly separated

- **GIVEN** a page whose content contains the query in two places, far enough apart to be separate snippets
- **WHEN** the page appears in the dropdown
- **THEN** its row shows the two snippets divided from each other, not run together as one passage

### Requirement: Search results view shows the full match set

The search results view SHALL display the complete match set for the active query without a per-group cap: every matching page, journal day, board, and asset, in the same order and grouping as the dropdown (Pages group first, then Journal, then Boards, then Assets), with sticky group headers, page-title, pretty-date, board-path, or asset-path labels, and, for pages and journal days, the same per-place snippets with highlighted spans that the dropdown shows, ordered by relevance. Each snippet after the first in a row SHALL be separated from the one above it by a divider, as in the dropdown. The view SHALL show at most five snippets per row — more than the dropdown's two, because the view is the survey surface — and SHALL note any remainder as `+N more on this page` counting the occurrences not shown. The view SHALL be transient UI: opening, browsing, and closing it SHALL NOT create, modify, or remove vault files. Closing the view SHALL return the app to the previously open page.

#### Scenario: The view lists all matches, uncapped

- **WHEN** a query matches more pages and journal days than the dropdown's per-group cap
- **THEN** the results view lists every matching page, journal day, board, and asset without truncation, in that group order

#### Scenario: The view shows more places per row than the dropdown

- **GIVEN** a page whose content contains the query in four places, no two of them near each other
- **WHEN** the page's row appears in the results view
- **THEN** the row shows all four snippets, while the same page's dropdown row shows two and a `+2 more on this page` note

#### Scenario: The view notes the remainder past its cap

- **GIVEN** a page whose content contains the query in eight places, no two of them near each other
- **WHEN** the page's row appears in the results view
- **THEN** the row shows the first five snippets and a `+3 more on this page` note

#### Scenario: Opening a result behaves like the dropdown

- **WHEN** the user opens a page result from the results view
- **THEN** the editor pane shows that page, the results view closes, and the spotlight keeps the query so reopening it restores the matches

#### Scenario: An uncreated journal day result opens blank

- **WHEN** the user opens a journal-day result from the results view whose file does not exist yet
- **THEN** the editor pane opens a blank page for that day, creating the file only on first save

#### Scenario: Results view is transient

- **WHEN** the user leaves the results view (opens a result or dismisses with Escape)
- **THEN** no file is created, modified, or removed in the vault, and the previously open page is shown again

#### Scenario: The view separates a row's snippets

- **GIVEN** a page whose content contains the query in two places, far enough apart to be separate snippets
- **WHEN** the page's row appears in the results view
- **THEN** the row's two snippets are divided from each other, not run together as one passage
