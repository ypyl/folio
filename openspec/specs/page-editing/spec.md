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

### Requirement: Dropped files are copied into the vault and linked at the drop point
When files are dropped onto the editor pane while a page is open, the app SHALL copy each dropped file into the vault's `assets/` folder under a unique name and insert a markdown link for every file that was copied successfully at the **drop point** in the open page: an image link showing the file for image files, a plain link otherwise, with the destination written in the readable form the escaping rule requires ("A written vault-file link has a destination Markdown reads"). The drop point SHALL be the position in the page's text nearest the point where the pointer released the file, not the caret's last position. Where the release point names no position the link can occupy, the link SHALL be inserted at the caret instead. The insertion SHALL happen through the normal edit path so the copy appears in the page's autosaved draft.

#### Scenario: Dropping one image inserts an image link
- **GIVEN** an open page with the caret at a position in the editor
- **WHEN** a single PNG file is dropped onto the editor pane
- **THEN** the file is copied into the vault under `assets/` with a unique name, and `![(name)](assets/(name).png)` is inserted at the drop point

#### Scenario: A dropped file lands where it was aimed, not where the caret was
- **GIVEN** an open page with a caret near the top of the document
- **WHEN** a file is dropped onto a paragraph further down and the caret does not move
- **THEN** the link is inserted at the paragraph the pointer was over, and the page's text above it is unchanged

#### Scenario: A file dropped below the last block is appended
- **GIVEN** an open page whose document ends above the pane's bottom edge
- **WHEN** a file is released below the last block
- **THEN** the link is inserted at the end of the page

#### Scenario: Dropping a non-image file inserts a plain link
- **GIVEN** no image-extension file
- **WHEN** a PDF file is dropped onto the editor pane
- **THEN** the file is copied into the vault and a plain markdown link `[(name)](assets/(name).pdf)` is inserted at the drop point

#### Scenario: A dropped file whose name needs escaping is written as a readable link
- **GIVEN** an open page with the caret in the editor
- **WHEN** a file named `Q3 report.pdf` is dropped onto the editor pane
- **THEN** the vault gains `assets/Q3 report.pdf` and the text inserted at the drop point is `[Q3 report](assets/Q3%20report.pdf)`, which renders as a link to that file

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
When the clipboard a paste carries from contains one or more files and no plain text, and a page is open, the app SHALL treat each file exactly as a dropped one: copy it into the vault's `assets/` folder under a unique name, and insert a markdown link for every file that was copied successfully at the caret position in the open page — an image link showing the file for image files, a plain link otherwise, with the destination written in the readable form the escaping rule requires ("A written vault-file link has a destination Markdown reads"). The insertion SHALL go through the normal edit path, so the reference appears in the page's autosaved draft and renders. Where the clipboard offers only a generic name for the file — a bitmap handed over as `image.png` or `blob`, or a name carrying no stem at all — the asset SHALL instead be named from the paste's local time, keeping an extension that matches the file's type, so repeated pastes produce identifiable names rather than `image-1`, `image-2`. A file whose clipboard name is meaningful SHALL keep it. A paste whose clipboard carries plain text SHALL leave the editor's own markdown-aware paste to handle it, whether or not files accompany it. A paste with no files SHALL change nothing, and a paste with no page open SHALL copy nothing.

#### Scenario: Pasting a screenshot attaches it and shows it
- **GIVEN** an open page with the caret in the editor and a clipboard holding a bitmap under a generic name
- **WHEN** the user pastes
- **THEN** the image is copied into the vault under `assets/` with a name carrying the paste's time, an image link to it is inserted at the caret, and the reference renders the pasted bytes

#### Scenario: A pasted file with a real name keeps it
- **GIVEN** an open page and a clipboard holding a file named `Q3 report.pdf`
- **WHEN** the user pastes
- **THEN** the vault gains `assets/Q3 report.pdf` - numbered like any other colliding asset name - and the text `[Q3 report](assets/Q3%20report.pdf)` is inserted at the caret, which renders as a link to that file

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

### Requirement: Vault images fit the pane and expand to their original size

When an open page displays an image whose reference the vault resolved, the editor SHALL display it fitted to the width of the pane's content: an image wider than that width SHALL be scaled down to it with its aspect ratio preserved, and an image narrower than it SHALL be displayed at its own width — never enlarged. The displayed image SHALL carry a control in its corner that toggles between the fitted size and the image's own size. While expanded, the image SHALL be displayed at its own width, SHALL overflow the pane where it is wider than the pane, and the pane SHALL scroll to it. The control SHALL be visible while the pointer is over the image or the control has keyboard focus, SHALL stay visible while the image is expanded, and SHALL carry an accessible name that names the action it performs — expanding while the image is fitted, collapsing while it is expanded. The control SHALL be present only for an image the vault resolved. The expanded state SHALL NOT reach the document or any stored state: the page's markdown SHALL keep the reference it had, the file on disk SHALL be unchanged, and the state SHALL be discarded when the page is left or reloaded (ADR-0001, ADR-0009). A reference carrying a scheme (`http:`, `https:`, `data:`, `blob:`) and a vault reference the vault cannot resolve SHALL render exactly as they render today — natural size, no control — and the vault SHALL NOT be read for them on account of this requirement.

#### Scenario: A wide vault image is scaled to the pane
- **GIVEN** an open page displaying a vault image whose own width is greater than the pane's content width
- **WHEN** the page renders
- **THEN** the image is displayed at the pane's content width with its aspect ratio preserved

#### Scenario: A narrow vault image is left at its own size
- **GIVEN** an open page displaying a vault image whose own width is less than the pane's content width
- **WHEN** the page renders
- **THEN** the image is displayed at its own width, not enlarged

#### Scenario: The control expands an image to its original size
- **GIVEN** an open page displaying a fitted vault image
- **WHEN** the user activates the image's control
- **THEN** the image is displayed at its own width, overflowing the pane where it is wider, and the control is still present and visible

#### Scenario: The control collapses an expanded image
- **GIVEN** an open page displaying a vault image expanded to its own width
- **WHEN** the user activates the image's control again
- **THEN** the image is displayed fitted to the pane again

#### Scenario: The control is revealed by the pointer and by focus
- **GIVEN** an open page displaying a fitted vault image
- **WHEN** the pointer moves over the image, or the control receives keyboard focus
- **THEN** the control is visible

#### Scenario: The control names the action it performs
- **GIVEN** an open page displaying a vault image
- **WHEN** the image is fitted
- **THEN** the control's accessible name names expanding it, and once expanded the same control's accessible name names collapsing it

