## ADDED Requirements

### Requirement: A JSON code block can be reformatted on demand

A code block whose language is JSON SHALL be reformattable on demand from its code surface. With the caret inside such a block, pressing the format chord SHALL replace the block's text with the same JSON reindented to a two-space indent, preserving every key, every value, and their order — only the whitespace between tokens changes. The formatted text SHALL become the block's content and SHALL round-trip through the same fence, so the saved Markdown holds the formatted form and reopening the page shows it. The block SHALL keep its JSON language and its place in the page, and the change SHALL be a single undoable edit. In a block whose language is not JSON, and in text that is not valid JSON, pressing the chord SHALL leave the document unchanged. With the caret outside any code block the chord SHALL NOT be claimed by the code surface. Formatting SHALL never happen on paste, on save, or on opening a page — only when the user presses the chord. The chord SHALL be listed in the app's keyboard-shortcuts reference.

#### Scenario: Formatting a one-line JSON block makes it readable

- **GIVEN** an open page with a code block whose language is JSON and whose content is `{"a":1,"b":[2,3]}`
- **WHEN** the user presses the format chord with the caret inside the block
- **THEN** the block shows the same JSON spread across lines with a two-space indent, and the page's saved Markdown holds that indented text between the ` ```json ` fence

#### Scenario: Formatting preserves keys, values, and their order

- **GIVEN** a JSON code block whose content carries keys in a chosen order and values of every JSON kind (string, number, boolean, null, object, array)
- **WHEN** the user formats it
- **THEN** every key appears in the same order and every value is unchanged, and only the indentation and line breaks differ

#### Scenario: Formatting works whatever the fence's spelling of the language

- **GIVEN** one page whose fence reads ` ```json ` and another where the language picker selected JSON
- **WHEN** the user formats the block on each page
- **THEN** both blocks are reformatted the same way

#### Scenario: A block that is not JSON is left alone

- **GIVEN** a code block whose language is JavaScript, or a code block with no language, containing text that would be valid JSON
- **WHEN** the user presses the format chord with the caret inside the block
- **THEN** the block's text is unchanged and no edit is recorded

#### Scenario: Invalid JSON is left alone

- **GIVEN** a code block whose language is JSON and whose content is not valid JSON (for example `{a: 1}`)
- **WHEN** the user presses the format chord
- **THEN** the block's text is unchanged and no edit is recorded

#### Scenario: The chord is not the code surface's outside a code block

- **GIVEN** an open page with the caret in an ordinary paragraph
- **WHEN** the user presses the format chord
- **THEN** the paragraph is unchanged, and the chord is left to whatever else the app binds it to

#### Scenario: Pasting, saving, and opening never format

- **GIVEN** a page whose JSON code block holds a single-line JSON value
- **WHEN** the user pastes that value into the block, saves the page, and reopens it
- **THEN** the block still holds the single-line text, unchanged until the user presses the format chord

#### Scenario: Formatting is one undoable edit

- **GIVEN** a JSON code block that was formatted from a single line
- **WHEN** the user undoes the edit
- **THEN** the block returns to the single line it held before
