# page-editing Specification

## Purpose

Makes an opened page editable: an editor is the sole surface for open pages, edits write through to the vault folder with debounced per-page auto-save, and the pane reports dirty, saving, and failed states so edits are never lost silently.

## Requirements

### Requirement: The open page is edited in place
Opening a page SHALL put its content in an editable, WYSIWYG Markdown surface inside the editor pane; a page SHALL NOT be shown through a read-only preview. The page title (its filename stem) SHALL appear as a heading above the surface and SHALL NOT be editable inside it (renaming is out of scope). Standard Markdown constructs — headings, paragraphs, emphasis, lists, links, code, blockquotes, tables — SHALL be editable and SHALL serialize back to Markdown for saving.

#### Scenario: A page opens editable
- **WHEN** the user opens a page
- **THEN** its content appears in the editor as editable WYSIWYG text, with the page title shown as a heading

#### Scenario: Formatting round-trips to Markdown
- **WHEN** the user edits headings, emphasis, lists, links, code, blockquotes, or tables in the editor
- **THEN** the serialized content is Markdown that preserves those edits

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

### Requirement: Opening a reference from the editor
The editor SHALL open a reference's target page when the user plain-clicks the reference's badge, or presses Mod+Enter (Cmd/Ctrl+Enter) with the caret inside a reference. Opening SHALL resolve the reference's name to a page exactly as the links panel does: the existing page when one matches, otherwise a blank page that materializes on first save. Activating a reference to the page already open SHALL NOT navigate. The keyboard shortcut SHALL be listed in the app's keyboard-shortcuts reference.

#### Scenario: Clicking a badge opens the page
- **WHEN** the user clicks the badge of a reference whose target page exists
- **THEN** that page opens in the editor pane

#### Scenario: Clicking a reference to a missing page opens a blank page
- **WHEN** the user clicks the badge of a reference whose target has no file on disk
- **THEN** a blank page for that target opens and is written on first save

#### Scenario: The keyboard opens the reference at the caret
- **WHEN** the caret sits inside a reference and the user presses Mod+Enter
- **THEN** the target page opens

#### Scenario: A self-reference does not navigate
- **WHEN** the open page contains a reference to its own title and the user activates it
- **THEN** the app stays on the open page

### Requirement: Edits auto-save with per-page drafts
Edited content SHALL be preserved when the user navigates away from a page and restored when that page is opened again in the same session, even when the debounced save has not fired yet. Saves SHALL be debounced: a page is written only after editing pauses. Saving SHALL write the content through the vault storage seam to the page's file. A save SHALL NOT run when the edited content equals the last saved content.

#### Scenario: Leaving a page preserves the draft
- **WHEN** the user edits a page and navigates to another page before the debounced save fires
- **THEN** the edited page's text is kept, written in the background, and shown again when the user returns to that page

#### Scenario: An unchanged page is not rewritten
- **WHEN** a page is open and no edit is made
- **THEN** no save is triggered and the file is not written

### Requirement: Failed saves are not silent
When a save fails, the page SHALL remain dirty, the failure SHALL stay visible on the pane, and the next edit SHALL re-arm saving. The un-saved content SHALL remain in the page's draft and SHALL NOT be discarded.

#### Scenario: A failed save keeps the draft and shows the error
- **WHEN** a save fails, for example when the folder's permission is no longer granted
- **THEN** the pane shows "Save failed", the page stays dirty, and its edited content remains intact

#### Scenario: Editing again retries saving
- **WHEN** the user edits again after a failed save
- **THEN** saving re-arms and a later successful save clears the failure

### Requirement: The editor pane shows exactly one live editor per open page
Opening a page SHALL render exactly one editor surface seeded with that page's content (its draft if one exists, otherwise its indexed content). No empty, stale, or duplicate editor surfaces SHALL appear. Switching pages SHALL replace the current editor with the newly selected page's editor; the previous page's editor SHALL be fully torn down even when the switch happens while the previous editor is still initializing.

#### Scenario: Opening a page renders a single editor with its content
- **WHEN** a page is open in the editor pane
- **THEN** the pane contains exactly one editor surface, and it is seeded with that page's content

#### Scenario: A rapid page switch leaves no stale editor behind
- **WHEN** the user switches to another page while the previous page's editor is still initializing
- **THEN** the pane shows exactly one editor surface, seeded with the newly selected page's content, and no empty editor from the previous page remains

### Requirement: The pane keeps its scroll position across saves
The editor pane SHALL preserve the pane's scroll position while the user edits, across the index refresh that follows a save and across any other refresh of the same page. The pane SHALL scroll back to the top only when the open page changes to a different page.