#### Scenario: Expanding changes nothing in the page
- **GIVEN** an open page whose markdown reads `![photo](assets/photo.png)`
- **WHEN** the user expands the image and then edits the page
- **THEN** the page's markdown still reads `![photo](assets/photo.png)`, with no width or size in it, and the file on disk is unchanged

#### Scenario: A remote image gets neither the fit nor the control
- **GIVEN** a page whose markdown references an image by an `https:` URL
- **WHEN** the page renders
- **THEN** the image keeps that URL and its own size, no control is shown for it, and the vault is not read for it

#### Scenario: An unresolvable vault reference gets no control
- **GIVEN** a page referencing a vault image path that holds no file
- **WHEN** the page renders
- **THEN** the reference renders as it does today and no control is shown for it

#### Scenario: The expanded state does not outlive the page
- **GIVEN** an open page whose vault image is expanded
- **WHEN** the user opens another page and returns to the first
- **THEN** the image is displayed fitted to the pane

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

### Requirement: External URLs open on Ctrl+Click
A URL written bare in a page's text — `http://…`, `https://…`, or `www.…` — SHALL be displayed in the app's link style (brand ink, no underline) while the document and the saved Markdown keep exactly the characters the user typed: no formatting mark SHALL be created and the text SHALL NOT be rewritten. Ctrl+Click (Cmd+Click on macOS) on that text SHALL open it in the browser — a new tab, or the system browser when the app runs installed — and SHALL NOT navigate the app itself away. Ctrl+Click on a markdown link SHALL open its target the same way. A plain click SHALL open nothing: it places the caret where it was clicked, so a URL and a link's text stay editable. A click on a link whose target is a bare fragment — `#section` — SHALL open nothing, in any modifier state, because nothing is served at that target. A link whose target is a vault-relative path is not covered here: it is governed by "Vault asset links open the stored file".

#### Scenario: A bare URL becomes a link and opens on Ctrl+Click
- **GIVEN** a page whose text contains `https://anthropic-partners.skilljar.com`
- **WHEN** the page renders and the user Ctrl+Clicks that text
- **THEN** it is displayed as a link in brand ink, the browser opens the URL in a new tab, and the page stays open where it was

#### Scenario: A markdown link opens the same way
- **GIVEN** a page containing `[Anthropic](https://anthropic-partners.skilljar.com)`
- **WHEN** the user Ctrl+Clicks the link text
- **THEN** the browser opens that URL, and the app does not navigate away from the page

#### Scenario: A plain click only edits
- **GIVEN** a page containing a bare URL and a markdown link
- **WHEN** the user clicks either without a modifier
- **THEN** no tab opens, the caret is placed where the click landed, and the text is unchanged

#### Scenario: The file keeps the characters typed
- **GIVEN** a page whose text contains a bare URL
- **WHEN** the page saves
- **THEN** the Markdown holds that URL exactly as typed, with no autolink mark and no added brackets

#### Scenario: Non-external targets do not open
- **GIVEN** a page containing text reading `#section`
- **WHEN** the user Ctrl+Clicks it
- **THEN** no tab opens and the document is unchanged, because a fragment names nothing this app serves

#### Scenario: Near misses stay text
- **GIVEN** a page containing `see https://example.com/path.` and a URL inside inline code
- **WHEN** the page renders
- **THEN** the sentence's trailing period is not part of the link, and the URL inside code is not displayed as a link

### Requirement: Vault asset links open the stored file
When a page's markdown carries a link whose target is a path inside the vault — a target with no URL scheme and no leading `/`, such as `assets/q3-report.pdf` — Ctrl+Click (Cmd+Click on macOS) on the link's text SHALL open the file stored at that path, and SHALL NOT navigate the app away from the open page. The target SHALL be read as the vault path the link carries, whether the link spells it literally or percent-encoded.

What opens SHALL follow the file's type. A type the browser can display — PDF, image, audio, video, and plain text — SHALL be shown in a new tab displaying the stored bytes. Any other type SHALL be delivered as a download, so the application the operating system has registered for that type can open it.

The vault SHALL be read once per activation, through the same storage seam every other read uses, and SHALL NOT be read as part of handling a keystroke. The gesture SHALL NOT modify the page's markdown or the file on disk: the reference keeps the path it had and the file keeps its bytes, so the vault stays canonical (ADR-0001). The app SHALL write nothing anywhere as part of this gesture — the download, where there is one, is performed by the browser.

Because a browser cannot hand a file on disk to the operating system in place, what opens is a copy of the file as it was read, not the vault file: an edit made in whichever application opens it SHALL NOT be observed, merged, or saved into the vault by the app.

A target the vault cannot resolve — no such file, or a path the storage rejects — SHALL open nothing and SHALL leave the app and its document unchanged. A plain click SHALL remain an editing gesture: it places the caret where it was clicked and opens nothing. A target carrying a URL scheme and a bare fragment are governed by "External URLs open on Ctrl+Click" and are unaffected.

#### Scenario: A vault file that the browser can display opens in a tab
- **GIVEN** an open page whose markdown reads `[Q3 report](assets/q3-report.pdf)` and a vault holding that file
- **WHEN** the user Ctrl+Clicks the link text
- **THEN** the stored bytes are displayed in a new tab, the page stays open, and the file on disk is unchanged

#### Scenario: A vault file the browser cannot display is delivered as a download
- **GIVEN** an open page whose markdown links to a vault file of a type the browser does not display
- **WHEN** the user Ctrl+Clicks the link text
- **THEN** the browser downloads the file, so the operating system can open it with the application registered for that type, and the app stays on the open page

#### Scenario: A plain click still edits the link
- **GIVEN** a page containing a link to a vault file
- **WHEN** the user clicks it without a modifier
- **THEN** nothing opens, the caret is placed where the click landed, and the text is unchanged

#### Scenario: An unresolvable vault target opens nothing
- **GIVEN** a page whose markdown links to a vault path holding no file
- **WHEN** the user Ctrl+Clicks the link text
- **THEN** nothing opens, the document is unchanged, and the app does not navigate

#### Scenario: The reference and the file are never rewritten
- **GIVEN** an open page linking to a vault file, and the vault file's bytes
- **WHEN** the user Ctrl+Clicks the link, and the page is then edited and saved
- **THEN** the page's markdown still holds the same path, and the file on disk still holds the same bytes

