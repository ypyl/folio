## ADDED Requirements

### Requirement: The keyboard-shortcuts reference covers table editing

The keyboard-shortcuts reference SHALL cover editing a table: `Mod-Alt-t` (Cmd/Ctrl+Alt+T) to insert a table, `Mod-Alt-Enter` (Cmd/Ctrl+Alt+Enter) to add a row below the caret's row, `Mod-Alt-Shift-Enter` (Cmd/Ctrl+Alt+Shift+Enter) to add a column to the right of the caret's column, `Tab` and `Shift-Tab` to move to the next and previous cell, and `Enter` to leave the table. Each SHALL be listed as a readable label plus its key combination rendered as key tokens, matching the existing rows, and each label SHALL name the action. Every one of these rows SHALL be a control that applies its combination, as the reference's other editor rows are. Where a chord means different things in different contexts, the reference SHALL list the chord under each action rather than hiding one, so `Tab`, `Shift-Tab`, and `Enter` appear both for their text behavior and for their behavior inside a table. A row SHALL be listed only because the app provides that behavior.

#### Scenario: The reference lists how to create and extend a table

- **WHEN** the user opens the keyboard-shortcuts section of a vault with a page open
- **THEN** it lists inserting a table, adding a table row, adding a table column, moving to the next cell, moving to the previous cell, and leaving a table, each with its key combination rendered as key tokens and each row on one line

#### Scenario: A chord with two meanings is listed twice

- **WHEN** the user reads the reference's list
- **THEN** `Tab` and `Shift-Tab` appear both as moving between list-item levels and as moving between table cells, and `Enter` appears as leaving a table

#### Scenario: Applying the insert-table control creates a table

- **GIVEN** an open page with the caret in the editor
- **WHEN** the user activates the insert-table row's key combination
- **THEN** the page gains a table at the caret, exactly as pressing the combination would produce, and the page's saved Markdown holds a pipe table
