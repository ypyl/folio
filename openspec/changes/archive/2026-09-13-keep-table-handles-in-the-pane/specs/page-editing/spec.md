## ADDED Requirements

### Requirement: A table's handles stay inside the pane

The row and column handles the editor draws for a table SHALL be brought inside the pane's visible box whenever the editor places them and whenever the pane scrolls, so that a handle can be pressed wherever the table sits — including a table scrolled until its first row is at the pane's top edge. A handle that already fits inside the pane SHALL NOT be moved. A handle that has to be brought inside SHALL keep its meaning: pressing it SHALL still select that table's row or column and SHALL still open that row's or column's controls. A handle's position SHALL NOT be page content: the page's Markdown SHALL NOT change and SHALL NOT be written for it. The line handles that appear while a row or column is being dragged SHALL be left where the editor places them, and a table whose handles already fit SHALL render exactly as it does today.

#### Scenario: A table at the pane's top edge can still be controlled

- **GIVEN** a page holding a table, scrolled so the table's first row sits at the pane's top edge
- **WHEN** the user points at one of its columns
- **THEN** the column's handle is drawn inside the pane rather than above its edge, and pressing it selects that column and opens its controls

#### Scenario: A handle that fits is not moved

- **GIVEN** a page holding a table with room above it in the pane
- **WHEN** the user points at one of its columns
- **THEN** the handle sits where the editor placed it, above the first row and clear of the pane's edges

#### Scenario: Scrolling keeps a shown handle inside the pane

- **GIVEN** a page holding a table whose column handle is being shown
- **WHEN** the user scrolls the pane
- **THEN** the handle is still inside the pane's visible box, and the page's Markdown is unchanged

#### Scenario: The nudge is a position, not content

- **GIVEN** a page holding a table at the pane's top edge
- **WHEN** the page is saved
- **THEN** the Markdown holds the table exactly as it did, and the page is not written at all if nothing was edited
