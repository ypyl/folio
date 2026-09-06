# search Specification

## Purpose

Full-text search over the open vault's notes: type in the header search box, get a results dropdown of matching pages and journal days, open one with a click or keyboard.

## Requirements

### Requirement: Search input deploys a results dropdown
When a vault folder is open, the header search input SHALL be functional: typing a query of at least 3 characters SHALL deploy a results dropdown immediately below the input, attached to its width. An empty or shorter query SHALL NOT deploy the dropdown. Clicking outside the search UI SHALL close the dropdown while keeping the query text, and refocusing the input or typing again SHALL re-deploy it. Displayed results SHALL be derived from the open vault's live index.

#### Scenario: Typing deploys the dropdown
- **WHEN** the user types a query of 3 or more characters into the header search input with a vault open
- **THEN** a results dropdown appears directly below the input, listing matches from the vault's index

#### Scenario: Short queries do not deploy
- **WHEN** the query is empty or shorter than 3 characters
- **THEN** no dropdown is shown

#### Scenario: Outside click closes but keeps the query
- **WHEN** the dropdown is open and the user clicks outside the search UI
- **THEN** the dropdown closes and the query text stays in the input

#### Scenario: Refocusing restores results
- **WHEN** the dropdown was closed by an outside click and the user refocuses the input with the query still present
- **THEN** the dropdown re-opens with the same results

### Requirement: Search matches titles and content across the vault
Search SHALL match every indexed page and journal day of the open vault. A page SHALL match when its title matches the query, and SHALL match when its content matches the query, with title matches ranking above content matches (title weighted higher). The query SHALL be split into terms; a page SHALL be returned only when every term of at least 3 characters matches it (AND semantics). Results SHALL be ordered by overall relevance (best match first). Unmaterialized pages — references to pages not yet created — SHALL NOT be searchable.

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

### Requirement: Results are grouped by kind with labels and match snippets
The dropdown SHALL render results in two groups — Pages and Journal — each under a sticky group header, in that order. Each result row SHALL show a label: the page's title, or the journal day's pretty date (e.g. "September 2, 2026"). Each row SHALL show a short snippet of the matched content with the matched spans highlighted; a title-only match SHALL show the page's opening content as its snippet. Results in the dropdown SHALL be capped per group, with the see-all row (see "The dropdown offers a see-all handoff") indicating that further matches exist.

#### Scenario: Results are grouped by kind
- **WHEN** a query matches both pages and journal days
- **THEN** page matches render under the Pages header and journal matches under the Journal header, with the group headers pinned while the dropdown scrolls

#### Scenario: Journal days are labelled with their date
- **WHEN** a journal day matches
- **THEN** its row is labelled with the pretty date of the day, not a raw filename

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
Clicking a result row, or pressing Enter on the active row, SHALL open that page in the editor pane exactly as selecting it in the sidebar would: the pane SHALL render the page's content and the opening SHALL close the dropdown while keeping the query text. Opening a journal day without a file SHALL behave like the calendar's day: a blank page whose file materializes on first write.

#### Scenario: Clicking a result opens its page
- **WHEN** the user clicks a result row
- **THEN** the editor pane shows that page and the dropdown closes

#### Scenario: Opening keeps the query
- **WHEN** the user opens a page from the results
- **THEN** the dropdown closes and the query text remains in the input

#### Scenario: An uncreated journal day opens blank
- **WHEN** the user selects a journal-day result whose file does not exist yet
- **THEN** the editor pane opens a blank page for that day, creating the file only on first save

### Requirement: Search results view shows the full match set
The search results view SHALL display the complete match set for the active query without a per-group cap: every matching page and journal day, in the same order and grouping as the dropdown (Pages group first, then Journal), with sticky group headers, page-title or pretty-date labels, and match snippets with highlighted spans, ordered by relevance. The view SHALL be transient UI: opening, browsing, and closing it SHALL NOT create, modify, or remove vault files. Closing the view SHALL return the app to the previously open page.

#### Scenario: The view lists all matches, uncapped
- **WHEN** a query matches more pages and journal days than the dropdown's per-group cap
- **THEN** the results view lists every matching page and journal day without truncation, pages before journal days

#### Scenario: Opening a result behaves like the dropdown
- **WHEN** the user opens a result from the results view
- **THEN** the editor pane shows that page, the results view closes, and the query remains in the header input

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
The keyboard SHALL control the search results view: Arrow Up and Arrow Down SHALL move the active row through the current page, Enter SHALL open the active row, and Escape SHALL close the results view and return to the previously open page. Editing the query in the header input SHALL update both surfaces from the same search run: the dropdown shows the top matches and the results view shows the full set.

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
The keyboard SHALL control search: Cmd/Ctrl+K SHALL focus the header search input and select its text; Arrow Up and Arrow Down SHALL move an active row through the results, with hovering a row moving the active row to it; Enter SHALL open the active row; Escape SHALL clear the query and close the dropdown.

#### Scenario: Cmd/Ctrl+K focuses search
- **WHEN** the user presses Cmd/Ctrl+K anywhere in the app
- **THEN** the search input gains focus with its text selected

#### Scenario: Arrows move the active row
- **WHEN** the dropdown is open and the user presses Arrow Down then Arrow Up
- **THEN** the active row moves down one result and back up, and hovering a row moves the active row to the hovered one

#### Scenario: Enter opens the active row
- **WHEN** the user presses Enter while a row is active
- **THEN** that row's page opens in the editor pane

#### Scenario: Escape clears the search
- **WHEN** the user presses Escape in the search input
- **THEN** the query is cleared and the dropdown closes

### Requirement: Search is scoped to the active vault
Search SHALL search only the open vault's index. Switching the active folder SHALL clear the query and close the dropdown. When no vault folder is open, the search input SHALL be disabled and SHALL NOT accept typing.

#### Scenario: Folder switch clears the search
- **WHEN** the user switches the active folder while a query is present
- **THEN** the query is cleared and the dropdown closes

#### Scenario: No vault disables search
- **WHEN** no vault folder is open
- **THEN** the search input is disabled and typing is not accepted

### Requirement: Search shows an empty state
When a query of at least 3 characters matches nothing, the dropdown SHALL show an empty state stating that no matches were found for the query.

#### Scenario: No matches
- **WHEN** a query matches no page or journal day
- **THEN** the dropdown shows an empty state naming the query as unmatched
