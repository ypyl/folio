# Spec Delta

## MODIFIED Requirements

### Requirement: The open page is edited in place
Opening a page SHALL put its content in an editable Markdown surface inside the editor pane; a page SHALL NOT be shown through a read-only preview. The surface's document SHALL be the page's Markdown text itself: what an edit changes, and what the file receives, is the Markdown, character for character, with no serialization step between the two. Constructs the surface renders in place (inline formatting, images, tables, reference styling) SHALL be presentational only: they SHALL NOT alter the text, and putting the caret in one SHALL show its Markdown source. The page title (its filename stem) SHALL appear as a heading above the surface and SHALL NOT be editable inside it (renaming is out of scope). Standard Markdown constructs — headings, paragraphs, emphasis, lists, links, code, blockquotes, tables — SHALL be editable as their Markdown source. Editing SHALL NOT reformat text the user did not touch: whitespace, marker style, and line breaks SHALL be preserved as typed.

#### Scenario: A page opens editable
- **WHEN** the user opens a page
- **THEN** its content appears in the editor as editable Markdown text, with the page title shown as a heading

#### Scenario: Formatting round-trips to Markdown
- **WHEN** the user edits headings, emphasis, lists, links, code, blockquotes, or tables in the editor
- **THEN** the content is Markdown that preserves those edits

#### Scenario: The surface is the file
- **GIVEN** a page holding constructs the surface renders in place
- **WHEN** the user edits the page, the save completes, and the page is reopened
- **THEN** the Markdown the surface holds is the Markdown written to the file, with every construct's own characters intact, and text the user did not touch is unchanged

#### Scenario: Untouched formatting is not rewritten
- **GIVEN** a page whose source uses `_emphasis_`, setext headings, or `*` for list markers
- **WHEN** the user edits an unrelated paragraph and saves
- **THEN** those constructs are written back exactly as they were

### Requirement: References render as clickable badges
In the editor, references in Folio's two forms — `#word` and `#[[Page]]` — SHALL render as visible badges: a chip-styled inline mark (chip background, brand-colored text, pointer cursor) covering the reference's literal text, visually distinct from surrounding prose. The reference SHALL keep its Markdown source text visible and editable: the badge is presentational, introduces no node of its own, and editing it edits the underlying Markdown directly. The badge's appearance SHALL NOT depend on the caret or focus — a reference SHALL look the same whether or not its block is being edited, and moving the caret SHALL NOT repaint it. No badge SHALL render for a reference token inside an inline code span or a fenced code block. Plain `[[Page]]` wikilinks SHALL render as literal editable text with no badge. Badge work SHALL be scoped to the rendered region: the badge set SHALL be recomputed only for the ranges the surface renders and the edit touched, so a keystroke's badge cost SHALL NOT grow with the number of blocks in the page.

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

#### Scenario: The badge does not hide its source
- **WHEN** the editor body contains `#Inbox`
- **THEN** the characters `#Inbox` are visible and editable inside the badge

#### Scenario: Badge cost follows the rendered range, not the page
- **WHEN** a page holds many blocks and the user types inside one of them
- **THEN** the badge work per keystroke is bounded by the rendered range and the blocks that edit touched, and does not scale with the page's block count

### Requirement: Vault image references render in the editor
When an open page's markdown references an image whose path points into the vault — a root-relative path carrying no URL scheme — the editor SHALL display that file's bytes in place of the reference while the caret is outside the reference, and SHALL show the reference's source text while the caret is inside it so the destination stays editable. The page's markdown SHALL NOT change: the document keeps the path it had, so the file stays canonical and reload-stable (ADR-0001). A reference the vault cannot resolve — no such file, or a path the storage rejects — SHALL be left as its source text, and that path SHALL NOT be read again for the rest of the page's time open. A reference carrying a scheme (`http:`, `https:`, `data:`, `blob:`) SHALL be left untouched: the editor reads no vault file for it and rewrites nothing. A vault path SHALL be read when its image is needed for display rather than for every image the page references at once, and the bytes the open page holds for images SHALL NOT grow with the number of images its markdown references: an image whose bytes are no longer needed for display SHALL release them and be read again if it is needed again. The editor SHALL NOT read the vault as part of handling a keystroke.

#### Scenario: A vault image reference shows the file's bytes
- **GIVEN** an open page whose markdown reads `![photo](assets/photo.png)` and a vault holding that file, with the caret elsewhere
- **WHEN** the page renders
- **THEN** the reference displays the vault file's bytes, and the page's markdown still reads `![photo](assets/photo.png)`