#### Scenario: Opening a vault file costs nothing per keystroke
- **GIVEN** an open page that links to vault files, and a vault reader that counts reads
- **WHEN** the user types in the page and then Ctrl+Clicks a vault link
- **THEN** the counts show no vault read for the typing and exactly one for the activation

#### Scenario: The external and fragment rules are untouched
- **GIVEN** a page containing an `https:` link and text reading `#section`
- **WHEN** the user Ctrl+Clicks either
- **THEN** the external URL opens in a tab and the fragment opens nothing, as before

### Requirement: Struck text renders crossed
When a page's text contains a struck run — two tildes, then at least one character with no tilde and no leading or trailing space, then two tildes — the editor SHALL display it with a line through it, in every block a page can hold. Where runs share text, the pair that closes first wins, so `~~a~~b~~` strikes `a` and leaves the tail alone. The run SHALL be a presentational decoration over the literal text: the document, the saved Markdown, the clipboard, and the index SHALL keep the tildes exactly as the user wrote them, and no formatting mark SHALL be created, so nothing toggles a struck run and it behaves as ordinary text for editing, copying, and saving. Text inside inline code or a fenced code block SHALL NOT be decorated, and neither SHALL a lone tilde, an empty pair, a pair whose content starts or ends with a space, or a run containing a tilde inside it. The decoration SHALL be derived from the text in the same pass as the editor's reference badges, so it adds no work proportional to the document on a keystroke.

#### Scenario: A struck run shows a line, and the file keeps its tildes
- **GIVEN** an open page containing `~~Responsible AI, Safety & Risk for Architects~~`
- **WHEN** the page renders
- **THEN** the run is shown with a line through it, and the page's Markdown still reads `~~Responsible AI, Safety & Risk for Architects~~` after the page saves

#### Scenario: A run survives save and reopen as literal text
- **GIVEN** a page whose saved Markdown contains a struck run
- **WHEN** the page is closed and opened again
- **THEN** the run is still decorated with its tildes intact, with no formatting mark added to the document

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
- **THEN** the struck run keeps its decoration, and the editor rescan is limited to the block the edit touched

### Requirement: A Markdown table is a table in the editor

A GFM pipe table in a page SHALL render as a table in the editor: a header row, body rows, and cells edited in place as ordinary text. A reference written in a cell SHALL render as a badge and SHALL activate like any other reference. The column alignment written in the table's delimiter row SHALL be preserved as the page is edited and SHALL be settable from the editor. The saved Markdown SHALL remain a pipe table, so a table in the file is a table on screen and a table again after the page is reloaded. Table cells SHALL be written in the app's canonical form — padded, with the delimiter row in its short form — so a hand-written table adopts that form the first time the page is saved. A cell the table model holds no text in SHALL be written as `<br />`, and a table that arrives with a header row and no body rows SHALL be given one empty body row, because the editor's table has no cell-less row to hold it. Tables SHALL be created by typing `|column-count x row-count|` followed by a space, by a keyboard chord, and by pasting Markdown table text; rows and columns SHALL be added and removed from the editor; and the caret SHALL move between cells with `Tab` and `Shift-Tab`, while `Enter` SHALL leave the table. No other Markdown construct SHALL change: a bare URL, a struck run, a task-list marker, and footnote syntax SHALL parse and serialize exactly as they do without tables, and no autolink, task-list, footnote, or strikethrough markup SHALL be created. Rendering a table SHALL NOT add work to the keystroke path that grows with the document: a cell is an ordinary block, the editor's decoration, draft, and line-number work SHALL keep its existing bound, and a table's own controls SHALL re-render only for the table they belong to.

#### Scenario: A pipe table opens as a table

- **GIVEN** a page whose Markdown holds a pipe table with a header row and body rows
- **WHEN** the page opens
- **THEN** the editor shows a table with a header row and those body rows, and no cell shows its pipe characters

#### Scenario: A table survives save and reopen

- **GIVEN** an open page holding a table
- **WHEN** the user edits a cell, the save completes, and the page is closed and opened again
- **THEN** the saved Markdown is still a pipe table with the same rows, columns, and cell text, and the reopened page shows that table

#### Scenario: A cell is edited in place, and a reference in it still opens

- **GIVEN** an open page whose table holds `#Inbox` in a cell
- **WHEN** the user edits the cell's text and clicks the `#Inbox` badge
- **THEN** the edit is written to the page's Markdown and the `Inbox` page opens

#### Scenario: Column alignment is kept and can be set

- **GIVEN** a page whose table writes a centered and a right-aligned column in its delimiter row
- **WHEN** the page renders, and the user sets another column's alignment from the editor
- **THEN** each column keeps the alignment it had, and the saved Markdown carries the new alignment for the changed column

#### Scenario: A hand-written table adopts the canonical form on save

- **GIVEN** a page whose file holds a table with short cells and long delimiter dashes
- **WHEN** the user edits the page and the save completes
- **THEN** the saved table has padded cells and a short delimiter row, and still holds the same rows, columns, and text

#### Scenario: An empty cell is written as a break

- **GIVEN** an open page with a table whose body row has an empty cell
- **WHEN** the page saves
- **THEN** that cell is written as `<br />`, and the same cell with text written into it holds that text instead

#### Scenario: A header-only table gains an empty body row

- **GIVEN** a file whose table has a header row and no body rows
- **WHEN** the page is opened and saved
- **THEN** the saved table has one empty body row, and reopening the page shows the header row and that empty row

#### Scenario: Tables are created by typing, by chord, and by paste

- **WHEN** the user types `|4x3|` followed by a space, or activates the insert-table control in the keyboard-shortcuts reference, or pastes Markdown table text into a page
- **THEN** each produces a table in the open page: the typed and chord gestures a table with the columns and rows they ask for, the paste a table with the pasted rows and columns, and no pipe characters are shown in any cell

#### Scenario: Rows and columns are added and removed

- **GIVEN** an open page holding a table with the caret inside it
- **WHEN** the user adds a row, adds a column, and deletes a row through the editor's table controls or the bound chords
- **THEN** the table gains and loses exactly those rows and columns, and the saved Markdown matches the table on screen

#### Scenario: Tab moves between cells and Enter leaves the table

- **GIVEN** an open page with the caret in a table cell
- **WHEN** the user presses `Tab`, then `Shift-Tab`, then `Enter`
- **THEN** the caret moves to the next cell, back to the previous cell, and finally out of the table to the block that follows it

#### Scenario: Only tables come in

