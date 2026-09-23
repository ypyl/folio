## ADDED Requirements

### Requirement: Deleting a table row or column is reachable without a handle

While the caret is inside a table, the editor SHALL show a control strip attached to that table holding a control that deletes the caret's row and a control that deletes the caret's column. Each control SHALL carry a name that states its action, SHALL be visible without the user first finding or hovering a row or column handle, and activating it SHALL remove exactly the caret's row or column and leave a caret rather than a selection, so the next keystroke types. The strip SHALL be hidden whenever the caret is not in a table, SHALL be presentation only — it SHALL NOT appear in the page's Markdown and SHALL NOT change the table's rows, columns, or cell text until one of its controls is activated — and SHALL NOT change what a table's row and column handles do, which SHALL keep selecting a row or column and opening the alignment and delete controls as they do today. The keyboard path SHALL remain the bound chords `Mod-Alt-d` and `Mod-Alt-Shift-d`, unchanged. Showing or hiding the strip SHALL be driven only by a change to the table the caret is in, so work per keystroke SHALL NOT grow with the document or the table and a keystroke inside the same table SHALL NOT rebuild the strip.

#### Scenario: The strip appears while editing a table

- **GIVEN** an open page with a table
- **WHEN** the user places the caret in one of its cells
- **THEN** the table shows a control that deletes the caret's row and a control that deletes the caret's column, without the user hovering a handle

#### Scenario: Activating Delete row removes that row

- **GIVEN** an open page holding a table with the caret in a body row
- **WHEN** the user activates the delete-row control
- **THEN** that row is gone, the other rows keep their order and text, and the saved Markdown matches the table on screen

#### Scenario: Activating Delete column removes that column

- **GIVEN** an open page holding a table with the caret in a column
- **WHEN** the user activates the delete-column control
- **THEN** that column is gone from every row, the other columns keep their order and text, and the saved Markdown matches the table on screen

#### Scenario: Deleting a row or column leaves a caret

- **GIVEN** an open page holding a table with the caret in a body cell
- **WHEN** the user activates the delete-row control and then types a character
- **THEN** the character is inserted at a caret in the table rather than replacing a selected cell

#### Scenario: The strip is gone outside a table

- **GIVEN** an open page holding a table and a paragraph
- **WHEN** the caret moves from the table to the paragraph
- **THEN** the table shows no delete controls

#### Scenario: The strip is presentation only

- **GIVEN** an open page holding a table with the caret in a cell
- **WHEN** the page saves with no control activated
- **THEN** the saved Markdown holds the same table as before and no trace of the controls

#### Scenario: The handles and chords are unchanged

- **GIVEN** an open page holding a table with the caret in a cell
- **WHEN** the user presses the handle of one column, and separately presses `Mod-Alt-d` and `Mod-Alt-Shift-d`
- **THEN** the handle still selects that column and opens its controls, and each chord still deletes the caret's row or column

#### Scenario: Showing the strip stays off the keystroke path

- **GIVEN** an open page with a table near a long document
- **WHEN** the user types inside a cell
- **THEN** showing the strip adds no work that grows with the document or the table, and the editor's existing per-keystroke bounds are unchanged
