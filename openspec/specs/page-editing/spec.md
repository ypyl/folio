# page-editing Specification

## Purpose

Makes an opened page editable: an editor is the sole surface for open pages, edits write through to the vault folder with debounced per-page auto-save, and the pane reports dirty, saving, and failed states so edits are never lost silently.

## Requirements

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
- **WHEN** the `q3-report.pdf` row is dragged from the Files section's asset rows and released over a paragraph below the caret
- **THEN** the text `[q3-report](assets/q3-report.pdf)` is inserted at that paragraph, the page's Links list includes the file after the next save, and the file's bytes and the vault's listing are unchanged

#### Scenario: Dragging an image row writes an image

- **GIVEN** a vault holding `assets/shot.png` and an open page
- **WHEN** the `shot.png` row is dragged into the page
- **THEN** `![shot](assets/shot.png)` is inserted at the drop point and renders the file's bytes

#### Scenario: Dragging a page row writes a reference to that page

- **GIVEN** an open page and a vault holding a page named `reading list`
- **WHEN** that row is dragged from the Files section's page rows into the page
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

### Requirement: An image-heavy page stays responsive
When an open page references many images, the page SHALL remain responsive: opening it and typing in it SHALL NOT block for an amount of time that grows with the number of images referenced or the size of their files. The page SHALL limit the number of vault reads it has in flight at once, so a page whose markdown references many images does not issue one binary read per image simultaneously. An image that is displayed SHALL be decoded without blocking the editing surface, so the document stays editable while its images arrive.

#### Scenario: Opening a screenshot-heavy page is not one blocking burst
- **GIVEN** a vault holding many large image files and a page referencing all of them
- **WHEN** the page is opened
- **THEN** no more than a bounded number of vault reads are in flight at once, and the editing surface accepts input while the images resolve

#### Scenario: Typing in a screenshot-heavy page stays responsive
- **GIVEN** an open page referencing many large vault images, with its images still resolving
- **WHEN** the user types continuously
- **THEN** each keystroke is handled without waiting for a vault read or an image decode

#### Scenario: A displayed image decodes asynchronously
- **GIVEN** an open page whose vault image reference has resolved
- **WHEN** the image is displayed
- **THEN** the image element asks the browser to decode it asynchronously, so the editing surface is not blocked by decoding

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

### Requirement: A markdown link reads as its text at rest

A markdown link in a page's text SHALL display as its own link text while the selection is outside the construct: the opening `[`, the closing `]`, and the destination with any title SHALL NOT be shown, so `[Example](https://example.com)` reads as `Example` in the app's link style, which is brand ink with no underline, the one link behavior DESIGN.md defines. An autolink (`<https://example.com>`) SHALL display without its angle brackets on the same rule.

When the selection touches the link, the whole construct SHALL be shown again, so it is edited as Markdown; moving the selection away SHALL render it as its text again. Hiding SHALL be presentational: the document SHALL keep every character, a save SHALL write the construct as it was, and the link's destination SHALL remain what activating the link opens, whether it is hidden or shown.

A link whose link text is empty SHALL show its source, because hiding its marks would leave nothing visible to click or to find. A link inside an inline code span or a fenced code block SHALL keep its characters verbatim, as every other construct does in literal text.

#### Scenario: A link reads as its text

- **GIVEN** a page whose text contains `[Example](https://example.com)`, with the caret elsewhere
- **WHEN** the page renders
- **THEN** it shows `Example` in the app's link style, and neither the brackets nor the destination are shown

#### Scenario: The whole construct comes back for editing

- **GIVEN** a rendered link
- **WHEN** the user puts the caret inside it, or selects across it
- **THEN** the whole construct is shown as `[Example](https://example.com)`, and it is editable as Markdown

#### Scenario: Moving away renders it again

- **GIVEN** a link showing its construct
- **WHEN** the user moves the caret out of it
- **THEN** it displays as its text again, with no character of the construct lost

#### Scenario: The file keeps the construct

- **GIVEN** a page whose text contains a markdown link
- **WHEN** the user edits an unrelated part of the page and the save completes
- **THEN** the saved Markdown still holds that link's brackets and destination exactly as they were

#### Scenario: The hidden destination is still what opens

- **GIVEN** a rendered link whose destination is hidden
- **WHEN** the user Ctrl+Clicks its text
- **THEN** the destination opens, exactly as it would if the construct were shown

#### Scenario: An autolink reads without its brackets

- **GIVEN** a page whose text contains `<https://example.com>`, with the caret elsewhere
- **WHEN** the page renders
- **THEN** it shows the URL without the angle brackets, and shows them again when the caret enters it