#### Scenario: Saving a scrolled page does not jump to the top
- **WHEN** the user edits near the end of a long page, the pane is scrolled down, and the save completes
- **THEN** the pane stays scrolled to the same position and the cursor remains visible

#### Scenario: Switching pages scrolls the pane to the top
- **WHEN** the user switches to a different page while the pane is scrolled down
- **THEN** the pane scrolls back to the top for the newly opened page

### Requirement: Dropped files are copied into the vault and linked at the cursor
When files are dropped onto the editor pane while a page is open, the app SHALL copy each dropped file into the vault's `assets/` folder under a unique name and insert a markdown link for every file that was copied successfully at the cursor position in the open page: `![name](assets/name.ext)` for image files, `[name](assets/name.ext)` for all other files. The insertion SHALL happen through the normal edit path so the copy appears in the page's autosaved draft.

#### Scenario: Dropping one image inserts an image link
- **GIVEN** an open page with the caret at a position in the editor
- **WHEN** a single PNG file is dropped onto the editor pane
- **THEN** the file is copied into the vault under `assets/` with a unique name, and `![(name)](assets/(name).png)` is inserted at the caret position

- **GIVEN** no image-extension file
- **WHEN** a PDF file is dropped onto the editor pane
- **THEN** the file is copied into the vault and a plain markdown link `[(name)](assets/(name).pdf)` is inserted at the caret position

#### Scenario: Dropping several files inserts one link per copied file
- **GIVEN** an open page
- **WHEN** multiple files are dropped at once
- **THEN** each file is copied sequentially, one link is inserted per successfully copied file, and a file whose copy failed yields no link

#### Scenario: Drops never navigate the app away
- **GIVEN** the app window showing either the editor pane or the empty start screen
- **WHEN** a file is dropped anywhere on the pane
- **THEN** the browser's default drop behavior (navigating to the dropped file) is prevented, and when no page is open nothing is copied and no link is inserted

#### Scenario: Dropped directories are ignored
- **GIVEN** an open page
- **WHEN** a folder is dropped onto the editor pane
- **THEN** no files are copied from the folder, no links are inserted, and the app does not navigate

### Requirement: Pasted files are copied into the vault and linked at the cursor
When the clipboard a paste carries from contains one or more files and no plain text, and a page is open, the app SHALL treat each file exactly as a dropped one: copy it into the vault's `assets/` folder under a unique name, and insert a markdown link for every file that was copied successfully at the caret position in the open page — `![name](assets/name.ext)` for image files, `[name](assets/name.ext)` for others. The insertion SHALL go through the normal edit path, so the reference appears in the page's autosaved draft and renders. Where the clipboard offers only a generic name for the file — a bitmap handed over as `image.png` or `blob`, or a name carrying no stem at all — the asset SHALL instead be named from the paste's local time, keeping an extension that matches the file's type, so repeated pastes produce identifiable names rather than `image-1`, `image-2`. A file whose clipboard name is meaningful SHALL keep it. A paste whose clipboard carries plain text SHALL leave the editor's own markdown-aware paste to handle it, whether or not files accompany it. A paste with no files SHALL change nothing, and a paste with no page open SHALL copy nothing.

#### Scenario: Pasting a screenshot attaches it and shows it
- **GIVEN** an open page with the caret in the editor and a clipboard holding a bitmap under a generic name
- **WHEN** the user pastes
- **THEN** the image is copied into the vault under `assets/` with a name carrying the paste's time, an image link to it is inserted at the caret, and the reference renders the pasted bytes

#### Scenario: A pasted file with a real name keeps it
- **GIVEN** an open page and a clipboard holding a file named `Q3 report.pdf`
- **WHEN** the user pastes
- **THEN** the vault gains `assets/Q3 report.pdf` - numbered like any other colliding asset name - and a plain link to it is inserted at the caret

#### Scenario: Pasted text still follows the text rules
- **GIVEN** a clipboard carrying plain text, and one carrying plain text alongside a file
- **WHEN** the user pastes either
- **THEN** the editor's markdown-aware paste handles it as before and no file is copied into the vault

#### Scenario: A paste with nothing to attach changes nothing
- **GIVEN** an empty clipboard, and a clipboard holding files with no page open
- **WHEN** the user pastes
- **THEN** no vault file is written and the editor's content is unchanged

#### Scenario: A failed copy leaves no link
- **GIVEN** an open page and a clipboard holding two files whose second copy fails
- **WHEN** the user pastes
- **THEN** only the first file lands in the vault and only its link is inserted