- **GIVEN** a page holding a bare `https://example.com`, a `~~struck~~` run, a `- [x] done` line, and footnote syntax
- **WHEN** the page is opened, edited, and saved
- **THEN** the URL keeps its characters with no link mark created, the struck run keeps its tildes and its decoration, the `[x]` line keeps its characters with no checkbox, and the footnote syntax is not turned into a footnote

#### Scenario: A table is one block to the gutter and to search

- **GIVEN** an open page with a table between two paragraphs
- **WHEN** the gutter numbers the page's blocks, and a search result falls on the table's first line
- **THEN** the table is numbered as a single block starting on its first line, and a result on that line anchors to that block

#### Scenario: Typing in a table stays bounded by the table

- **GIVEN** an open page with a table near a long document
- **WHEN** the user types inside a table cell
- **THEN** the work per keystroke does not grow with the document's size: the cell, the block it belongs to, and that table are what is touched, and the editor's existing per-keystroke bounds are unchanged

### Requirement: A click in a table cell places the caret

A pointer press on a table cell SHALL place the caret in that cell, at the text position nearest the pointer, on the first click. It SHALL NOT select the cell, and text typed after that click SHALL be inserted at the caret rather than replacing the cell's contents, so a click can never destroy text the cell already holds. A press on the cell the caret is already in SHALL behave as a press in ordinary text. Selecting a row or a column SHALL remain the work of its handle: pressing a row or a column handle SHALL still select that row or column, and the alignment and delete controls SHALL still act on that selection. Every other table gesture SHALL stay as it is: `Tab` and `Shift-Tab` move between cells, `Enter` leaves the table, and the structural chords add rows and columns.

#### Scenario: A click in a filled cell puts the caret where it was clicked

- **GIVEN** an open page with a table cell whose text reads `ada`
- **WHEN** the user clicks between the `a` and the `d` and types `X`
- **THEN** the cell reads `aXd`, the click having neither selected the cell nor replaced its text

#### Scenario: A click on an empty cell takes typing

- **GIVEN** an open page holding a table with empty cells
- **WHEN** the user clicks the second cell once and types `role`
- **THEN** that cell holds `role`, the other cells are unchanged, and the saved Markdown holds the table with that cell's text

#### Scenario: A click never replaces what a cell holds

- **GIVEN** an open page with a table cell whose text reads `Grace Hopper`
- **WHEN** the user clicks anywhere in that cell once and then types a single character
- **THEN** the cell's original text is still there with that character inserted at the caret

#### Scenario: The handles still select a row or a column

- **GIVEN** an open page holding a table
- **WHEN** the user presses the handle of one column and activates the reference's align-right control for it
- **THEN** that column is selected, the control applies to it, and the saved Markdown carries the alignment for that column

#### Scenario: The keyboard path through a table is unchanged

- **GIVEN** an open page with the caret in a table cell
- **WHEN** the user presses `Tab`, then `Shift-Tab`, then `Enter`
- **THEN** the caret moves to the next cell, back to the previous cell, and finally out of the table

### Requirement: An empty table cell shows a boundary

A table cell that holds no text SHALL show a hairline on its trailing edge, so a table whose cells are empty shows which cells it has and where a click will land. The hairline SHALL be presentation only: it SHALL NOT appear in the page's Markdown, SHALL NOT change any cell's text, SHALL NOT move a cell's text or change a column's width, and SHALL be gone from a cell as soon as that cell holds text. A table whose cells all hold text SHALL render as it does today, with row rules and no vertical rules, and the boundary SHALL cost nothing on the keystroke path.

#### Scenario: A table with empty cells shows where its cells are

- **GIVEN** the caret in an empty paragraph
- **WHEN** the user types `|2x3|` and a space
- **THEN** the page holds a table of that size whose cells are separated by a visible hairline, and the caret sits in the first cell

#### Scenario: The boundary goes away as a cell fills

- **GIVEN** an open page holding a table with empty cells
- **WHEN** the user types into one of them
- **THEN** that cell no longer shows the hairline, its empty neighbours still show theirs, and no cell moved

#### Scenario: A filled table keeps its resting look

- **GIVEN** a page whose table has text in every cell
- **WHEN** the page renders
- **THEN** the table shows row rules and no vertical rules, exactly as it does today

#### Scenario: The boundary never reaches the file

- **GIVEN** a page holding a table with empty cells
- **WHEN** the page is saved
- **THEN** the Markdown holds the table in its canonical form with `<br />` for the empty cells and no character representing the hairline, and reopening the page shows the same table

### Requirement: A table that begins a page keeps room for its controls

A page whose first block is a table SHALL give that table room above its first row, so that the table's column handle — which the editor places above the first row — is drawn inside the pane and can be pressed. The handle SHALL then select its column and open the column's alignment and delete controls, as it does anywhere else. The room SHALL be the table block's own top margin, it SHALL NOT be page content (the Markdown SHALL NOT change, and the file SHALL gain nothing), it SHALL apply only to a table that is the page's first block, and the rest of the page's geometry SHALL be unchanged: the pane's padding, the shared start line of every other first block, the document's width, and the line-number gutter's placement. A page whose first block is a table SHALL still number that table once, at its first line.

#### Scenario: A table at the top of a page can be controlled

- **GIVEN** a page whose content begins with a table
- **WHEN** the page renders and the user points at one of its columns
- **THEN** the column handle is drawn inside the editor pane rather than above its edge, and pressing it selects that column and opens its controls

#### Scenario: The room is space, not content

- **GIVEN** a page whose content begins with a table
- **WHEN** the page is saved
- **THEN** the Markdown holds the table exactly as it did, with no character representing the room, and the page is not written at all if nothing was edited

#### Scenario: Only a leading table gains the room

- **GIVEN** one page whose first block is a paragraph or a heading, and another whose first block is a table followed by text
- **WHEN** both render
- **THEN** the first block of the first page starts at the pane's top padding, the table of the second starts where it did before this change, and the pane's padding is unchanged for both

#### Scenario: The gutter still numbers the table at its first line

- **GIVEN** a page whose content begins with a table
- **WHEN** the page renders
- **THEN** the table's line number sits on the table's first line, not on the space above it

### Requirement: A table's handles stay inside the pane

The row and column handles the editor draws for a table SHALL be brought inside the pane's visible box whenever the editor places them and whenever the pane scrolls, so that a handle can be pressed wherever the table sits — including a table scrolled until its first row is at the pane's top edge. A handle that already fits inside the pane SHALL NOT be moved. A handle that has to be brought inside SHALL keep its meaning: pressing it SHALL still select that table's row or column and SHALL still open that row's or column's controls. A handle's position SHALL NOT be page content: the page's Markdown SHALL NOT change and SHALL NOT be written for it. The line handles that appear while a row or column is being dragged SHALL be left where the editor places them, and a table whose handles already fit SHALL render exactly as it does today.

