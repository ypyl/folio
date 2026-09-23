## MODIFIED Requirements

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

### Requirement: Search results report the match's line

A search result row SHALL report the canonical block-anchored start line of the page's **first** text match, rendered as `· line N` beside the result's label, in both the spotlight's dropdown and the full search results view. A result whose match occurs only in the page title — no text match — SHALL show no line number. The reported number SHALL be computed with the same block-start rule the editor gutter uses, so a result's line exists in the gutter when the page opens.

#### Scenario: A text match shows its line

- **WHEN** the user searches for a term that appears in a page's content
- **THEN** the result row shows the page label followed by `· line N`, where N is the block-anchored start line of the first match

#### Scenario: A title-only match shows no line

- **WHEN** the user searches for a term that matches only a page's title
- **THEN** the result row shows the label without any line number

#### Scenario: Multiple matches report the first

- **WHEN** a page contains several matches across different blocks
- **THEN** the row reports the block-anchored line of the first match only

#### Scenario: The dropdown and results view agree

- **WHEN** the user moves from the spotlight's dropdown to the full results view on the same query
- **THEN** each row shows the same `· line N` for the same page

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