### Requirement: Vault image references render in the editor
When an open page's markdown references an image whose path points into the vault — a root-relative path carrying no URL scheme — the editor SHALL display that file's bytes in place of the reference, reading them through the storage seam's binary read. The page's markdown SHALL NOT change: the document keeps the path it had, so the file stays canonical and reload-stable (ADR-0001). A reference the vault cannot resolve — no such file, or a path the storage rejects — SHALL be left as it renders now, and that path SHALL NOT be read again for the rest of the page's time open. A reference carrying a scheme (`http:`, `https:`, `data:`, `blob:`) SHALL be left untouched: the editor reads no vault file for it and rewrites nothing. Each vault path SHALL be read at most once per open page, when the page's images are first rendered or when a reference is added, and never as part of handling a keystroke.

#### Scenario: A vault image reference shows the file's bytes
- **GIVEN** an open page whose markdown reads `![photo](assets/photo.png)` and a vault holding that file
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

#### Scenario: Each vault image is read once per page
- **GIVEN** an open page displaying a vault image
- **WHEN** the user edits the page
- **THEN** the vault file is not read again and the displayed bytes do not change

### Requirement: Asset copies are never overwritten
The copy flow SHALL ensure each copied asset lands under a name that does not collide with an existing vault file, so an earlier asset is never silently replaced by a later drop.

#### Scenario: A colliding file name gets a numbered suffix
- **GIVEN** `assets/photo.png` already exists in the vault
- **WHEN** another `photo.png` is dropped onto the editor pane
- **THEN** the new file is saved as `assets/photo-1.png` and the inserted link points at `assets/photo-1.png`

### Requirement: Empty pages show a placeholder inviting typing
An open page whose content is empty SHALL show a short placeholder hint in the editor pane at the start of the document, inviting the user to type. The hint SHALL NOT appear while the page has any content, SHALL return when the user deletes all content, SHALL NOT be selectable as text, and SHALL NOT be part of the page's content: it never appears in the document's Markdown and is never written to the file.

#### Scenario: A blank page invites typing
- **WHEN** an open page has no content
- **THEN** the editor pane shows a placeholder hint at the document start, and the page's content — and the file once saved — contain no placeholder text

#### Scenario: Typing hides the placeholder
- **WHEN** the user types into an empty page
- **THEN** the placeholder disappears and stays hidden while the page has content

#### Scenario: Emptying the page brings the placeholder back
- **WHEN** the user deletes all content from a page that had content
- **THEN** the placeholder hint shows again at the document start

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

### Requirement: A code block that ends a page keeps a block after it
An open page whose last top-level block is a code block SHALL hold an empty paragraph after it, so a block to continue in always exists. The paragraph SHALL be maintained by the editor rather than authored: it appears whether the code block was typed, pasted, or opened from a file, and it never appears after a block that is already a paragraph, so the document does not accumulate empty blocks. Moving into it SHALL work the ways a user tries: `ArrowDown` from the code block's last line, and a click below the code block. `Enter` inside the code block SHALL continue to add a code line, and `Mod-Enter` SHALL continue to exit the block.

#### Scenario: The block after a trailing code block exists
- **GIVEN** an open page whose markdown ends with a fenced code block
- **WHEN** the page renders
- **THEN** the document holds an empty paragraph after the code block

#### Scenario: Arrow down leaves a trailing code block
- **GIVEN** an open page whose last block is a code block, with the caret on the code block's last line
- **WHEN** the user presses `ArrowDown` and types
- **THEN** the caret is in the paragraph after the code block and the typed text lands there, not in the code

#### Scenario: Enter still adds a code line
- **GIVEN** the caret inside a code block that ends the page
- **WHEN** the user presses `Enter`
- **THEN** a new line is added inside the code block and no paragraph is inserted

#### Scenario: No empty paragraph accumulates after a paragraph
- **GIVEN** a page whose last block is a paragraph
- **WHEN** the document changes
- **THEN** no extra empty paragraph is appended

### Requirement: Serialization never writes a trailing blank line
The Markdown a document serializes to SHALL end with a single newline and SHALL NOT end with blank lines, so the empty paragraph the editor maintains after a trailing code block never reaches the vault: opening such a page writes nothing, and editing it writes only the user's own text. Trimming SHALL be a property of every serialization the app performs — the change stream that drives autosave, the content the app reads for a draft, and the copy-as-markdown flavor — so no path disagrees about what the page holds.

#### Scenario: Opening a page that ends with a code block writes nothing
- **GIVEN** a vault file ending with a fenced code block
- **WHEN** the page is opened and left alone
- **THEN** the maintained paragraph does not mark the page dirty and the file is not rewritten

