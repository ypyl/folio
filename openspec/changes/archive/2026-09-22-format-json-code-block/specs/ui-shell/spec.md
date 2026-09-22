## ADDED Requirements

### Requirement: The keyboard-shortcuts reference covers formatting a JSON code block

The keyboard-shortcuts reference SHALL list the JSON code block's format action: `Mod-Shift-F` (Cmd/Ctrl+Shift+F) to reindent the JSON code block the caret is in. It SHALL be listed as a readable label plus its key combination rendered as key tokens, matching the existing rows, with the label and its key combination on one line at the panel's default width. The row SHALL be a control that applies its combination, as the reference's other editor rows are. The row SHALL be listed only because the app provides that behavior.

#### Scenario: The reference lists how to format a JSON code block

- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** it shows a "Format JSON block" row with the `Mod-Shift-F` chord rendered as key tokens, on one line

#### Scenario: Applying the format control reformats the block

- **GIVEN** an open page with a JSON code block holding single-line JSON and the caret inside it
- **WHEN** the user activates the format row's key control
- **THEN** the block is reformatted exactly as pressing the combination would reformat it, and the page's saved Markdown holds the indented text