#### Scenario: A table at the pane's top edge can still be controlled

- **GIVEN** a page holding a table, scrolled so the table's first row sits at the pane's top edge
- **WHEN** the user points at one of its columns
- **THEN** the column's handle is drawn inside the pane rather than above its edge, and pressing it selects that column and opens its controls

#### Scenario: A handle that fits is not moved

- **GIVEN** a page holding a table with room above it in the pane
- **WHEN** the user points at one of its columns
- **THEN** the handle sits where the editor placed it, above the first row and clear of the pane's edges

#### Scenario: Scrolling keeps a shown handle inside the pane

- **GIVEN** a page holding a table whose column handle is being shown
- **WHEN** the user scrolls the pane
- **THEN** the handle is still inside the pane's visible box, and the page's Markdown is unchanged

#### Scenario: The nudge is a position, not content

- **GIVEN** a page holding a table at the pane's top edge
- **WHEN** the page is saved
- **THEN** the Markdown holds the table exactly as it did, and the page is not written at all if nothing was edited

### Requirement: Aligning and deleting a table row or column works from the caret

With the caret in a table cell, the app SHALL provide a keyboard path for the operations that otherwise exist only on a table's row and column handles: aligning the caret's column to the left, to the center, and to the right, deleting the caret's row, and deleting the caret's column. Aligning SHALL apply to every cell of the caret's column, not only to the cell the caret is in, and SHALL be the same change the column handle's alignment control makes. Deleting SHALL remove that row or that column and nothing else. Every one of these SHALL leave a caret in the table rather than a selection, so that the next keystroke types instead of replacing what the chord just changed. A chord pressed with the caret outside a table SHALL do nothing and SHALL leave the document unchanged. Applying an alignment a column already has SHALL report that nothing was applied rather than claiming a change. The row and column handles and their controls SHALL keep working as they do now, and each of these chords SHALL be listed in the keyboard-shortcuts reference.

#### Scenario: A column is aligned from the caret

- **GIVEN** an open page with the caret in a table cell
- **WHEN** the user activates the align-center chord
- **THEN** every cell of that column is centered, the saved Markdown shows the column's alignment in its delimiter row, and no other column changes

#### Scenario: The caret is left in the cell

- **GIVEN** a table whose column was just aligned by chord
- **WHEN** the user types a character
- **THEN** it is inserted into the cell the caret was in, and the column's cells are not replaced

#### Scenario: A row and a column are deleted from the caret

- **GIVEN** an open page with the caret in a table cell
- **WHEN** the user activates the delete-row chord, and later the delete-column chord with the caret in a cell
- **THEN** the caret's row is gone, then the caret's column is gone, and the saved Markdown holds exactly the table that remains

#### Scenario: Outside a table nothing happens

- **GIVEN** an open page with the caret in a paragraph outside every table
- **WHEN** the user activates any of these chords
- **THEN** the document is unchanged and the page is not marked as edited by it

#### Scenario: The handles still do the same things

- **GIVEN** an open page holding a table
- **WHEN** the user presses a column handle and its alignment and delete controls
- **THEN** the column is selected and the controls act on it exactly as they did before

### Requirement: The space below the last block belongs to the page
The editor's editable surface SHALL fill the pane's height, so that the empty space below a page's last block is part of the document rather than dead background. A click in that space SHALL place the caret at the end of the document, and the next keystroke SHALL continue the page there. The click SHALL NOT create a block, SHALL NOT change the document's Markdown, and SHALL NOT open a reference or any other target. On a page whose content is taller than the pane, the surface SHALL grow with the content as it does now, so nothing about scrolling changes. The surface SHALL NOT grow upward: the first block's start line, the document's readable column width, the line-number gutter, and an empty page's placeholder SHALL be unaffected, except that a table which begins the page SHALL carry the margin its column handle needs to stay inside the pane ("A table that begins a page keeps room for its controls"). A page whose last block is a table SHALL keep a continuation paragraph after it, exactly as a page ending in a code block does, so a click below the table places the caret in that paragraph rather than inside a cell; that paragraph SHALL NOT be written to the page's file.

#### Scenario: Clicking under the last block continues the page
- **GIVEN** an open page whose content ends well above the pane's bottom
- **WHEN** the user clicks in the empty space below the last block and types
- **THEN** the typed text lands at the end of the page, and the page's Markdown gains only that text

#### Scenario: Clicking beside a short last line continues the page
- **GIVEN** a page whose last block is short — a heading, a list item, or a lone reference
- **WHEN** the user clicks the empty space to the right of that line
- **THEN** the caret is placed in that block at the end of its text, and no reference or other target is activated

#### Scenario: The document's start line and width do not move
- **GIVEN** a page open before and after this surface grows
- **WHEN** the page renders
- **THEN** the first block starts on the same line at the same x, the gutter numbers are unchanged, and the prose column keeps its width

#### Scenario: Content taller than the pane scrolls as before
- **GIVEN** a page whose content exceeds the pane's height
- **WHEN** the user scrolls the pane
- **THEN** the page scrolls exactly as it did, with the surface extending to the content's end and no extra empty area inserted above the document

#### Scenario: Clicking under a table continues the page and not a cell
- **GIVEN** an open page whose last block is a table
- **WHEN** the user clicks in the empty space below the table and types
- **THEN** the typed text lands after the table as a new block at the end of the page, no table cell changes, and the page's Markdown holds the table and that new block

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

### Requirement: A page always keeps an empty block at its end
An open page SHALL always hold an empty paragraph after its last top-level block, whatever that block is (a paragraph, list, quote, heading, code block, or table), so a blank line to continue on is always visible at the end. The paragraph SHALL be maintained by the editor rather than authored: it is there whether the page was typed, pasted, or opened from a file, and it never accumulates — at most one is present, and it is appended only when the last block is not already an empty paragraph. Moving into it SHALL work the ways a user tries: `ArrowDown` from the block above it, and a click below that block. `Enter` inside a code block SHALL continue to add a code line, and `Mod-Enter` SHALL continue to exit the block.

#### Scenario: The empty block at the end of a page exists
- **GIVEN** an open page whose last block is not an empty paragraph
- **WHEN** the page renders
- **THEN** the document holds an empty paragraph after that block