#### Scenario: A remote image reference is left alone
- **GIVEN** a page whose markdown references an image by an `https:` URL
- **WHEN** the page renders
- **THEN** the image element keeps that URL and the vault is not read for it

#### Scenario: An unresolvable reference is not read again
- **GIVEN** a page referencing a vault image path that holds no file
- **WHEN** the page renders and is then edited
- **THEN** the reference stays unresolved and the vault is not read for that path again

#### Scenario: An image far outside the viewport is not read at page render
- **GIVEN** an open page referencing many vault images, only a few of which are near the visible region
- **WHEN** the page renders
- **THEN** the vault is read only for the images near the visible region, and the page holds no bytes for the images outside it

#### Scenario: An image scrolled back into view is resolved again
- **GIVEN** an open page where an image's bytes were released after it left the viewport
- **WHEN** the user scrolls that image back into view
- **THEN** the image displays the vault file's bytes again

#### Scenario: Each vault image is read once per page
- **GIVEN** an open page displaying a vault image
- **WHEN** the user edits the page
- **THEN** the vault file is not read again and the displayed bytes do not change

#### Scenario: Putting the caret in the reference reveals its source
- **GIVEN** a rendered vault image reference
- **WHEN** the user places the caret inside the reference's text
- **THEN** the reference shows its Markdown source so the destination can be edited, and the file is not read again

### Requirement: The editor locates and marks a block
When the app opens a page to a specific block — today, opening a search result — the editor SHALL scroll that top-level block into view and mark it with a highlight visually distinct from the prose that SHALL NOT move or reflow the page's text. The block SHALL be located by the same block-start rule the line-number gutter and search share (`src/lineAnchors.ts`), so a match's anchor and the editor's mark agree. The mark SHALL be presentational: it SHALL NOT enter the page's Markdown, SHALL NOT change the serialized content or the file, and SHALL NOT be written. It SHALL fade after a short time (about two seconds) and SHALL be cleared at once by the next document change or by a later location request. A request that names no block, or a page opened without one, SHALL be left unmarked. Locating SHALL be a view operation: it SHALL NOT create an undoable document edit.

#### Scenario: A requested block is scrolled to and marked
- **GIVEN** a page with several blocks, opened to one of its later blocks
- **WHEN** the page renders
- **THEN** that block is scrolled into view and carries a visible mark

#### Scenario: The mark fades
- **GIVEN** a page opened to a marked block
- **WHEN** the mark's short time passes with no further action
- **THEN** the mark is gone and the page's text is unchanged

#### Scenario: An edit clears the mark
- **GIVEN** a page with a marked block
- **WHEN** the user types anywhere in the page
- **THEN** the mark is cleared immediately

#### Scenario: A later request replaces the mark
- **GIVEN** a page with a marked block
- **WHEN** the app asks to locate a different block
- **THEN** only the new block is marked

#### Scenario: The mark never reaches the file
- **GIVEN** a page opened to a marked block
- **WHEN** the page is saved or left untouched
- **THEN** the Markdown and the file hold no character representing the mark, and the mark alone neither marks the page dirty nor writes it

### Requirement: Struck text renders crossed
When a page's text contains a struck run — two tildes, then at least one character with no tilde and no leading or trailing space, then two tildes — the editor SHALL display it with a line through it and SHALL NOT display its tildes while the selection is outside the run; the run's tildes SHALL be shown again when the selection touches it, so the run is edited as Markdown. This SHALL hold in every block a page can hold. Where runs share text, the pair that closes first wins, so `~~a~~b~~` strikes `a` and leaves the tail alone. The decoration SHALL be presentational: the document, the saved Markdown, the clipboard, and the index SHALL keep the tildes exactly as the user wrote them, and no formatting mark SHALL be created, so nothing toggles a struck run and it behaves as ordinary text for editing, copying, and saving. Text inside inline code or a fenced code block SHALL NOT be decorated, and neither SHALL a lone tilde, an empty pair, a pair whose content starts or ends with a space, or a run containing a tilde inside it. The decoration SHALL be derived from the text in the same pass as the editor's reference badges, over the ranges the surface renders, so it adds no work proportional to the document on a keystroke.

#### Scenario: A struck run shows a line, and the file keeps its tildes
- **GIVEN** an open page containing `~~Responsible AI, Safety & Risk for Architects~~`
- **WHEN** the page renders
- **THEN** the run is shown with a line through it, and the page's Markdown still reads `~~Responsible AI, Safety & Risk for Architects~~` after the page saves

