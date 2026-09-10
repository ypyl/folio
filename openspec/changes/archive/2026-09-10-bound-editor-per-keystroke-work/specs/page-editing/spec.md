## MODIFIED Requirements

### Requirement: References render as clickable badges
In the editor, references in Folio's two forms — `#word` and `#[[Page]]` — SHALL render as visible badges: a chip-styled inline mark (chip background, brand-colored text, pointer cursor) covering the reference's literal text, visually distinct from surrounding prose. The text SHALL remain ordinary editable text: the badge is presentational, introduces no node of its own, and editing it edits the underlying Markdown directly. The badge's appearance SHALL NOT depend on the caret or focus — a reference SHALL look the same whether or not its block is being edited, and moving the caret SHALL NOT repaint it. No badge SHALL render for a reference token inside an inline code span or a fenced code block. Plain `[[Page]]` wikilinks SHALL render as literal editable text with no badge. Badge work SHALL be scoped to the edit: the badge set SHALL be carried forward across a document change and recomputed only for the blocks that change touches, so a keystroke's badge cost grows with the edited blocks and SHALL NOT grow with the number of blocks in the page.

#### Scenario: A reference renders as a visible badge
- **WHEN** the editor body contains `#Inbox` or `#[[reading list]]`
- **THEN** the token renders as a badge over its literal text, visibly distinct from the surrounding prose

#### Scenario: Badges do not follow the caret
- **WHEN** the user places the caret in the block containing a reference, or moves focus in and out of the editor
- **THEN** the reference still renders as a badge and the surrounding text neither moves nor repaints

#### Scenario: A reference is editable text
- **WHEN** the editor body contains `#ideas` or `#[[reading list]]`, and the user selects or arrows into the reference and edits its characters
- **THEN** it renders as a badge over ordinary editable text — no non-editable node is introduced — and editing changes the underlying Markdown and updates the badge to cover the new text

#### Scenario: Code is never badged
- **WHEN** the editor body contains an inline code span `` `#word` `` or a fenced code block containing `#word`
- **THEN** no badge is rendered inside the code

#### Scenario: A plain wikilink stays literal
- **WHEN** the editor body contains `[[Inbox]]`
- **THEN** it appears as literal editable text with no badge

#### Scenario: Editing one block leaves the others badged
- **WHEN** a page has references in several blocks and the user edits a block that has none
- **THEN** every other block keeps its badge unchanged

#### Scenario: A structural edit keeps both sides badged
- **WHEN** the user inserts a block boundary next to a reference, or splits a paragraph so a reference ends up in a different block
- **THEN** every block that holds a reference shows the correct badge after the edit

#### Scenario: Badge cost follows the edit, not the page
- **WHEN** a page holds many blocks and the user types inside one of them
- **THEN** the badge work per keystroke is bounded by the blocks that edit touched and does not scale with the page's block count, as measured by the instrumentation in the change's design

### Requirement: The editor shows block line numbers
An open page in the editor SHALL display a quiet line-number gutter along the left of the document: one small, dimmed number per top-level block, showing the block's start line in the page's canonical Markdown form. The gutter SHALL be purely presentational — non-interactive, hidden from assistive technology, and free of any effect on editing, selection, or focus. Numbers SHALL be live: they update as the document changes (inserting or deleting lines above renumbers the blocks below). Blank separator lines SHALL be counted in the numbering but not rendered, so the display may read 1, 3, 5. A list SHALL carry a single number at its start rather than one per item. Code blocks SHALL keep their embedded editor's local line numbering and additionally show the block's start number in the outer gutter. Renumbering SHALL be a single pass: an update SHALL read the document's layout in one batch and write the numbers in another, never interleaving a layout read with a style write per block, so an update's cost grows with the block count rather than with its square.

#### Scenario: Numbers appear at block starts
- **WHEN** the user opens a page whose content has several blocks
- **THEN** each top-level block shows its canonical start line in the left gutter, aligned with the block's first line

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
- **WHEN** the user clicks or drags over the gutter area
- **THEN** the click falls through to the document (no selection, focus, or interaction with the numbers)

#### Scenario: The placeholder page shows its first block
- **WHEN** the user opens an empty page showing the typing placeholder
- **THEN** the gutter shows a single number for the initial empty block

#### Scenario: A long page updates without stalling
- **WHEN** an edit lands in a page that holds many blocks
- **THEN** the gutter shows the new numbers and positions without a main-thread stall that grows with the square of the block count, as measured by the instrumentation in the change's design

#### Scenario: A reflow re-measures in one pass
- **WHEN** the pane is resized or fonts load so the blocks move
- **THEN** every number re-aligns with its block in a single measurement pass