#### Scenario: The end block follows any last block type
- **GIVEN** pages whose last block is, in turn, a paragraph, a list, a quote, and a heading
- **WHEN** each page renders
- **THEN** each shows an empty line after its last block

#### Scenario: Arrow down and click reach the end block
- **GIVEN** a page whose last block holds text, with the caret at the end of it
- **WHEN** the user presses `ArrowDown`, or clicks below the block, and types
- **THEN** the caret is in the empty paragraph after it and the typed text lands there, not in the block above

#### Scenario: Arrow down leaves a trailing code block
- **GIVEN** an open page whose last block is a code block, with the caret on the code block's last line
- **WHEN** the user presses `ArrowDown` and types
- **THEN** the caret is in the paragraph after the code block and the typed text lands there, not in the code

#### Scenario: Enter still adds a code line
- **GIVEN** the caret inside a code block that ends the page
- **WHEN** the user presses `Enter`
- **THEN** a new line is added inside the code block and no paragraph is inserted

#### Scenario: No empty paragraph accumulates
- **GIVEN** a page whose last block is already an empty paragraph
- **WHEN** the document changes
- **THEN** no second empty paragraph is appended

#### Scenario: An empty page shows one empty line
- **GIVEN** an open page with no content
- **WHEN** the page renders
- **THEN** the document holds exactly one empty paragraph and no second one is appended

### Requirement: Serialization never writes a trailing blank line
The Markdown a document serializes to SHALL end with a single newline and SHALL NOT end with blank lines, so the empty paragraph the editor maintains at the end of every page never reaches the vault: opening a page writes nothing, and editing it writes only the user's own text. Trimming SHALL be a property of every serialization the app performs — the change stream that drives autosave, the content the app reads for a draft, and the copy-as-markdown flavor — so no path disagrees about what the page holds.

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

#### Scenario: Editing at the end of a page writes only the new text
- **GIVEN** an open page whose last block holds text, with the caret moved into the empty paragraph after it
- **WHEN** the user types and the page saves
- **THEN** the file ends with the last non-empty block and a single newline, and carries no trailing blank line

### Requirement: The editor shows block line numbers

An open page in the editor SHALL display a quiet rail along the left of the document holding two columns: a line-number column on its left and a fold-control column on its right, nearest the prose. The line numbers SHALL be one small, dimmed number per top-level block, showing the block's start line in the page's canonical Markdown form. The numbers SHALL remain purely presentational — non-interactive, hidden from assistive technology, and free of any effect on editing, selection, or focus — while the fold controls in the same rail SHALL be interactive and accessible ("A list item with children can be folded"). A top-level block that has a fold control SHALL show its number in the number column on the block's first line, beside that control; a top-level block with no fold control SHALL show its number in the same column on its first line. Numbers SHALL be live: they update as the document changes (inserting or deleting lines above renumbers the blocks below). Blank separator lines SHALL be counted in the numbering but not rendered, so the display may read 1, 3, 5. A list SHALL carry a single number at its start rather than one per item. Code blocks SHALL keep their embedded editor's local line numbering and additionally show the block's start number in the outer rail. Renumbering SHALL be a single pass: an update SHALL read the document's layout in one batch and write the numbers and controls in another, never interleaving a layout read with a style write per block, so an update's cost grows with the block count rather than with its square.

#### Scenario: Numbers appear at block starts

- **WHEN** the user opens a page whose content has several blocks
- **THEN** each top-level block shows its canonical start line in the rail's number column, aligned with the block's first line

#### Scenario: A fold control sits above its number

- **GIVEN** an open page whose first block is a foldable list
- **WHEN** the page renders
- **THEN** the rail shows that block's fold control in the control column and the block's line number in the number column, both on the block's first line with the number to the left of the control

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

- **WHEN** the user clicks or drags over a line number in the rail
- **THEN** the click falls through to the document (no selection, focus, or interaction with the number), while a click on a fold control in the same rail activates that control instead

#### Scenario: The placeholder page shows its first block

- **WHEN** the user opens an empty page showing the typing placeholder
- **THEN** the rail shows a single number for the initial empty block

#### Scenario: A long page updates without stalling

- **WHEN** an edit lands in a page that holds many blocks
- **THEN** the rail shows the new numbers, controls, and positions without a main-thread stall that grows with the square of the block count, as measured by the instrumentation in the change's design

#### Scenario: A reflow re-measures in one pass

- **WHEN** the pane is resized or fonts load so the blocks move
- **THEN** every number and every fold control re-aligns with its block or item in a single measurement pass
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

### Requirement: A written vault-file link has a destination Markdown reads
The app SHALL write the destination of every link or image it inserts for a vault file in a form a Markdown parser reads as that destination, so the reference is a link in the editor and in every other Markdown reader. The characters that would otherwise end or alter a destination — the space, the parentheses, the angle brackets, the quotation marks, the backtick, and the percent sign — SHALL be percent-encoded, and the path separator `/` SHALL NOT be. The written destination SHALL resolve back to the file's literal vault path: percent-decoding it SHALL produce exactly the path the file has in the vault, so the index's reference and the open gesture both name the same file.

#### Scenario: A name carrying a space is written as a readable link
- **GIVEN** a vault file named `Q3 report.pdf`
- **WHEN** a link to it is written
- **THEN** the destination is `assets/Q3%20report.pdf`, which the editor renders as a link and whose text round-trips to the same link after a reload

#### Scenario: A name carrying parentheses or a percent sign is written as a readable link
- **GIVEN** vault files named `a (draft).pdf` and `100% done.pdf`
- **WHEN** links to them are written
- **THEN** their destinations are `assets/a%20%28draft%29.pdf` and `assets/100%25%20done.pdf`, each decoding back to the file's literal name

#### Scenario: An ordinary path is written unchanged
- **GIVEN** a vault file named `assets/q3-report.pdf`
- **WHEN** a link to it is written
- **THEN** the destination is `assets/q3-report.pdf`, with no character escaped

#### Scenario: A written link is both a reference and a working link
- **GIVEN** a page holding the text the app writes for `assets/Q3 report.pdf`
- **WHEN** the page is saved and the vault re-indexed
- **THEN** the page's asset references include `assets/Q3 report.pdf`, and Ctrl+Click on the link opens that file

### Requirement: A reference dragged from the sidebar is written at the drop point
When a drag carrying a sidebar row's payload is released over the editor pane while a page is open, the app SHALL insert, at the drop point in the open page, the reference that payload names: a payload naming a vault file SHALL be written as the ordinary Markdown link or image the drop and paste gestures write for that path ("A written vault-file link has a destination Markdown reads"), and a payload naming a page SHALL be written as a reference token in one of Folio's two lexical forms ("Page references have exactly two lexical forms"). The written reference SHALL read back as a reference to the same file or page the payload named.