#### Scenario: A run survives save and reopen as literal text
- **GIVEN** a page whose saved Markdown contains a struck run
- **WHEN** the page is closed and opened again
- **THEN** the run is still decorated with its tildes intact in the document, with no formatting mark added

#### Scenario: Near misses stay plain
- **GIVEN** a page containing a lone `~`, an empty `~~~~` pair, a pair padded as `~~ spaced ~~` and as `~~ ~~`, and a run with a tilde inside as `~~a b ~c~~`
- **WHEN** the page renders
- **THEN** none of them is decorated and all keep their characters

#### Scenario: Code is not struck
- **GIVEN** a page containing `~~text~~` inside inline code and inside a fenced code block
- **WHEN** the page renders
- **THEN** neither run is decorated, and both keep their characters verbatim

#### Scenario: A struck reference shows both decorations
- **GIVEN** a page containing `~~#Inbox~~`
- **WHEN** the page renders
- **THEN** the reference is still shown as a badge and the run is still shown crossed, and clicking the badge still opens the referenced page

#### Scenario: Editing elsewhere in the page does not disturb it
- **GIVEN** a page with a struck run, and the caret in another block
- **WHEN** the user types
- **THEN** the struck run keeps its decoration, and the editor's re-render is bounded by the ranges the surface renders and the lines the edit touched, never by the document's size


## ADDED Requirements

### Requirement: Fenced code is highlighted source
A fenced code block SHALL render as its Markdown source, visually distinct from surrounding prose, with its content syntax-highlighted for the language named on the opening fence. The block SHALL NOT offer a separate editing surface or a language control: the fence and its language token are edited as text, and the canonical file form is unchanged (` ``` ` … ` ``` `, with the language on the opening fence). Highlighting SHALL be scoped to the rendered region and SHALL NOT add work to the keystroke path that grows with the document. Language grammars SHALL load only for the languages a page actually fences, and a block with no language SHALL render monochrome.

#### Scenario: A fenced block is highlighted in place
- **GIVEN** a page whose Markdown contains a fence opened with a language
- **WHEN** the page renders
- **THEN** the block's content is syntax-highlighted for that language, and the fence lines remain visible and editable

#### Scenario: Editing the language token follows through
- **WHEN** the user edits the language token on an opening fence (for example to `js`)
- **THEN** the block's highlighting follows, and after save and reopen the opening fence still reads ` ```js `

#### Scenario: A language-less fence renders monochrome
- **WHEN** the user opens a page whose Markdown contains a fenced code block with no language on its opening fence
- **THEN** the block renders monochrome

#### Scenario: Unused grammars are not loaded
- **GIVEN** a page fencing only one language
- **WHEN** the page renders
- **THEN** no other language grammar is fetched

### Requirement: Paste inserts literal text
Pasting into the editor SHALL insert the clipboard's plain text verbatim. Because the surface is Markdown, pasted Markdown is inserted as Markdown with no interpretation step and no markdown-likeness rule, and text that merely contains inline markers SHALL stay the literal characters pasted. Rich-text and HTML clipboard flavors SHALL be ignored. Line breaks in pasted text SHALL be preserved. Pressing the paste shortcut with the shift modifier (Mod+Shift+V / Ctrl+Shift+V) SHALL also insert the literal text. Pasting a clipboard that carries no text (for example, copied files) SHALL leave the document unchanged.

#### Scenario: Pasted Markdown lands as written
- **WHEN** the user pastes a multi-block Markdown document (a heading, a bullet list, and a fenced code block) from outside the editor
- **THEN** the text is inserted exactly as the clipboard held it, the saved Markdown contains that structure, and reopening the page shows the same text

#### Scenario: Pasting formatted web text stays plain
- **WHEN** the user copies formatted text from a web page (rich HTML with bold, italic, and code runs) and pastes it into an open page
- **THEN** the pasted text appears as plain text with no bold, italic, code, or link formatting

#### Scenario: Inline markers stay literal
- **WHEN** the user pastes text such as `**bold**` or a bare URL
- **THEN** those characters are inserted as typed and remain so after save and reopen

#### Scenario: Multi-line paste keeps its line breaks
- **WHEN** the user pastes text spanning several lines
- **THEN** every line break is preserved in the document and in the saved Markdown

#### Scenario: A clipboard with no text changes nothing
- **WHEN** the user pastes a clipboard carrying files but no text
- **THEN** the document is unchanged

