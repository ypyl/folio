# search Specification

## Purpose

Full-text search over the open vault's notes: open the spotlight with a keyboard shortcut or the folder rail's search trigger, type a query, get grouped matches across pages, journal days, boards, and assets, and open one with a click or the keyboard.

## Requirements

### Requirement: Search input deploys a results dropdown
Search SHALL be presented as a modal spotlight overlay that is not part of the shell layout, and its input SHALL deploy a results dropdown immediately below it, attached to its width. The spotlight SHALL be opened by `Ctrl/Cmd+P`, by `Ctrl/Cmd+K`, or by the folder rail's search trigger (the ui-shell capability), and it SHALL contain the search input as its first element. When a vault folder is open, typing a query of at least 3 characters into the input SHALL deploy the dropdown. An empty or shorter query SHALL NOT deploy the dropdown. Clicking outside the spotlight SHALL close it while keeping the query text, and reopening the spotlight (or typing again) SHALL re-deploy the dropdown from the kept query, so the query survives a close until it is cleared. Displayed results SHALL be derived from the open vault's live index. Opening or closing the spotlight SHALL NOT create, modify, or remove any vault file, and SHALL NOT change the open page, the history trail, or the sidebar's active marking.

#### Scenario: Typing deploys the dropdown
- **WHEN** the user types a query of 3 or more characters into the spotlight's search input with a vault open
- **THEN** a results dropdown appears directly below the input, listing matches from the vault's index

#### Scenario: Short queries do not deploy
- **WHEN** the query is empty or shorter than 3 characters
- **THEN** no dropdown is shown

#### Scenario: Outside click closes but keeps the query
- **WHEN** the dropdown is open and the user clicks outside the spotlight
- **THEN** the spotlight closes and the query text is kept

#### Scenario: Refocusing restores results
- **WHEN** the spotlight was closed by an outside click and the user reopens it with the query still present
- **THEN** the dropdown re-opens with the same results

#### Scenario: The keyboard opens the spotlight
- **WHEN** the user presses `Ctrl/Cmd+P` or `Ctrl/Cmd+K` anywhere in the app with a vault open
- **THEN** the spotlight opens with its search input focused and its text selected

#### Scenario: The rail trigger opens the spotlight
- **WHEN** the user activates the folder rail's search trigger with a vault open
- **THEN** the spotlight opens with its search input focused

#### Scenario: Opening the spotlight changes nothing else
- **GIVEN** a page is open with unsaved edits
- **WHEN** the user opens the spotlight and then closes it without selecting a result
- **THEN** the open page, the editor's content, the history trail, the sidebar's active marking, and every vault file are unchanged
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
### Requirement: The dropdown offers a see-all handoff to a search results view
The search dropdown SHALL show a pinned row offering to open a search results view whenever the active query has at least one match. Activating the row SHALL open the search results view for the query. The row SHALL remain available after a result has been opened (the query is kept), so returning to the results from the editor is possible without retyping. The previous passive "Showing up to 20 matches per section." note SHALL NOT be shown.

#### Scenario: See-all row is offered when a query matches
- **WHEN** the user runs a query that has matching pages or journal days
- **THEN** the dropdown shows a pinned row stating the total match count and offering to open the search results view

#### Scenario: See-all row returns to results after opening a result
- **WHEN** the user opened a result, the dropdown is closed with the query kept, and the user re-deploys the dropdown and activates the see-all row
- **THEN** the search results view reopens for the same query
### Requirement: Selecting a result opens the page

Clicking a page or journal-day result row, or pressing Enter on the active row, SHALL open that page in the editor pane exactly as selecting it in the sidebar would: the pane SHALL render the page's content and the opening SHALL close the dropdown while keeping the query text. When the result's first text match falls in a top-level block, the opening SHALL also scroll that block into view and mark it on the page, as page-editing's "The editor locates and marks a block" states; a result with no text match — a title-only match, an asset, or a board — SHALL open without a mark. Opening a journal day without a file SHALL behave like the calendar's day: a blank page whose file materializes on first write. Selecting a board result SHALL open the board in the main pane exactly as activating a Boards row would, and SHALL close the dropdown while keeping the query text. Selecting an asset result SHALL NOT navigate: it opens the file instead, as that requirement states.

#### Scenario: Clicking a result opens its page

- **WHEN** the user clicks a result row
- **THEN** the editor pane shows that page and the dropdown closes

#### Scenario: A page result opens at its match

- **GIVEN** a page whose match falls in a block below its opening lines
- **WHEN** the user opens that result
- **THEN** the page opens with the matched block scrolled into view and marked

#### Scenario: A title-only match opens unmarked

- **WHEN** the user opens a result whose match is only in the page's title
- **THEN** the page opens at the top with no marked block

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
- **THEN** the editor pane shows that page, the results view closes, and the spotlight keeps the query so reopening it restores the matches

#### Scenario: An uncreated journal day result opens blank
- **WHEN** the user opens a journal-day result from the results view whose file does not exist yet
- **THEN** the editor pane opens a blank page for that day, creating the file only on first save

#### Scenario: Results view is transient
- **WHEN** the user leaves the results view (opens a result or dismisses with Escape)
- **THEN** no file is created, modified, or removed in the vault, and the previously open page is shown again
### Requirement: Search results view paginates its match list
The search results view SHALL paginate the match list when it exceeds the page size, showing at most one page of results at a time with controls to move to the previous and next pages. The view SHALL show the total match count and which portion of the list is currently displayed. Navigating to another page SHALL reset the view's scroll to the top.