The insertion SHALL go through the normal edit path, so the reference appears in the page's autosaved draft and undoes like typing.

The gesture SHALL write nothing to the vault: no file is copied, created, renamed, moved, or deleted, and no vault file's bytes change. It SHALL NOT open or navigate to the file or page it names, SHALL NOT add an entry to the history trail, and SHALL NOT change any state other than the open page's own text. When no page is open, or the payload names nothing the app can write, the drop SHALL change nothing at all, including the page's text and the caret. Where the release point names no position the reference can occupy — outside the page's text, or inside a block that cannot hold it, such as a code block — the reference SHALL be inserted at the caret instead.

#### Scenario: Dragging an asset row writes a link to that file
- **GIVEN** a vault holding `assets/q3-report.pdf` and an open page, with the caret somewhere in the page
- **WHEN** the `q3-report.pdf` row is dragged from the sidebar's Assets section and released over a paragraph below the caret
- **THEN** the text `[q3-report](assets/q3-report.pdf)` is inserted at that paragraph, the page's References section lists the file after the next save, and the file's bytes and the vault's listing are unchanged

#### Scenario: Dragging an image row writes an image
- **GIVEN** a vault holding `assets/shot.png` and an open page
- **WHEN** the `shot.png` row is dragged into the page
- **THEN** `![shot](assets/shot.png)` is inserted at the drop point and renders the file's bytes

#### Scenario: Dragging a page row writes a reference to that page
- **GIVEN** an open page and a vault holding a page named `reading list`
- **WHEN** that row is dragged from the sidebar's Pages section into the page
- **THEN** the text `#[[reading list]]` is inserted at the drop point, and `reading` is written as `#reading`

#### Scenario: A dropped reference is an ordinary edit
- **GIVEN** an open page with unsaved edits and a vault holding an asset
- **WHEN** the asset's row is dropped into the page
- **THEN** the reference appears in the page's autosaved draft, and undoing restores the page's text to what it was before the drop

#### Scenario: A dropped reference opens nothing and navigates nowhere
- **GIVEN** an open page and a vault holding `assets/q3-report.pdf`
- **WHEN** the file's row is dragged into the page and released
- **THEN** no window opens, the same page stays open, no entry is added to the history trail, and Back and Forward step where they did before

#### Scenario: A drag with no page open changes nothing
- **GIVEN** the app showing the empty start screen, with a vault holding an asset
- **WHEN** the asset's row is dragged over the editor pane
- **THEN** no text is written anywhere, nothing is copied into the vault, and the app does not navigate

#### Scenario: A drag released inside a code block does not corrupt it
- **GIVEN** an open page holding a fenced code block with the caret in a paragraph, and a vault holding an asset
- **WHEN** the asset's row is dropped onto the code block
- **THEN** the code block's text is unchanged and the reference is inserted where the caret is, because a code block cannot hold a reference

#### Scenario: The caret does not move on a drag it cannot use
- **GIVEN** an open page with the caret placed in a paragraph
- **WHEN** a drag is released whose payload names nothing the app can write
- **THEN** the page's text and the caret's position are unchanged

### Requirement: An empty list item holding a child block round-trips

When an empty paragraph inside a list item is followed by another block in the same item,
the editor SHALL write a blank line between the two, so the empty line does not start an
HTML block that swallows the block after it. On reading Markdown, the editor SHALL apply
the same normalization before parsing, so a file already written without that blank line
is read back with the child block intact rather than as one inline `html` atom. The
normalization SHALL NOT alter an item whose next line is a sibling item, a blank line, or
anywhere inside a fenced code block.

#### Scenario: A code block under an empty bullet survives a save and open

- **GIVEN** a list item whose text line is empty and which holds a fenced code block
- **WHEN** the page is saved and reopened
- **THEN** the code block is still a code block with its content, not raw `html` text

#### Scenario: A nested list under an empty bullet survives a save and open

- **GIVEN** an empty list item holding a nested list
- **WHEN** the page is saved and reopened
- **THEN** the nested list is still a list

#### Scenario: An already-broken file is read back correctly

- **GIVEN** a file whose empty bullet and following code block were written without a separating blank line
- **WHEN** the page is opened
- **THEN** the code block is a code block again, and saving writes the separating blank line

#### Scenario: Sibling items and blank lines are left alone

- **GIVEN** a list where an empty item's next line is another item at the same indent, or a blank line
- **WHEN** the page is saved
- **THEN** no blank line is inserted and the list is unchanged

### Requirement: Backspace and Delete act on the caret's list item

When the caret is in a list item, Backspace and Delete SHALL act on that item rather than
on the raw document position alone.

- Delete at the start of a list item's first text block SHALL delete the character after
  the caret when one exists. When that block is empty and the item's list is followed by
  a non-empty paragraph, Delete SHALL move that paragraph into the item, filling the
  empty bullet and removing the original paragraph. When neither applies, Delete SHALL
  leave the editor's default behavior.
- Backspace at the start of an empty list item's first text block SHALL remove that empty
  line. The item's remaining children SHALL be promoted to the parent level rather than
  deleted, so a code block or nested list the item holds SHALL survive one level up; the
  empty item SHALL be removed, and its list SHALL be removed with it when it was the
  list's only item. The caret SHALL land at the end of the parent's text, or the nearest
  text position when the parent has none.
- Backspace on a non-empty list item SHALL keep the editor's existing lift behavior.

The gestures SHALL NOT run inside a fenced code block or when a modifier key is held.

#### Scenario: Delete deletes the following character in a non-empty item

- **GIVEN** a list item whose text is not empty with the caret at its start
- **WHEN** the user presses Delete
- **THEN** the character after the caret is deleted and the item stays a list item

#### Scenario: Delete fills an empty bullet from the paragraph below

- **GIVEN** a list whose last item is empty, followed by a non-empty paragraph
- **WHEN** the user presses Delete
- **THEN** the paragraph's content moves into the empty item, the original paragraph is gone, and the list has one fewer empty item

#### Scenario: Backspace removes an empty bullet and keeps its code block

- **GIVEN** a list item whose first block is empty and which also holds a fenced code block
- **WHEN** the user presses Backspace at the start of the empty block
- **THEN** the empty item is removed, the code block is promoted to the parent level, and the caret sits at the end of the parent's text

#### Scenario: Backspace deletes a genuinely empty bullet