### Requirement: A GFM table renders as a table at rest
A GFM pipe table SHALL render as a table in the editor while the caret is off it: a header row, body rows, and every cell carrying a visible border so the table draws a grid and a frame, with the header row reading apart from the body rows. The column alignment written in the delimiter row SHALL be applied per column. A cell's inline Markdown — emphasis, strong, strikethrough, code spans, and links — SHALL render, and a reference written in a cell SHALL render as a badge and activate like any other reference.

Rendering SHALL be presentational: the file SHALL keep its pipe table, character for character, and the table's source SHALL be what an edit changes. Putting the caret on the table SHALL show its source, so the table is edited as Markdown; moving the caret off it SHALL render the table again. A press on the rendered table SHALL put the caret on it, so the source is reachable by clicking the table.

Rendering a table SHALL NOT add work to the keystroke path that grows with the document: only the tables on the lines an edit touched, and the tables the caret moved on or off, SHALL be re-read, and a keystroke that touches no table SHALL re-read none of them.

#### Scenario: A pipe table opens as a table
- **GIVEN** a page whose Markdown holds a pipe table with a header row and body rows, and the caret elsewhere
- **WHEN** the page renders
- **THEN** the editor shows a table with a header row and those body rows, and no cell shows its pipe characters

#### Scenario: A table renders with visible borders
- **GIVEN** a page holding a table between two paragraphs, with the caret elsewhere
- **WHEN** the page renders
- **THEN** every cell carries a visible border drawing a grid and a frame around the table, and the header row reads apart from the body rows

#### Scenario: Alignment follows the delimiter row
- **GIVEN** a table whose delimiter row marks one column left, one centre, and one right
- **WHEN** the table renders
- **THEN** each column's cells are aligned as its delimiter asks

#### Scenario: Cell markup and references render
- **GIVEN** a table whose cells hold emphasis, a code span, a link, and `#Inbox`
- **WHEN** the table renders
- **THEN** each renders as its formatted content, and the reference renders as a badge that opens the page when activated

#### Scenario: The source comes back for editing
- **GIVEN** a rendered table
- **WHEN** the user puts the caret on the table
- **THEN** the table shows its Markdown source, with its pipes and delimiter row intact, and every cell is editable as text

#### Scenario: Putting the caret back re-renders the table
- **GIVEN** a table showing its source
- **WHEN** the user moves the caret off the table
- **THEN** the table renders as a table again, and the source it held is unchanged

#### Scenario: The file keeps a pipe table
- **GIVEN** a rendered table
- **WHEN** the page is saved and reopened
- **THEN** the saved Markdown is still a pipe table with the same rows, columns, and cell text

#### Scenario: Table rendering cost follows the edit, not the page
- **GIVEN** a page holding many tables and the user types in a paragraph that holds none
- **WHEN** the edit is applied
- **THEN** no table is re-read

### Requirement: Inline formatting renders at rest
Bold, italic, strikethrough, and inline code SHALL render as their formatted result while the selection is outside the construct: `**bold**`, `__bold__`, `*italic*`, `_italic_`, `~~struck~~`, and `` `code` `` SHALL show their content with weight, slant, a struck line, or the code style, and SHALL NOT show their markers. When the selection touches the construct — the caret inside it or a selection overlapping it — its markers SHALL be shown again, so the construct is edited as Markdown. Hiding SHALL be a view operation: the document SHALL keep every character, and a save SHALL write the constructs exactly as they were.

A hidden marker SHALL be atomic: the caret SHALL step over it rather than land inside it. Hiding SHALL NOT apply inside a fenced code block or an inline code span's content, where the characters are literal. Rendered runs SHALL nest: a run inside another SHALL hide its own markers, and revealing the outer run SHALL NOT change the inner one.

#### Scenario: Formatted runs read at rest
- **GIVEN** a paragraph containing `**bold**`, `*italic*`, and `~~struck~~`, with the caret elsewhere
- **WHEN** the page renders
- **THEN** the words read as bold, italic, and struck text, and no `*` or `~` marker is shown

#### Scenario: The markers come back for editing
- **GIVEN** a rendered bold run
- **WHEN** the user puts the caret inside it, or selects across it
- **THEN** its `**` markers are shown, and it is editable as Markdown

#### Scenario: Leaving the run renders it again
- **GIVEN** a run showing its markers
- **WHEN** the user moves the caret out of it
- **THEN** the run renders as its formatted result again, and the text is unchanged

#### Scenario: The file keeps the markers
- **GIVEN** a page whose paragraph holds `**bold**`
- **WHEN** the user edits an unrelated part of the page and the save completes
- **THEN** the saved Markdown still holds `**bold**`

