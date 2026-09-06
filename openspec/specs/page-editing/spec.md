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

### Requirement: The pane reports save state
The editor pane SHALL surface the save state of the open page: no indicator while the page is clean, "Unsaved changes" while the page has edits not yet saved, "Saving…" while a save is in flight, and "Save failed" when the latest save failed. The indicator SHALL remain visible while the pane scrolls.

#### Scenario: The save lifecycle shows through
- **WHEN** the user types, then pauses, and the save succeeds
- **THEN** the indicator shows "Unsaved changes", then "Saving…", then clears

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
