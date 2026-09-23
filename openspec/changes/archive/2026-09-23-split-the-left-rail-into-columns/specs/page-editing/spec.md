## MODIFIED Requirements

### Requirement: The editor shows block line numbers

An open page in the editor SHALL display a quiet rail along the left of the document holding two columns: a line-number column on its left and a fold-control column on its right, nearest the prose. The line numbers SHALL be one small, dimmed number per top-level block, showing the block's start line in the page's canonical Markdown form. The numbers SHALL remain purely presentational — non-interactive, hidden from assistive technology, and free of any effect on editing, selection, or focus — while the fold controls in the same rail SHALL be interactive and accessible ("A list item with children can be folded"). A top-level block that has a fold control SHALL show its number in the number column on the block's first line, beside that control; a top-level block with no fold control SHALL show its number in the same column on its first line. Numbers SHALL be live: they update as the document changes (inserting or deleting lines above renumbers the blocks below). Blank separator lines SHALL be counted in the numbering but not rendered, so the display may read 1, 3, 5. A list SHALL carry a single number at its start rather than one per item. Code blocks SHALL keep their embedded editor's local line numbering and additionally show the block's start number in the outer rail. Renumbering SHALL be a single pass: an update SHALL read the document's layout in one batch and write the numbers and controls in another, never interleaving a layout read with a style write per block, so an update's cost grows with the block count rather than with its square.

#### Scenario: Numbers appear at block starts

- **WHEN** the user opens a page whose content has several blocks
- **THEN** each top-level block shows its canonical start line in the rail's number column, aligned with the block's first line

#### Scenario: A fold control sits above its number

- **GIVEN** an open page whose first block is a foldable list
- **WHEN** the page renders
- **THEN** the rail shows that block's fold control in the control column and the block's line number in the number column, both on the block's first line with the number to the left of the control

#### Scenario: Blank separators count but are not shown

- **WHEN** the page contains blocks separated by blank lines
- **THEN** the blank lines are counted (so later numbers stay true to the file) but no number is rendered for them

#### Scenario: A list numberes once

- **WHEN** the user views a page with a list of several items
- **THEN** the list shows one number at its start, never a number per item

#### Scenario: Numbers follow edits

- **WHEN** the user inserts a line above a block in the same document
- **THEN** the block's and all later blocks' numbers increase accordingly while typing

#### Scenario: The gutter never captures input

- **WHEN** the user clicks or drags over a line number in the rail
- **THEN** the click falls through to the document (no selection, focus, or interaction with the number), while a click on a fold control in the same rail activates that control instead

#### Scenario: The placeholder page shows its first block

- **WHEN** the user opens an empty page showing the typing placeholder
- **THEN** the rail shows a single number for the initial empty block

#### Scenario: A long page updates without stalling

- **WHEN** an edit lands in a page that holds many blocks
- **THEN** the rail shows the new numbers, controls, and positions without a main-thread stall that grows with the square of the block count, as measured by the instrumentation in the change's design

#### Scenario: A reflow re-measures in one pass

- **WHEN** the pane is resized or fonts load so the blocks move
- **THEN** every number and every fold control re-aligns with its block or item in a single measurement pass
