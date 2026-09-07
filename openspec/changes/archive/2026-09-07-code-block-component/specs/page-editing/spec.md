## ADDED Requirements

### Requirement: Code blocks are a CodeMirror editing surface

A code block in the editor SHALL render as a dedicated multi-line code editing surface, visually distinct from surrounding prose, backed by an embedded code editor (CodeMirror). The surface SHALL offer a language picker, syntax highlighting, line numbers, and code editing conveniences (auto-completion, folding, search and replace). The block's content and its language SHALL round-trip through the Markdown fence: the canonical file form is unchanged (` ``` ` … ` ``` `, with the chosen language on the opening fence), and reloading a page restores the same content and language. A code block with no language SHALL render monochrome without a language marker.

#### Scenario: Inserting a code block opens the code surface

- **WHEN** the user starts a line with three backticks (typing ` ``` ` followed by space or Enter) or presses `Mod-Alt-c`
- **THEN** the line becomes a code block rendered as the multi-line code editing surface with the caret inside it

#### Scenario: Multiline content stays inside the block

- **WHEN** the user types several lines inside a code block, pressing Enter between lines
- **THEN** every new line remains inside the same code block, and the saved Markdown contains those lines between the fence marks

#### Scenario: Language selection round-trips through the fence

- **WHEN** the user chooses a language (for example JavaScript) from the code block's language picker
- **THEN** the block's tokens are highlighted for that language, and after save the opening fence is written with the language (` ```js `); reopening the page shows the same language already selected

#### Scenario: Existing fenced blocks load into the surface

- **WHEN** the user opens a page whose Markdown contains a fenced code block that carries a language
- **THEN** the block renders in the code editing surface with that language's highlighting

#### Scenario: A language-less fence renders monochrome

- **WHEN** the user opens a page whose Markdown contains a fenced code block with no language on its opening fence
- **THEN** the block renders in the code editing surface with monochrome text and no language marker

#### Scenario: Pasting inside a code block is handled by the code surface

- **WHEN** the user pastes multi-line text with indentation while the caret is inside a code block
- **THEN** the pasted text lands inside the code block with its lines and indentation preserved

#### Scenario: Pasting outside a code block stays plain text

- **WHEN** the user pastes formatted text while the caret is outside any code block
- **THEN** the existing paste-as-plain-text behavior applies unchanged: only the clipboard's plain text is inserted, verbatim