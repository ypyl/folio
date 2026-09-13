## ADDED Requirements

### Requirement: Aligning and deleting a table row or column works from the caret

With the caret in a table cell, the app SHALL provide a keyboard path for the operations that otherwise exist only on a table's row and column handles: aligning the caret's column to the left, to the center, and to the right, deleting the caret's row, and deleting the caret's column. Aligning SHALL apply to every cell of the caret's column, not only to the cell the caret is in, and SHALL be the same change the column handle's alignment control makes. Deleting SHALL remove that row or that column and nothing else. Every one of these SHALL leave a caret in the table rather than a selection, so that the next keystroke types instead of replacing what the chord just changed. A chord pressed with the caret outside a table SHALL do nothing and SHALL leave the document unchanged. Applying an alignment a column already has SHALL report that nothing was applied rather than claiming a change. The row and column handles and their controls SHALL keep working as they do now, and each of these chords SHALL be listed in the keyboard-shortcuts reference.

#### Scenario: A column is aligned from the caret

- **GIVEN** an open page with the caret in a table cell
- **WHEN** the user activates the align-center chord
- **THEN** every cell of that column is centered, the saved Markdown shows the column's alignment in its delimiter row, and no other column changes

#### Scenario: The caret is left in the cell

- **GIVEN** a table whose column was just aligned by chord
- **WHEN** the user types a character
- **THEN** it is inserted into the cell the caret was in, and the column's cells are not replaced

#### Scenario: A row and a column are deleted from the caret

- **GIVEN** an open page with the caret in a table cell
- **WHEN** the user activates the delete-row chord, and later the delete-column chord with the caret in a cell
- **THEN** the caret's row is gone, then the caret's column is gone, and the saved Markdown holds exactly the table that remains

#### Scenario: Outside a table nothing happens

- **GIVEN** an open page with the caret in a paragraph outside every table
- **WHEN** the user activates any of these chords
- **THEN** the document is unchanged and the page is not marked as edited by it

#### Scenario: The handles still do the same things

- **GIVEN** an open page holding a table
- **WHEN** the user presses a column handle and its alignment and delete controls
- **THEN** the column is selected and the controls act on it exactly as they did before
