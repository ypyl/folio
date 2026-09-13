## ADDED Requirements

### Requirement: A table that begins a page keeps room for its controls

A page whose first block is a table SHALL give that table room above its first row, so that the table's column handle — which the editor places above the first row — is drawn inside the pane and can be pressed. The handle SHALL then select its column and open the column's alignment and delete controls, as it does anywhere else. The room SHALL be the table block's own top margin, it SHALL NOT be page content (the Markdown SHALL NOT change, and the file SHALL gain nothing), it SHALL apply only to a table that is the page's first block, and the rest of the page's geometry SHALL be unchanged: the pane's padding, the shared start line of every other first block, the document's width, and the line-number gutter's placement. A page whose first block is a table SHALL still number that table once, at its first line.

#### Scenario: A table at the top of a page can be controlled

- **GIVEN** a page whose content begins with a table
- **WHEN** the page renders and the user points at one of its columns
- **THEN** the column handle is drawn inside the editor pane rather than above its edge, and pressing it selects that column and opens its controls

#### Scenario: The room is space, not content

- **GIVEN** a page whose content begins with a table
- **WHEN** the page is saved
- **THEN** the Markdown holds the table exactly as it did, with no character representing the room, and the page is not written at all if nothing was edited

#### Scenario: Only a leading table gains the room

- **GIVEN** one page whose first block is a paragraph or a heading, and another whose first block is a table followed by text
- **WHEN** both render
- **THEN** the first block of the first page starts at the pane's top padding, the table of the second starts where it did before this change, and the pane's padding is unchanged for both

#### Scenario: The gutter still numbers the table at its first line

- **GIVEN** a page whose content begins with a table
- **WHEN** the page renders
- **THEN** the table's line number sits on the table's first line, not on the space above it

## MODIFIED Requirements

### Requirement: The space below the last block belongs to the page
The editor's editable surface SHALL fill the pane's height, so that the empty space below a page's last block is part of the document rather than dead background. A click in that space SHALL place the caret at the end of the document, and the next keystroke SHALL continue the page there. The click SHALL NOT create a block, SHALL NOT change the document's Markdown, and SHALL NOT open a reference or any other target. On a page whose content is taller than the pane, the surface SHALL grow with the content as it does now, so nothing about scrolling changes. The surface SHALL NOT grow upward: the first block's start line, the document's readable column width, the line-number gutter, and an empty page's placeholder SHALL be unaffected, except that a table which begins the page SHALL carry the margin its column handle needs to stay inside the pane ("A table that begins a page keeps room for its controls"). A page whose last block is a table SHALL keep a continuation paragraph after it, exactly as a page ending in a code block does, so a click below the table places the caret in that paragraph rather than inside a cell; that paragraph SHALL NOT be written to the page's file.

#### Scenario: Clicking under the last block continues the page
- **GIVEN** an open page whose content ends well above the pane's bottom
- **WHEN** the user clicks in the empty space below the last block and types
- **THEN** the typed text lands at the end of the page, and the page's Markdown gains only that text

#### Scenario: Clicking beside a short last line continues the page
- **GIVEN** a page whose last block is short — a heading, a list item, or a lone reference
- **WHEN** the user clicks the empty space to the right of that line
- **THEN** the caret is placed in that block at the end of its text, and no reference or other target is activated

#### Scenario: The document's start line and width do not move
- **GIVEN** a page open before and after this surface grows
- **WHEN** the page renders
- **THEN** the first block starts on the same line at the same x, the gutter numbers are unchanged, and the prose column keeps its width

#### Scenario: Content taller than the pane scrolls as before
- **GIVEN** a page whose content exceeds the pane's height
- **WHEN** the user scrolls the pane
- **THEN** the page scrolls exactly as it did, with the surface extending to the content's end and no extra empty area inserted above the document

#### Scenario: Clicking under a table continues the page and not a cell
- **GIVEN** an open page whose last block is a table
- **WHEN** the user clicks in the empty space below the table and types
- **THEN** the typed text lands after the table as a new block at the end of the page, no table cell changes, and the page's Markdown holds the table and that new block
