## ADDED Requirements

### Requirement: The editor shows block line numbers

An open page in the editor SHALL display a quiet line-number gutter along the left of the document: one small, dimmed number per top-level block, showing the block's start line in the page's canonical Markdown form. The gutter SHALL be purely presentational — non-interactive, hidden from assistive technology, and free of any effect on editing, selection, or focus. Numbers SHALL be live: they update as the document changes (inserting or deleting lines above renumbers the blocks below). Blank separator lines SHALL be counted in the numbering but not rendered, so the display may read 1, 3, 5. A list SHALL carry a single number at its start rather than one per item. Code blocks SHALL keep their embedded editor's local line numbering and additionally show the block's start number in the outer gutter.

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