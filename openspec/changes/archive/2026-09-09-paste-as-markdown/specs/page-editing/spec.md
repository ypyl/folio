## MODIFIED Requirements

### Requirement: Paste inserts only the plain text of the clipboard
Pasting into the editor SHALL read the clipboard's plain text and SHALL ignore any rich-text or HTML fragment the clipboard carries. When the pasted text resembles a Markdown document — any line that opens a fenced code block, or at least two non-blank lines starting with block-level Markdown markers (ATX heading, blockquote, unordered or ordered list item, table row, thematic break) making up at least half of the non-blank lines — the editor SHALL interpret the pasted text as Markdown: headings, lists, blockquotes, code fences, emphasis, links, and other Markdown constructs SHALL appear as the corresponding blocks and formatting. Otherwise, pasted text SHALL be inserted literally: text that merely contains inline Markdown markers without block structure (such as `**bold**`, `*italic*`, `` `code` ``, or bare URLs) SHALL appear as the literal characters pasted and SHALL remain literal after the page is saved and reopened. Line breaks in pasted text SHALL be preserved. Pressing the paste shortcut with the shift modifier (Mod+Shift+V / Ctrl+Shift+V) SHALL insert the literal text verbatim, bypassing Markdown interpretation. Pasting a clipboard that carries no text (for example, copied files) SHALL leave the document unchanged.

#### Scenario: Pasting formatted web text stays plain
- **WHEN** the user copies formatted text from a web page (rich HTML with bold, italic, and code runs) and pastes it into an open page
- **THEN** the pasted text appears as plain text with no bold, italic, code, or link formatting, and the saved Markdown contains no formatting markers for that text

#### Scenario: A Markdown document pastes as structure
- **WHEN** the user pastes a multi-block Markdown document (a heading, a bullet list, and a fenced code block)
- **THEN** the editor shows a real heading, a real list, and a real code block, and the saved Markdown contains that structure with no escape backslashes; reopening the page shows the same structure

#### Scenario: Markdown-looking text stays literal
- **WHEN** the user pastes the text `**wow**` into the editor
- **THEN** the editor shows the literal characters `**wow**`, the text is not bold, and after the page is saved and reopened the text still appears as the literal characters `**wow**`

#### Scenario: A lone heading line stays literal
- **WHEN** the user pastes only the single line `# Title` into the editor
- **THEN** the line is not converted into a heading; it appears as the literal text `# Title` and remains non-heading text after the page is saved and reopened

#### Scenario: A shift-modifier paste forces literal text
- **WHEN** the user pastes a Markdown document while holding the shift modifier (Mod+Shift+V / Ctrl+Shift+V)
- **THEN** the text is inserted literally with no Markdown interpretation, and it round-trips like any other literal text (escaped in the saved Markdown, identical after reopen)

#### Scenario: Multi-line paste keeps its line breaks
- **WHEN** the user pastes text containing multiple lines
- **THEN** the line breaks are preserved both in the editor and in the saved Markdown

#### Scenario: A clipboard with no text changes nothing
- **WHEN** the user pastes a clipboard that carries no text, such as copied files
- **THEN** the document is unchanged

#### Scenario: Typing Markdown syntax still formats
- **WHEN** the user types `**wow**` into the editor rather than pasting it
- **THEN** the text becomes bold as today; typing behavior is unaffected by this change

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
- **THEN** only the clipboard's plain text is used and rich formatting is ignored; whether that text is interpreted as Markdown is decided by the paste rule (markdown-aware paste), never by the code surface