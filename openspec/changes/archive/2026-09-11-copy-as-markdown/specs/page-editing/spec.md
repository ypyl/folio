## ADDED Requirements

### Requirement: Copy and cut carry the selection as canonical Markdown

Copying or cutting a non-empty selection in the editor SHALL additionally place the selection's canonical Markdown on the clipboard under a private flavor. The selection SHALL be serialized with the editor's Markdown serializer, so headings, emphasis, lists, blockquotes, links, and code fences appear as their Markdown forms. The clipboard's plain-text and HTML flavors SHALL be unchanged, so copying into other applications and rich-text targets behaves exactly as before. A copy or cut with an empty selection SHALL place nothing on the private flavor.

#### Scenario: Copying a formatted section carries its Markdown
- **WHEN** the user selects a section containing a heading, bold text, a bullet list, and a fenced code block and copies it
- **THEN** the clipboard's private flavor contains the same structure as canonical Markdown (`## …`, `**…**`, `- …`, a fence), while the clipboard's plain-text flavor is unchanged

#### Scenario: Cutting carries the selection before it is removed
- **WHEN** the user cuts a formatted selection
- **THEN** the private flavor holds that selection's canonical Markdown, so it can be pasted back with its structure intact

#### Scenario: Copying into another application is unchanged
- **WHEN** the user copies a selection and pastes it into an application that does not understand the private flavor
- **THEN** that application receives the same plain text and HTML it receives today

#### Scenario: An empty selection carries nothing
- **WHEN** the user copies or cuts with no selection
- **THEN** the private flavor is empty and the document is unchanged

## MODIFIED Requirements

### Requirement: Paste inserts only the plain text of the clipboard

Pasting into the editor SHALL prefer the clipboard's private Folio Markdown flavor when it is present: the text under that flavor SHALL be interpreted as Markdown unconditionally, without applying the markdown-likeness rule, so a selection copied or cut in the editor is restored with its structure whatever its size or shape (a multi-block section, a single list, a lone heading, or an inline run such as `**bold**`). When the private flavor is absent or empty, pasting SHALL read the clipboard's plain text and SHALL ignore any rich-text or HTML fragment the clipboard carries. When that plain text resembles a Markdown document — any line that opens a fenced code block, or at least two non-blank lines starting with block-level Markdown markers (ATX heading, blockquote, unordered or ordered list item, table row, thematic break) making up at least half of the non-blank lines — the editor SHALL interpret the plain text as Markdown: headings, lists, blockquotes, code fences, emphasis, links, and other Markdown constructs SHALL appear as the corresponding blocks and formatting. Otherwise, plain text SHALL be inserted literally: text that merely contains inline Markdown markers without block structure (such as `**bold**`, `*italic*`, `` `code` ``, or bare URLs) SHALL appear as the literal characters pasted and SHALL remain literal after the page is saved and reopened. Line breaks in pasted text SHALL be preserved. Pressing the paste shortcut with the shift modifier (Mod+Shift+V / Ctrl+Shift+V) SHALL insert the literal text verbatim, bypassing Markdown interpretation. Pasting a clipboard that carries no text (for example, copied files) SHALL leave the document unchanged.

#### Scenario: A selection copied in the editor pastes back as structure
- **WHEN** the user copies a section containing a heading, bold text, a bullet list, and a fenced code block, opens another page, and pastes
- **THEN** the pasted content appears with the same heading, bold run, list, and code block, and the saved Markdown contains that structure

#### Scenario: A small selection round-trips without the markdown-likeness rule
- **WHEN** the user copies a single heading, or a single inline run such as `**bold**`, or a lone bullet item, and pastes it into another page
- **THEN** it is restored as a real heading, a real bold run, or a real list item rather than as literal text with markers

#### Scenario: Pasting formatted web text stays plain
- **WHEN** the user copies formatted text from a web page (rich HTML with bold, italic, and code runs) and pastes it into an open page
- **THEN** the pasted text appears as plain text with no bold, italic, code, or link formatting, and the saved Markdown contains no formatting markers for that text

#### Scenario: A Markdown document pastes as structure
- **WHEN** the user pastes a multi-block Markdown document (a heading, a bullet list, and a fenced code block) from outside the editor
- **THEN** the editor shows a real heading, a real list, and a real code block, and the saved Markdown contains that structure with no escape backslashes; reopening the page shows the same structure

#### Scenario: Markdown-looking text stays literal
- **WHEN** the user pastes the external text `**wow**` into the editor
- **THEN** the editor shows the literal characters `**wow**`, the text is not bold, and after the page is saved and reopened the text still appears as the literal characters `**wow**`

#### Scenario: A lone heading line stays literal
- **WHEN** the user pastes only the single external line `# Title` into the editor
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