#### Scenario: The caret steps over a hidden marker
- **GIVEN** a rendered bold run with the caret after it
- **WHEN** the user moves the caret backwards with the arrow keys
- **THEN** the caret lands on the run's last content character and never inside a hidden marker

#### Scenario: Code stays literal
- **GIVEN** a fenced block containing `**not bold**` and an inline code span holding `*not italic*`
- **WHEN** the page renders
- **THEN** both show their characters literally, with no marker hidden and no formatting applied inside them

#### Scenario: A nested run keeps its own markers
- **GIVEN** a paragraph holding `**bold *nested* bold**`, with the caret elsewhere
- **WHEN** the page renders
- **THEN** both runs read as formatted text with none of their markers shown


## REMOVED Requirements

### Requirement: Copy and cut carry the selection as canonical Markdown
**Reason**: The editor's plain text is already canonical Markdown, so a private clipboard flavor carries nothing the plain-text flavor does not.
**Migration**: None. Selecting text and copying it yields the Markdown source, which pastes back unchanged.

### Requirement: Paste inserts only the plain text of the clipboard
**Reason**: Replaced by "Paste inserts literal text": with a Markdown source surface there is no interpretation step and no markdown-likeness rule to apply.
**Migration**: None; pasting the plain text is the whole behavior.

### Requirement: Code blocks are a CodeMirror editing surface
**Reason**: Replaced by "Fenced code is highlighted source": the embedded surface and its language picker are gone, and highlighting comes from the document's own grammar.
**Migration**: None. Fence content is edited as text and stays highlighted.

### Requirement: A Markdown table is a table in the editor
**Reason**: Replaced by "A GFM table renders as a table at rest". The surface shows source while the caret is on the table, so a cell is edited as Markdown rather than as a table cell, and the document model's table node is gone.
**Migration**: None. A table at rest still reads as a table; editing it means editing its Markdown.

### Requirement: A click in a table cell places the caret
**Reason**: Replaced by "A GFM table renders as a table at rest": a press on the rendered table puts the caret on the table and brings its source back, so a cell is reached by placing the caret in it as text.
**Migration**: None.

### Requirement: An empty table cell shows a boundary
**Reason**: Removed with the document model's table node: an empty cell is an empty run between two pipes, so there is no cell box to draw a boundary for.
**Migration**: None.

### Requirement: A table that begins a page keeps room for its controls
**Reason**: Removed with the document model's table node: there are no table controls, and a table at rest needs no room made for them.
**Migration**: None.

### Requirement: A table's handles stay inside the pane
**Reason**: Removed with the document model's table node: there are no handles.
**Migration**: None.

### Requirement: Aligning and deleting a table row or column works from the caret
**Reason**: Removed with the document model's table node; alignment is written in the delimiter row and rows and columns are edited as text.
**Migration**: Edit the delimiter row to change alignment; add or remove a line to add or remove a row.

### Requirement: Deleting a table row or column is reachable without a handle
**Reason**: Removed with the document model's table node; there are no table handles.
**Migration**: Delete the line.

### Requirement: A thematic break renders as a visible rule
**Reason**: The surface shows Markdown source, so `---` shows its markers rather than a rule.
**Migration**: None; the markers are the representation.

### Requirement: A page always keeps an empty block at its end
**Reason**: A text document has no blocks; an empty page is an empty string and a trailing newline is just a character.
**Migration**: None.

### Requirement: Serialization never writes a trailing blank line
**Reason**: There is no serialization step; the file holds exactly the text the user typed.
**Migration**: None. A trailing blank line the user typed is written; one they did not type does not exist.

### Requirement: An empty list item holding a child block round-trips
**Reason**: Removed with the document model; list items are text.
**Migration**: None.

### Requirement: Backspace and Delete act on the caret's list item
**Reason**: The document model's list semantics are gone; Backspace and Delete are ordinary text deletion.
**Migration**: None. Markdown's own list structure is edited as text.

### Requirement: The space below the last block belongs to the page
**Reason**: Removed with the document model; the surface ends where the text ends.
**Migration**: None.

### Requirement: A JSON code block can be reformatted on demand
**Reason**: Removed with the embedded code block surface; the reformat action was bound to that surface's model.
**Migration**: Reformatting JSON is ordinary text editing for now; the action can return as a text-range command.

### Requirement: The editor shows block line numbers
**Reason**: The gutter goes with the document model it numbered: it labelled each top-level block's start line, and the Markdown-source surface shows the file's own lines, so a per-block number would restate what the text already shows.
**Migration**: None.