#### Scenario: Editing after the code block writes only the new text
- **GIVEN** the same page, with the caret moved into the paragraph after the code block
- **WHEN** the user types and the page saves
- **THEN** the file ends with the code fence, a blank line, and the typed paragraph, and carries no trailing blank line

#### Scenario: A hand-made trailing empty paragraph is not persisted
- **GIVEN** a page whose document ends with an empty paragraph
- **WHEN** the page saves
- **THEN** the file ends with the last non-empty block and a single newline

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

### Requirement: The status bar shows the open page's file path
An open page SHALL have its file path displayed in the status bar, rendered as a breadcrumb of non-interactive segments — `notes / Deep / 2026.md` — with the `.md` extension kept on the final segment. The breadcrumb SHALL be purely informational: its segments SHALL NOT be links, SHALL NOT navigate, and SHALL NOT copy anything. It SHALL display the page's path regardless of whether the file exists yet (a not-yet-created page shows the path its first save will create), and SHALL NOT indicate the file's existence, save state, or staleness. An empty page SHALL show the same breadcrumb. The breadcrumb SHALL appear only when a page is open; without a page — on empty, indexing, or search-results surfaces — the path group SHALL be empty.

#### Scenario: The file behind the title is shown in the status bar
- **GIVEN** the vault contains `notes/Deep/2026.md` whose content begins with a heading that differs from the file name
- **WHEN** the user opens that page
- **THEN** the status bar shows the breadcrumb `notes / Deep / 2026.md`

#### Scenario: A journal day shows its real file
- **WHEN** the user opens the journal day `journals/2026-09-08.md` from the calendar
- **THEN** the status bar shows `journals / 2026-09-08.md`, with the file name segment intact

#### Scenario: A root-level file shows a single segment
- **WHEN** the user opens a page at the vault root such as `todo.md`
- **THEN** the status bar shows the single segment `todo.md`

#### Scenario: A page with no file yet shows its would-be path
- **WHEN** the user opens a page that has no file on disk yet (for example, a day from the journal calendar that has never been written)
- **THEN** the status bar shows the path that page will be saved under

#### Scenario: The path group is empty without a page
- **WHEN** no page is open, the folder is still indexing, or the main area shows search results
- **THEN** the status bar's path group shows no breadcrumb

### Requirement: The status bar reports the open page's save state
The app SHALL surface the open page's save state in the status bar: no save status while the page is clean, "Unsaved changes" while the page has edits not yet saved, "Saving…" while a save is in flight, and "Save failed" when the latest save failed. The status SHALL remain visible at all times: the bar sits outside the pane's scroll region, so the save status never scrolls with the document.

#### Scenario: The save lifecycle shows through
- **WHEN** the user types, then pauses, and the save succeeds
- **THEN** the status bar shows "Unsaved changes", then "Saving…", then clears

#### Scenario: The save status never scrolls away
- **WHEN** the user scrolls a long open page while a save is in flight
- **THEN** the "Saving…" status stays visible in the status bar rather than scrolling with the document

### Requirement: Typing a reference offers existing matching pages
While the caret sits at the end of an in-progress reference token in the open page (`#` followed by word characters, or `#[[` followed by text), the editor SHALL offer a popup listing candidate pages whose names match the typed text. Candidates SHALL be existing pages only, listed in the app's page order (pinned pages first, then most recently modified), capped at a small fixed number of rows. A candidate matches when its name starts with the typed text, or when one of its words (delimited by space, `-`, or `_`) starts with it; matching SHALL be case-insensitive and SHALL NOT match a fragment inside a word. Journal pages SHALL be candidates like any other page. Each row SHALL show the page's name exactly as it exists on disk.

The popup SHALL NOT appear when the typed text is empty, when no candidate matches, when the reference being typed sits inside an inline code span or a fenced code block, or when the caret is not at the end of the token (for example inside an existing `#[[reading list]]`, or after a `/` that closes the word form).

#### Scenario: Typing a reference prefix lists matching pages
- **WHEN** the user types `#rea` in an open page and pages named `reading` and `reading list` exist
- **THEN** both appear as rows, and the page matching the typed prefix most recently (pinned first, then last modified) is the first row

#### Scenario: A word inside a name matches
- **WHEN** the user types `#[[list` and a page named `reading list` exists
- **THEN** `reading list` appears as a row

#### Scenario: Journal days are candidates
- **WHEN** the user types `#2026` and journal days under `journals/` exist for that year
- **THEN** those days appear as rows showing their date names (`2026-09-10`), with no journal-specific styling or section header

#### Scenario: Rows show the on-disk name
- **WHEN** the vault holds `Reading.md` and the user types `#read`
- **THEN** the row reads `Reading` and not `read`