#### Scenario: Matches beyond one page are reachable
- **WHEN** the match set exceeds the page size and the user advances to the next page
- **THEN** the view shows the next slice of matches, the displayed range updates, and the view scrolls to the top

#### Scenario: A short match set has no pager
- **WHEN** the match set fits within the page size
- **THEN** the view shows the full list with no pagination controls
### Requirement: Search results view responds to the keyboard
The keyboard SHALL control the search results view: Arrow Up and Arrow Down SHALL move the active row through the current page, Enter SHALL open the active row, and Escape SHALL close the results view and return to the previously open page. Editing the query in the spotlight's input SHALL update both surfaces from the same search run: the dropdown shows the top matches and the results view shows the full set.

#### Scenario: Arrows and Enter navigate the results view
- **WHEN** the results view is open and the user presses Arrow Down and Enter
- **THEN** the active row moves to the next result and Enter opens that result in the editor pane

#### Scenario: Escape closes the results view
- **WHEN** the results view is open and the user presses Escape
- **THEN** the results view closes and the previously open page is shown again

#### Scenario: A query with no matches closes the results view
- **WHEN** the user edits the query so that it has no matches while the results view is open
- **THEN** the results view closes, the previously open page is shown, and the dropdown shows its empty state for the query
### Requirement: Search responds to keyboard shortcuts
The keyboard SHALL control search: `Ctrl/Cmd+P` and `Ctrl/Cmd+K` SHALL open the spotlight with its search input focused and its text selected; Arrow Up and Arrow Down SHALL move an active row through the results, with hovering a row moving the active row to it; Enter SHALL open the active row; Escape SHALL clear the query and close the spotlight.

#### Scenario: Cmd/Ctrl+K focuses search
- **WHEN** the user presses `Ctrl/Cmd+K`, or `Ctrl/Cmd+P`, anywhere in the app with a vault open
- **THEN** the spotlight opens and its search input gains focus with its text selected

#### Scenario: Arrows move the active row
- **WHEN** the dropdown is open and the user presses Arrow Down then Arrow Up
- **THEN** the active row moves down one result and back up, and hovering a row moves the active row to the hovered one

#### Scenario: Enter opens the active row
- **WHEN** the user presses Enter while a row is active
- **THEN** that row's page opens in the editor pane

#### Scenario: Escape clears the search
- **WHEN** the user presses Escape in the spotlight
- **THEN** the query is cleared and the spotlight closes
### Requirement: Search is scoped to the active vault
Search SHALL search only the open vault's index. Switching the active folder SHALL clear the query and close the spotlight. When no vault folder is open — or the active folder's index is still building — the folder rail's search trigger SHALL be disabled and the spotlight SHALL NOT open.

#### Scenario: Folder switch clears the search
- **WHEN** the user switches the active folder while a query is present
- **THEN** the query is cleared and the spotlight closes

#### Scenario: No vault disables search
- **WHEN** no vault folder is open, or the active folder's index is still building
- **THEN** the folder rail's search trigger is disabled and the spotlight does not open
### Requirement: Search shows an empty state
When a query of at least 3 characters matches nothing, the dropdown SHALL show an empty state stating that no matches were found for the query.

#### Scenario: No matches
- **WHEN** a query matches no page, journal day, or asset
- **THEN** the dropdown shows an empty state naming the query as unmatched
### Requirement: Selecting an asset result opens the file
Selecting an asset result — clicking its row or pressing Enter on the active row, in the spotlight's dropdown or in the results view — SHALL open the file exactly as activating an asset row in the sidebar does (ADR-0021): a type the browser displays SHALL be shown in a new window, and every other type SHALL be downloaded for the operating system's registered application. The path SHALL be used as the file's literal name, without percent-decoding.

The gesture SHALL leave the app otherwise unchanged: the open page SHALL stay open, the sidebar's active marking SHALL not move, the history trail SHALL gain no entry, and no vault file's bytes SHALL change. The spotlight SHALL close while keeping the query text, and the results view SHALL stay open, because nothing navigated and there is no page to return to. A file the vault can no longer read — deleted since the index was built — SHALL open nothing.

#### Scenario: An asset result opens the file and does not navigate
- **GIVEN** an open page, with a query matching `assets/q3-report.pdf`
- **WHEN** the user selects that result in the spotlight
- **THEN** the file opens, the spotlight closes, the query text remains, and the same page is still open behind it

#### Scenario: An asset result selected from the full view keeps the view
- **GIVEN** the search results view open on a query matching an asset
- **WHEN** the user selects that asset's row
- **THEN** the file opens and the results view stays open on the same query

#### Scenario: Opening an asset result leaves the session alone
- **GIVEN** an open page with unsaved edits, and a query matching a vault file
- **WHEN** the user selects the file's result
- **THEN** no entry is added to the history trail, the sidebar's active marking does not move, and Back and Forward step where they did before

#### Scenario: An unreadable asset opens nothing
- **GIVEN** a result for a file the index listed but that was since deleted from the folder
- **WHEN** the user selects it
- **THEN** nothing opens and the app remains as it was
