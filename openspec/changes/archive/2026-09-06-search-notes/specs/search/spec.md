## Purpose

Full-text search over the open vault's notes: type in the header search box, get a results dropdown of matching pages and journal days, open one with a click or keyboard.

## ADDED Requirements

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
The dropdown SHALL render results in two groups — Pages and Journal — each under a sticky group header, in that order. Each result row SHALL show a label: the page's title, or the journal day's pretty date (e.g. "September 2, 2026"). Each row SHALL show a short snippet of the matched content with the matched spans highlighted; a title-only match SHALL show the page's opening content as its snippet. Results SHALL be capped per group, with a note when the cap truncates a group.

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
- **THEN** the group shows at most the capped number of rows plus a note stating the limit

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