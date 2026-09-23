## REMOVED Requirements

### Requirement: Search results report the match's line

**Reason**: The `· line N` label reported a block-anchored line so the reader could find it in the editor's line-number rail, but it never took the reader there and the rail's numbers are going away. The match is now marked on the page when its result is opened.

**Migration**: Opening a result now scrolls to and marks the matched block ("Selecting a result opens the page"); the row keeps its label and highlighted snippet and shows no line number.

## MODIFIED Requirements

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
