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

### Requirement: References are plain editable text
In the editor, references in Folio's two forms — `#word` and `#[[Page]]` — SHALL render as ordinary plain text that the user can edit like any other text; SHALL NOT render as chips, buttons, or other non-editable nodes; and SHALL NOT navigate or respond to clicks. Plain `[[Page]]` wikilinks SHALL render as literal editable text as well. Editing a reference edits the underlying Markdown text directly.

#### Scenario: A reference is editable text
- **WHEN** the editor body contains `#ideas` or `#[[reading list]]`
- **THEN** it appears as plain editable text and no chip or clickable node is rendered

#### Scenario: A plain wikilink stays literal
- **WHEN** the editor body contains `[[Inbox]]`
- **THEN** it appears as literal editable text

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