- **GIVEN** a list item whose only content is an empty text block
- **WHEN** the user presses Backspace at the start of that block
- **THEN** the item is removed, and the list is removed too when it held no other item

#### Scenario: Backspace still lifts a non-empty item

- **GIVEN** a list item whose text is not empty with the caret at its start
- **WHEN** the user presses Backspace
- **THEN** the item is lifted out of the list, as it was before

### Requirement: A list item with children can be folded

An open page's editor SHALL offer a fold control in its left rail for every list item that holds nested content — a nested list, or any block after the item's first block. The control SHALL be a real, focusable button carrying `aria-expanded` and a label naming the action, and it SHALL be aligned to the item's first line; a nested item SHALL have its own control, so nested folding stays reachable. Activating the control SHALL fold the item, hiding its nested content in the editor; activating it again SHALL expand the item. A list item whose only content is its own first block SHALL show no control. Folding SHALL change only what the editor draws and SHALL NOT change the page: the serialized Markdown and the file SHALL keep every line of a folded item, and a fold alone SHALL NOT mark the page edited or cause a write. The control SHALL NOT cover or replace the item's native marker, which SHALL keep being drawn by the browser as it is today (ADR-0020). Fold state SHALL be scoped to the open page and the current session: opening another page or reloading the app SHALL show every item expanded, and no fold state SHALL be written to the vault — no `.folio/` entry and no Markdown property.

#### Scenario: A folded item hides its nested content

- **GIVEN** an open page holding a list item with nested items
- **WHEN** the user activates that item's fold control
- **THEN** the nested items disappear from view, the item's own text stays visible, and the control now offers to expand

#### Scenario: Expanding restores the nested content

- **GIVEN** a folded list item
- **WHEN** the user activates its control again
- **THEN** the nested items are visible again and the item reads exactly as it did before the fold

#### Scenario: The file keeps a folded item's lines

- **GIVEN** an open page with a folded list item and no other edits
- **WHEN** the page is saved or left untouched
- **THEN** the Markdown and the file hold the item's nested lines exactly as they were, and the fold alone neither marks the page dirty nor writes it

#### Scenario: A leaf item has no control

- **GIVEN** a list whose items hold no nested content
- **WHEN** the page renders
- **THEN** no item shows a fold control

#### Scenario: A nested item has its own control

- **GIVEN** an open page whose list item holds a nested list with its own nested item
- **WHEN** the page renders
- **THEN** the outer item and the nested item each show a fold control in the left rail, aligned to that item's own first line

#### Scenario: The marker is never covered

- **GIVEN** an open page with a foldable list item
- **WHEN** the page renders and the item's fold control is shown
- **THEN** the browser draws the item's native marker unobstructed, and the control sits in the left rail beside the marker's column, not over it

#### Scenario: Folds do not survive leaving the page

- **GIVEN** an open page with a folded list item
- **WHEN** the user opens another page and returns, or reloads the app
- **THEN** every item is expanded

#### Scenario: The vault gains no fold state

- **GIVEN** a page whose list items were folded and expanded
- **WHEN** the vault is inspected
- **THEN** no `.folio/` entry and no Markdown property records a fold, and the page's bytes carry only the user's own edits
### Requirement: A folded item's hidden content cannot be edited

While an item is folded, its hidden nested content SHALL NOT take the caret or a selection. A caret or selection that would land inside the hidden content SHALL instead be placed in the item's visible text, so typing always lands in visible text and never silently edits content the user cannot see. Folding an item whose nested content holds the caret SHALL move the caret to that item's visible text. The hidden content SHALL remain part of the document, so expanding restores it exactly. Activating a fold control SHALL NOT take the caret out of the document.

#### Scenario: Folding moves the caret out of the nested content

- **GIVEN** a list item with the caret inside its nested items
- **WHEN** the user folds the item
- **THEN** the caret is placed in the item's own visible text and the nested content is unchanged

#### Scenario: The caret cannot move into hidden content

- **GIVEN** a folded list item with the caret in its visible text
- **WHEN** the user presses an arrow key that would move the caret toward the hidden nested items
- **THEN** the caret stays in visible text rather than entering the hidden content

#### Scenario: A keyboard fold control does not disturb the caret

- **GIVEN** a folded list item with the caret in its visible text
- **WHEN** the user activates the item's fold control
- **THEN** the caret stays in the document at the same visible position

### Requirement: Folding re-glues the line-number gutter

When a fold or an expand changes the rendered height of the document without changing its text, the rail SHALL re-measure and keep every number aligned with its block's first line and every fold control aligned with its item's first line, exactly as it does for a reflow. A fold SHALL NOT change which lines are numbered: numbers SHALL remain the page's canonical Markdown line numbers.

#### Scenario: Blocks below a folded item keep their numbers

- **GIVEN** an open page whose blocks below a list item show line numbers in the rail
- **WHEN** the item is folded so the blocks below move up the pane
- **THEN** every block below the folded item keeps its own number, aligned with its first line

#### Scenario: Controls re-glue with their items

- **GIVEN** an open page with a fold control on a list item
- **WHEN** a fold above it moves the item up the pane
- **THEN** the control is still aligned with that item's first line

#### Scenario: A fold does not renumber

- **GIVEN** an open page with a folded list item
- **WHEN** the fold hides nested lines and later expands them
- **THEN** the numbers shown are the page's canonical Markdown line numbers in both states
### Requirement: Folding work stays bounded by the edited list

A keystroke SHALL NOT pay for folding. The fold state SHALL be carried forward across a document change, and a list's fold state SHALL change only for the tree a toggle touches. The rail's fold controls SHALL be drawn by the same single measure-then-write update that draws the numbers, which runs on the debounced markdown change stream, on a fold, and on a reflow — never synchronously on a keystroke, so typing pays nothing for folding and a keystroke's cost does not grow with the number of foldable items. That rail update's cost SHALL grow with the block and foldable-item count in one pass, not with its square.

#### Scenario: Typing in a list leaves its fold controls in place

- **GIVEN** an open page holding a long list whose items show fold controls
- **WHEN** the user types a character in one item's text
- **THEN** the fold state is unchanged, no fold work runs on the keystroke, the item's text is the only thing that changes, and the rail redraws its controls in its next debounced update rather than on the keystroke

#### Scenario: Toggling one item recomputes only its tree

- **GIVEN** an open page with two separate nested lists
- **WHEN** the user folds one item in the first list
- **THEN** the fold state change is scoped to the first list's tree, and the second list's visible state is unchanged
