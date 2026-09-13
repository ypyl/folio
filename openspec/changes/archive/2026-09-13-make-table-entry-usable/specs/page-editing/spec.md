## ADDED Requirements

### Requirement: A click in a table cell places the caret

A pointer press on a table cell SHALL place the caret in that cell, at the text position nearest the pointer, on the first click. It SHALL NOT select the cell, and text typed after that click SHALL be inserted at the caret rather than replacing the cell's contents, so a click can never destroy text the cell already holds. A press on the cell the caret is already in SHALL behave as a press in ordinary text. Selecting a row or a column SHALL remain the work of its handle: pressing a row or a column handle SHALL still select that row or column, and the alignment and delete controls SHALL still act on that selection. Every other table gesture SHALL stay as it is: `Tab` and `Shift-Tab` move between cells, `Enter` leaves the table, and the structural chords add rows and columns.

#### Scenario: A click in a filled cell puts the caret where it was clicked

- **GIVEN** an open page with a table cell whose text reads `ada`
- **WHEN** the user clicks between the `a` and the `d` and types `X`
- **THEN** the cell reads `aXd`, the click having neither selected the cell nor replaced its text

#### Scenario: A click on an empty cell takes typing

- **GIVEN** an open page holding a table with empty cells
- **WHEN** the user clicks the second cell once and types `role`
- **THEN** that cell holds `role`, the other cells are unchanged, and the saved Markdown holds the table with that cell's text

#### Scenario: A click never replaces what a cell holds

- **GIVEN** an open page with a table cell whose text reads `Grace Hopper`
- **WHEN** the user clicks anywhere in that cell once and then types a single character
- **THEN** the cell's original text is still there with that character inserted at the caret

#### Scenario: The handles still select a row or a column

- **GIVEN** an open page holding a table
- **WHEN** the user presses the handle of one column and activates the reference's align-right control for it
- **THEN** that column is selected, the control applies to it, and the saved Markdown carries the alignment for that column

#### Scenario: The keyboard path through a table is unchanged

- **GIVEN** an open page with the caret in a table cell
- **WHEN** the user presses `Tab`, then `Shift-Tab`, then `Enter`
- **THEN** the caret moves to the next cell, back to the previous cell, and finally out of the table

### Requirement: An empty table cell shows a boundary

A table cell that holds no text SHALL show a hairline on its trailing edge, so a table whose cells are empty shows which cells it has and where a click will land. The hairline SHALL be presentation only: it SHALL NOT appear in the page's Markdown, SHALL NOT change any cell's text, SHALL NOT move a cell's text or change a column's width, and SHALL be gone from a cell as soon as that cell holds text. A table whose cells all hold text SHALL render as it does today, with row rules and no vertical rules, and the boundary SHALL cost nothing on the keystroke path.

#### Scenario: A table with empty cells shows where its cells are

- **GIVEN** the caret in an empty paragraph
- **WHEN** the user types `|2x3|` and a space
- **THEN** the page holds a table of that size whose cells are separated by a visible hairline, and the caret sits in the first cell

#### Scenario: The boundary goes away as a cell fills

- **GIVEN** an open page holding a table with empty cells
- **WHEN** the user types into one of them
- **THEN** that cell no longer shows the hairline, its empty neighbours still show theirs, and no cell moved

#### Scenario: A filled table keeps its resting look

- **GIVEN** a page whose table has text in every cell
- **WHEN** the page renders
- **THEN** the table shows row rules and no vertical rules, exactly as it does today

#### Scenario: The boundary never reaches the file

- **GIVEN** a page holding a table with empty cells
- **WHEN** the page is saved
- **THEN** the Markdown holds the table in its canonical form with `<br />` for the empty cells and no character representing the hairline, and reopening the page shows the same table
