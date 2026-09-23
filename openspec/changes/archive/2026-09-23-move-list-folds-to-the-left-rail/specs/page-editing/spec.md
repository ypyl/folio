## MODIFIED Requirements

### Requirement: A list item with children can be folded

An open page's editor SHALL offer a fold control in its left rail for every list item that holds nested content — a nested list, or any block after the item's first block. The control SHALL be a real, focusable button carrying `aria-expanded` and a label naming the action, and it SHALL be aligned to the item's first line; a nested item SHALL have its own control, so nested folding stays reachable. Activating the control SHALL fold the item, hiding its nested content in the editor; activating it again SHALL expand the item. A list item whose only content is its own first block SHALL show no control. Folding SHALL change only what the editor draws and SHALL NOT change the page: the serialized Markdown and the file SHALL keep every line of a folded item, and a fold alone SHALL NOT mark the page edited or cause a write. The control SHALL NOT cover or replace the item's native marker, which SHALL keep being drawn by the browser as it is today (ADR-0020). Fold state SHALL be scoped to the open page and the current session: opening another page or reloading the app SHALL show every item expanded, and no fold state SHALL be written to the vault — no `.folio/` entry and no Markdown property.

#### Scenario: A folded item hides its nested content

- **GIVEN** an open page holding a list item with nested items
- **WHEN** the user activates that item's fold control
- **THEN** the nested items disappear from view, the item's own text stays visible, and the control now offers to expand

#### Scenario: Expanding restores the nested content

- **GIVEN** a folded list item
- **WHEN** the user activates its control again
- **THEN** the nested items are visible again and the item reads exactly as it did before the fold

#### Scenario: The file keeps a folded item's lines

- **GIVEN** an open page with a folded list item and no other edits
- **WHEN** the page is saved or left untouched
- **THEN** the Markdown and the file hold the item's nested lines exactly as they were, and the fold alone neither marks the page dirty nor writes it

#### Scenario: A leaf item has no control

- **GIVEN** a list whose items hold no nested content
- **WHEN** the page renders
- **THEN** no item shows a fold control

#### Scenario: A nested item has its own control

- **GIVEN** an open page whose list item holds a nested list with its own nested item
- **WHEN** the page renders
- **THEN** the outer item and the nested item each show a fold control in the left rail, aligned to that item's own first line

#### Scenario: The marker is never covered

- **GIVEN** an open page with a foldable list item
- **WHEN** the page renders and the item's fold control is shown
- **THEN** the browser draws the item's native marker unobstructed, and the control sits in the left rail beside the marker's column, not over it

#### Scenario: Folds do not survive leaving the page

- **GIVEN** an open page with a folded list item
- **WHEN** the user opens another page and returns, or reloads the app
- **THEN** every item is expanded

#### Scenario: The vault gains no fold state

- **GIVEN** a page whose list items were folded and expanded
- **WHEN** the vault is inspected
- **THEN** no `.folio/` entry and no Markdown property records a fold, and the page's bytes carry only the user's own edits

### Requirement: The editor shows block line numbers

An open page in the editor SHALL display a quiet rail along the left of the document holding the line numbers and the fold controls. The line numbers SHALL be one small, dimmed number per top-level block, showing the block's start line in the page's canonical Markdown form. The numbers SHALL remain purely presentational — non-interactive, hidden from assistive technology, and free of any effect on editing, selection, or focus — while the fold controls in the same rail SHALL be interactive and accessible ("A list item with children can be folded"). A top-level block that has a fold control SHALL show its number beneath that control; a top-level block with no fold control SHALL show its number on the block's first line. Numbers SHALL be live: they update as the document changes (inserting or deleting lines above renumbers the blocks below). Blank separator lines SHALL be counted in the numbering but not rendered, so the display may read 1, 3, 5. A list SHALL carry a single number at its start rather than one per item. Code blocks SHALL keep their embedded editor's local line numbering and additionally show the block's start number in the outer rail. Renumbering SHALL be a single pass: an update SHALL read the document's layout in one batch and write the numbers and controls in another, never interleaving a layout read with a style write per block, so an update's cost grows with the block count rather than with its square.

#### Scenario: Numbers appear at block starts

- **WHEN** the user opens a page whose content has several blocks
- **THEN** each top-level block shows its canonical start line in the left rail, aligned with the block's first line

#### Scenario: A fold control sits above its number

- **GIVEN** an open page whose first block is a foldable list
- **WHEN** the page renders
- **THEN** the rail shows that block's fold control on its first line and the block's line number just beneath the control

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

### Requirement: Folding re-glues the line-number gutter

When a fold or an expand changes the rendered height of the document without changing its text, the rail SHALL re-measure and keep every number aligned with its block's first line and every fold control aligned with its item's first line, exactly as it does for a reflow. A fold SHALL NOT change which lines are numbered: numbers SHALL remain the page's canonical Markdown line numbers.

#### Scenario: Blocks below a folded item keep their numbers

- **GIVEN** an open page whose blocks below a list item show line numbers in the rail
- **WHEN** the item is folded so the blocks below move up the pane
- **THEN** every block below the folded item keeps its own number, aligned with its first line

#### Scenario: Controls re-glue with their items

- **GIVEN** an open page with a fold control on a list item
- **WHEN** a fold above it moves the item up the pane
- **THEN** the control is still aligned with that item's first line

#### Scenario: A fold does not renumber

- **GIVEN** an open page with a folded list item
- **WHEN** the fold hides nested lines and later expands them
- **THEN** the numbers shown are the page's canonical Markdown line numbers in both states

### Requirement: Folding work stays bounded by the edited list

A keystroke SHALL NOT pay for folding. The fold state SHALL be carried forward across a document change, and a list's fold state SHALL change only for the tree a toggle touches. The rail's fold controls SHALL be drawn by the same single measure-then-write update that draws the numbers, which runs on the debounced markdown change stream, on a fold, and on a reflow — never synchronously on a keystroke, so typing pays nothing for folding and a keystroke's cost does not grow with the number of foldable items. That rail update's cost SHALL grow with the block and foldable-item count in one pass, not with its square.

#### Scenario: Typing in a list leaves its fold controls in place

- **GIVEN** an open page holding a long list whose items show fold controls
- **WHEN** the user types a character in one item's text
- **THEN** the fold state is unchanged, no fold work runs on the keystroke, the item's text is the only thing that changes, and the rail redraws its controls in its next debounced update rather than on the keystroke

#### Scenario: Toggling one item recomputes only its tree

- **GIVEN** an open page with two separate nested lists
- **WHEN** the user folds one item in the first list
- **THEN** the fold state change is scoped to the first list's tree, and the second list's visible state is unchanged
