## ADDED Requirements

### Requirement: A Markdown table is a table in the editor

A GFM pipe table in a page SHALL render as a table in the editor: a header row, body rows, and cells edited in place as ordinary text. A reference written in a cell SHALL render as a badge and SHALL activate like any other reference. The column alignment written in the table's delimiter row SHALL be preserved as the page is edited and SHALL be settable from the editor. The saved Markdown SHALL remain a pipe table, so a table in the file is a table on screen and a table again after the page is reloaded. Table cells SHALL be written in the app's canonical form — padded, with the delimiter row in its short form — so a hand-written table adopts that form the first time the page is saved. A cell the table model holds no text in SHALL be written as `<br />`, and a table that arrives with a header row and no body rows SHALL be given one empty body row, because the editor's table has no cell-less row to hold it. Tables SHALL be created by typing `|column-count x row-count|` followed by a space, by a keyboard chord, and by pasting Markdown table text; rows and columns SHALL be added and removed from the editor; and the caret SHALL move between cells with `Tab` and `Shift-Tab`, while `Enter` SHALL leave the table. No other Markdown construct SHALL change: a bare URL, a struck run, a task-list marker, and footnote syntax SHALL parse and serialize exactly as they do without tables, and no autolink, task-list, footnote, or strikethrough markup SHALL be created. Rendering a table SHALL NOT add work to the keystroke path that grows with the document: a cell is an ordinary block, the editor's decoration, draft, and line-number work SHALL keep its existing bound, and a table's own controls SHALL re-render only for the table they belong to.

#### Scenario: A pipe table opens as a table

- **GIVEN** a page whose Markdown holds a pipe table with a header row and body rows
- **WHEN** the page opens
- **THEN** the editor shows a table with a header row and those body rows, and no cell shows its pipe characters

#### Scenario: A table survives save and reopen

- **GIVEN** an open page holding a table
- **WHEN** the user edits a cell, the save completes, and the page is closed and opened again
- **THEN** the saved Markdown is still a pipe table with the same rows, columns, and cell text, and the reopened page shows that table

#### Scenario: A cell is edited in place, and a reference in it still opens

- **GIVEN** an open page whose table holds `#Inbox` in a cell
- **WHEN** the user edits the cell's text and clicks the `#Inbox` badge
- **THEN** the edit is written to the page's Markdown and the `Inbox` page opens

#### Scenario: Column alignment is kept and can be set

- **GIVEN** a page whose table writes a centered and a right-aligned column in its delimiter row
- **WHEN** the page renders, and the user sets another column's alignment from the editor
- **THEN** each column keeps the alignment it had, and the saved Markdown carries the new alignment for the changed column

#### Scenario: A hand-written table adopts the canonical form on save

- **GIVEN** a page whose file holds a table with short cells and long delimiter dashes
- **WHEN** the user edits the page and the save completes
- **THEN** the saved table has padded cells and a short delimiter row, and still holds the same rows, columns, and text

#### Scenario: An empty cell is written as a break

- **GIVEN** an open page with a table whose body row has an empty cell
- **WHEN** the page saves
- **THEN** that cell is written as `<br />`, and the same cell with text written into it holds that text instead

#### Scenario: A header-only table gains an empty body row

- **GIVEN** a file whose table has a header row and no body rows
- **WHEN** the page is opened and saved
- **THEN** the saved table has one empty body row, and reopening the page shows the header row and that empty row

#### Scenario: Tables are created by typing, by chord, and by paste

- **WHEN** the user types `|4x3|` followed by a space, or activates the insert-table control in the keyboard-shortcuts reference, or pastes Markdown table text into a page
- **THEN** each produces a table in the open page: the typed and chord gestures a table with the columns and rows they ask for, the paste a table with the pasted rows and columns, and no pipe characters are shown in any cell

#### Scenario: Rows and columns are added and removed

- **GIVEN** an open page holding a table with the caret inside it
- **WHEN** the user adds a row, adds a column, and deletes a row through the editor's table controls or the bound chords
- **THEN** the table gains and loses exactly those rows and columns, and the saved Markdown matches the table on screen

#### Scenario: Tab moves between cells and Enter leaves the table

- **GIVEN** an open page with the caret in a table cell
- **WHEN** the user presses `Tab`, then `Shift-Tab`, then `Enter`
- **THEN** the caret moves to the next cell, back to the previous cell, and finally out of the table to the block that follows it

#### Scenario: Only tables come in

- **GIVEN** a page holding a bare `https://example.com`, a `~~struck~~` run, a `- [x] done` line, and footnote syntax
- **WHEN** the page is opened, edited, and saved
- **THEN** the URL keeps its characters with no link mark created, the struck run keeps its tildes and its decoration, the `[x]` line keeps its characters with no checkbox, and the footnote syntax is not turned into a footnote

#### Scenario: A table is one block to the gutter and to search

- **GIVEN** an open page with a table between two paragraphs
- **WHEN** the gutter numbers the page's blocks, and a search result falls on the table's first line
- **THEN** the table is numbered as a single block starting on its first line, and a result on that line anchors to that block

#### Scenario: Typing in a table stays bounded by the table

- **GIVEN** an open page with a table near a long document
- **WHEN** the user types inside a table cell
- **THEN** the work per keystroke does not grow with the document's size: the cell, the block it belongs to, and that table are what is touched, and the editor's existing per-keystroke bounds are unchanged

## MODIFIED Requirements

### Requirement: The space below the last block belongs to the page
The editor's editable surface SHALL fill the pane's height, so that the empty space below a page's last block is part of the document rather than dead background. A click in that space SHALL place the caret at the end of the document, and the next keystroke SHALL continue the page there. The click SHALL NOT create a block, SHALL NOT change the document's Markdown, and SHALL NOT open a reference or any other target. On a page whose content is taller than the pane, the surface SHALL grow with the content as it does now, so nothing about scrolling changes. The surface SHALL NOT grow upward: the first block's start line, the document's readable column width, the line-number gutter, and an empty page's placeholder SHALL be unaffected. A page whose last block is a table SHALL keep a continuation paragraph after it, exactly as a page ending in a code block does, so a click below the table places the caret in that paragraph rather than inside a cell; that paragraph SHALL NOT be written to the page's file.

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