#### Scenario: An empty link keeps its source

- **GIVEN** a page whose text contains a link with no link text
- **WHEN** the page renders
- **THEN** the construct is shown as written, so there is something visible to click

#### Scenario: A link in code stays literal

- **GIVEN** a page containing a markdown link inside an inline code span and inside a fenced block
- **WHEN** the page renders
- **THEN** both show their characters verbatim, with nothing hidden and no link styling

### Requirement: The editor frames the located block

When the app opens a page to one or more top-level blocks — today, opening a search result, which names every block holding a match, or activating a Contents row, which names one heading — the editor SHALL frame each of them around its whole extent: from the block's start line through its last non-blank line, with the frame's sides on every line of the extent and its top and bottom on the first and last. Every block SHALL be located by the same block-start rule the search and the Contents panel share (`src/lineAnchors.ts`), so a match's anchor and the editor's mark agree. When more than one block is located, the editor SHALL scroll the first of them into view.

The frames SHALL be identical to one another: nothing SHALL mark the scrolled-to block apart from the scroll itself. The frame SHALL be drawn without changing layout: the mark SHALL NOT move or reflow the page's text, which a border on a line would do by narrowing that line's content box and re-wrapping a long line. The mark SHALL be presentational: it SHALL NOT enter the page's Markdown, SHALL NOT change the serialized content or the file, and SHALL NOT be written.

The mark SHALL NOT fade. It SHALL remain until a later location request replaces it. A document change SHALL NOT clear it, and each frame SHALL stay with the text it marks as the document changes, so the block an edit splits or extends is still the block it framed. Leaving the located page and returning to it SHALL NOT clear it either, including through Back and Forward: the mark belongs to the page that was located, not to the visit.

A request that names no block, and a page opened without one, SHALL be left unmarked. Locating SHALL be a view operation: it SHALL NOT create an undoable document edit, and it SHALL NOT move the caret or change the text selection.

#### Scenario: A requested block is scrolled to and marked

- **GIVEN** a page with several blocks, opened to one of its later blocks
- **WHEN** the page renders
- **THEN** that block is scrolled into view and carries a visible frame

#### Scenario: The frame covers the block's whole extent

- **GIVEN** a page opened to a block of several lines, such as a list of items or a paragraph that wraps
- **WHEN** the page renders
- **THEN** the frame encloses every line of that block, and neither the block above it nor the block below it is enclosed

#### Scenario: Every block holding a match is framed

- **GIVEN** a page whose text holds the same term in three different blocks, two of them below the first screen
- **WHEN** the user opens that page from the result
- **THEN** all three blocks carry a frame, the first match's block is the one scrolled into view, and the blocks without a match are not framed

#### Scenario: A block with two matches is framed once

- **GIVEN** a page whose term appears twice inside one block
- **WHEN** the user opens that page from the result
- **THEN** that block carries one frame, not two

#### Scenario: The frame moves nothing

- **GIVEN** a page opened to a block
- **WHEN** the frame is drawn
- **THEN** the position and the wrapping of the page's text are what they were before it, because the mark adds no layout

#### Scenario: The mark stays

- **GIVEN** a page opened to a marked block
- **WHEN** time passes with no further action
- **THEN** the block is still framed, and the page's text is unchanged

#### Scenario: An edit keeps the mark

- **GIVEN** a page with a framed block
- **WHEN** the user types inside that block, or in another block
- **THEN** the frame is still there and still encloses the text it framed, with no character of the page lost to it

#### Scenario: Returning to the page keeps the mark

- **GIVEN** a page located from a search result
- **WHEN** the user opens another page and comes back, or steps back to it through page history
- **THEN** the block is framed again, without a further search

#### Scenario: A later request replaces the mark

- **GIVEN** a page with a framed block
- **WHEN** the app asks to locate a different block
- **THEN** only the new block is framed

#### Scenario: A page opened without a locate is unmarked

- **GIVEN** a page opened from the sidebar, with no block named
- **WHEN** the page renders
- **THEN** no block is framed

#### Scenario: The mark never reaches the file

- **GIVEN** a page opened to a marked block
- **WHEN** the page is saved or left untouched
- **THEN** the Markdown and the file hold no character representing the mark, and the mark alone neither marks the page dirty nor writes it

#### Scenario: The mark leaves the caret alone

- **GIVEN** a page opened to a marked block
- **WHEN** the user inspects the caret and the selection
- **THEN** both are where they were before the block was located
