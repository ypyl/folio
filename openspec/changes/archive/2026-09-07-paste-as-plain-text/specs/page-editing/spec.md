# page-editing Delta

## ADDED Requirements

### Requirement: Paste inserts only the plain text of the clipboard
Pasting into the editor SHALL insert the clipboard's plain text literally at the current selection and SHALL ignore any rich-text or HTML fragment the clipboard carries. Pasted text SHALL NOT be interpreted as Markdown: text that resembles Markdown syntax — `**bold**`, `*italic*`, `` `code` ``, `# heading`, `- list`, bare URLs — SHALL appear as the literal characters pasted and SHALL remain literal after the page is saved and reopened. Line breaks in pasted text SHALL be preserved. Pasting a clipboard that carries no text (for example, copied files) SHALL leave the document unchanged.

#### Scenario: Pasting formatted web text stays plain
- **WHEN** the user copies formatted text from a web page (rich HTML with bold, italic, and code runs) and pastes it into an open page
- **THEN** the pasted text appears as plain text with no bold, italic, code, or link formatting, and the saved Markdown contains no formatting markers for that text

#### Scenario: Markdown-looking text stays literal
- **WHEN** the user pastes the text `**wow**` into the editor
- **THEN** the editor shows the literal characters `**wow**`, the text is not bold, and after the page is saved and reopened the text still appears as the literal characters `**wow**`

#### Scenario: Multi-line paste keeps its line breaks
- **WHEN** the user pastes text containing multiple lines
- **THEN** the line breaks are preserved both in the editor and in the saved Markdown

#### Scenario: A clipboard with no text changes nothing
- **WHEN** the user pastes a clipboard that carries no text, such as copied files
- **THEN** the document is unchanged

#### Scenario: Typing Markdown syntax still formats
- **WHEN** the user types `**wow**` into the editor rather than pasting it
- **THEN** the text becomes bold as today; typing behavior is unaffected by this change