#### Scenario: A name containing a space completes from either trigger
- **WHEN** the user types `#reading` and picks the page `reading list`
- **THEN** the in-progress token is replaced by `#[[reading list]]`

#### Scenario: A bare `#` opens nothing
- **WHEN** the user types `#` at the start of a line, before typing any name character
- **THEN** no popup appears, and typing a space next still produces a Markdown heading

#### Scenario: No matches means no popup
- **WHEN** the user types `#zzz` and no page name matches
- **THEN** no popup appears and the editor behaves as it does today

#### Scenario: Code is never completed
- **WHEN** the caret is inside an inline code span or a fenced code block and the text contains `#rea`
- **THEN** no popup appears

#### Scenario: A caret inside a token is not completed
- **WHEN** the caret sits inside `#[[reading list]]` rather than at its end, or after `#tag/`
- **THEN** no popup appears

### Requirement: The completion popup is keyboard-navigable
The first row SHALL be active as soon as the popup appears. `ArrowDown` and `ArrowUp` SHALL move the active row, wrapping at the ends. `Enter` and `Tab` SHALL accept the active row. `Escape` SHALL dismiss the popup. The popup SHALL claim only these unmodified keys, and only while it is visible; while the popup is not visible every keybinding SHALL behave exactly as it does without reference completion. Keys with a modifier (`Ctrl`, `Cmd`, `Alt`) and `Shift+Tab` SHALL NOT be claimed, so `Mod+Enter` keeps activating the reference at the caret. Accepting or dismissing SHALL keep that token text from reopening the popup until the text changes. The popup SHALL hide when the editor loses focus.

#### Scenario: Arrow keys move the active row
- **WHEN** three rows are shown and the user presses `ArrowDown` twice, then `ArrowUp` once
- **THEN** the active row is the second row, and pressing `ArrowUp` again wraps to the last

#### Scenario: Type and Enter accepts the first row
- **WHEN** the user types `#rea` and presses `Enter`
- **THEN** the best matching row is accepted and the paragraph is not split

#### Scenario: Tab accepts the active row
- **WHEN** the popup is visible and the user presses `Tab`
- **THEN** the active row is accepted and focus stays in the editor

#### Scenario: Escape dismisses without accepting
- **WHEN** the popup is visible and the user presses `Escape`
- **THEN** the popup closes, the typed text is unchanged, and the popup does not reopen while that same token text remains

#### Scenario: A dismissed token reopens after an edit
- **WHEN** the user dismisses the popup for `#rea` and then types another character
- **THEN** the popup may appear again for the new token text

#### Scenario: With the popup hidden, editor keys are unchanged
- **WHEN** no popup is visible and the user presses `Enter`, `Tab`, or `ArrowDown`
- **THEN** the paragraph is split, the list item is indented, or the caret moves, exactly as without this change

#### Scenario: Modified keys are never claimed
- **WHEN** the popup is visible and the user presses `Mod+Enter`
- **THEN** the reference at the caret is activated as before, and the popup does not accept a row

#### Scenario: Losing focus hides the popup
- **WHEN** the popup is visible and the user clicks the sidebar
- **THEN** the popup is hidden

### Requirement: Accepting a candidate writes the reference and saves it normally
Accepting a row SHALL replace the in-progress token with the complete reference token for the picked page, in the page's on-disk casing, keeping the form the user was typing (a `#[[` trigger inserts the bracketed form; a `#` trigger inserts `#name`, escalating to `#[[name]]` when the name is not a single word). The caret SHALL land immediately after the inserted token, with no trailing space added. The insertion SHALL be one edit that reaches the page's draft and the debounced save like any other edit, so it round-trips to Markdown and is undoable. Focus and the document selection SHALL remain in the editor.

#### Scenario: Picking a word name inserts the word form
- **WHEN** the user types `#read` and accepts the page `reading`
- **THEN** the page contains `#reading` and the caret sits after it

#### Scenario: A bracketed trigger keeps its brackets
- **WHEN** the user types `#[[read` and accepts the page `reading`
- **THEN** the page contains `#[[reading]]`

#### Scenario: The picked name uses its on-disk casing
- **WHEN** the user types `#read` and accepts the page `Reading`
- **THEN** the page contains `#Reading`

#### Scenario: The insertion saves and round-trips
- **WHEN** the user accepts a row and waits for the debounced save
- **THEN** the file on disk contains the reference token, reopening the page shows the same token, and a single undo reverts the insertion

#### Scenario: Focus stays in the editor
- **WHEN** the user accepts a row with `Enter`, or picks a row with the mouse
- **THEN** the editor keeps focus, the caret is after the inserted token, and the page is not navigated
