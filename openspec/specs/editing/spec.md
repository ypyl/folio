# Editing

## Purpose

Makes an opened page editable: the page's Markdown is edited in place, edits
save back to the vault, and the workspace shows whether an edit is unsaved,
saving, or failed, so nothing is lost silently.

## Requirements

### Requirement: The open page is edited in place

Opening a page SHALL put its content in an editable Markdown surface, not a
read-only preview. The document SHALL be the page's Markdown itself: what an
edit changes, and what the file receives, is the Markdown, character for
character. Markdown constructs the surface renders in place — inline formatting,
images, tables, reference styling — SHALL be presentational only: they SHALL NOT
change the text, and putting the caret in one SHALL show its source. Standard
constructs — headings, paragraphs, emphasis, lists, links, code, blockquotes,
tables — SHALL be editable as Markdown. Editing SHALL NOT reformat text the user
did not touch: whitespace, marker style, and line breaks SHALL be preserved as
typed, except for the terminal empty line, which is normalized so the page
always ends with one.

#### Scenario: A page opens editable

- **WHEN** the user opens a page
- **THEN** its content appears as editable Markdown text

#### Scenario: The surface is the file

- **GIVEN** a page holding constructs the surface renders in place
- **WHEN** the user edits the page, the save completes, and the page is reopened
- **THEN** the Markdown written to the file is the Markdown the surface held,
  with every construct's characters intact

#### Scenario: Untouched formatting is not rewritten

- **GIVEN** a page using `_emphasis_`, setext headings, or `*` list markers
- **WHEN** the user edits an unrelated paragraph and saves
- **THEN** those constructs are written back exactly as they were

### Requirement: References and markup render in place

In the editor, a reference in either form SHALL render as a visible badge over
its literal text, keeping its Markdown source visible and editable; the badge
SHALL look the same whether or not its block is being edited, and moving the
caret SHALL NOT repaint it. No badge SHALL render inside code. Plain `[[Page]]`
wikilinks SHALL stay literal text. Inline formatting — bold, italic,
strikethrough, inline code — and markdown links SHALL render as their formatted
result while the selection is outside them, and SHALL show their markers again
when the selection touches them, so each is edited as Markdown. A hidden marker
SHALL be stepped over rather than landed inside. The document SHALL keep every
character, and a save SHALL write each construct exactly as it was. A markdown
link SHALL display as its own text while the selection is outside it; `Example`
for `[Example](https://example.com)`, and an autolink without its angle
brackets. A link whose text is empty SHALL show its source, and a rendered
link's hidden destination SHALL remain what Ctrl+Click opens. Inside code,
characters SHALL stay literal.

#### Scenario: A reference renders as a badge

- **WHEN** the editor body contains `#Inbox` or `#[[reading list]]`
- **THEN** the token renders as a badge over its literal text

#### Scenario: Badges do not follow the caret

- **WHEN** the user places the caret in the block containing a reference
- **THEN** the reference still renders as a badge and the text does not repaint

#### Scenario: Code is never badged or formatted

- **WHEN** the editor body contains `#word`, `**bold**`, or a link inside inline
  code or a fenced code block
- **THEN** the characters stay literal, with no badge, no formatting, and no
  hidden markers

#### Scenario: Formatted runs read at rest

- **GIVEN** a paragraph containing `**bold**`, `*italic*`, and `~~struck~~`
- **WHEN** the page renders
- **THEN** the words read as bold, italic, and struck, with no markers shown

#### Scenario: The markers come back for editing

- **GIVEN** a rendered bold run
- **WHEN** the user puts the caret inside it or selects across it
- **THEN** its markers are shown and it is editable as Markdown

#### Scenario: The file keeps the markers

- **GIVEN** a page whose paragraph holds `**bold**`
- **WHEN** the user edits an unrelated part and saves
- **THEN** the saved Markdown still holds `**bold**`

#### Scenario: A link reads as its text

- **GIVEN** a page whose text contains `[Example](https://example.com)`
- **WHEN** the page renders
- **THEN** it shows `Example` in the app's link style, and the construct returns
  when the caret enters it

#### Scenario: The hidden destination is still what opens

- **GIVEN** a rendered link whose destination is hidden
- **WHEN** the user Ctrl+Clicks its text
- **THEN** the destination opens

#### Scenario: A fenced block is highlighted source

- **GIVEN** a page whose Markdown contains a fence opened with a language
- **WHEN** the page renders
- **THEN** the block's content is highlighted for that language, the fence lines
  stay visible and editable, and a fence with no language renders monochrome

#### Scenario: A table renders as a table at rest

- **GIVEN** a page holding a pipe table, with the caret off it
- **WHEN** the page renders
- **THEN** it shows a bordered table with a header row and body rows, with each
  column aligned as the delimiter row asks and cell markup and references
  rendered; putting the caret on it shows its source again

#### Scenario: The file keeps a pipe table

- **GIVEN** a rendered table
- **WHEN** the page is saved and reopened
- **THEN** the saved Markdown is still the same pipe table

### Requirement: A reference opens its target

The editor SHALL open a reference's target when the user clicks the reference's
badge, or presses Mod+Enter with the caret inside the reference. Opening SHALL
resolve the name exactly as the Links panel does: the existing page when one
matches, otherwise a blank page created on first save. Activating a reference to
the page already open SHALL NOT navigate. The keyboard shortcut SHALL be listed
in the keyboard-shortcuts reference.

#### Scenario: Clicking a badge opens the page

- **WHEN** the user clicks the badge of a reference whose target exists
- **THEN** that page opens

#### Scenario: Clicking a reference to a missing page opens a blank page

- **WHEN** the user clicks the badge of a reference whose target has no file
- **THEN** a blank page opens and is written on first save

#### Scenario: The keyboard opens the reference at the caret

- **WHEN** the caret sits inside a reference and the user presses Mod+Enter
- **THEN** the target page opens

#### Scenario: A self-reference does not navigate

- **WHEN** the open page references its own name and the user activates it
- **THEN** the app stays on the open page

### Requirement: Edits auto-save with per-page drafts

Edited content SHALL be preserved when the user leaves a page and restored when
that page is opened again in the same session, even before a save has fired.
Saves SHALL be debounced, so a page is written after editing pauses. A page
whose content equals its last saved content SHALL NOT be rewritten.

#### Scenario: Leaving a page preserves the draft

- **WHEN** the user edits a page and leaves it before the save fires
- **THEN** the edit is kept, written in the background, and shown again when the
  user returns

#### Scenario: An unchanged page is not rewritten

- **WHEN** a page is open and no edit is made
- **THEN** no save is triggered

### Requirement: Failed saves are not silent

When a save fails, the page SHALL remain unsaved, the failure SHALL stay visible,
and the next edit SHALL re-arm saving. The unsaved content SHALL remain in the
page's draft and SHALL NOT be discarded.

#### Scenario: A failed save keeps the draft and shows the error

- **WHEN** a save fails, for example because the folder's permission was revoked
- **THEN** the workspace shows "Save failed", the page stays unsaved, and its
  edited content remains intact

#### Scenario: Editing again retries saving

- **WHEN** the user edits again after a failed save
- **THEN** saving re-arms and a later successful save clears the failure

### Requirement: An open page keeps its place across a save

While the user edits, the pane SHALL keep its scroll position across the refresh
that follows a save. It SHALL scroll back to the top only when a different page
opens.

#### Scenario: Saving a scrolled page does not jump to the top

- **WHEN** the user edits near the end of a long page that is scrolled down and
  the save completes
- **THEN** the pane stays scrolled to the same position

#### Scenario: Switching pages scrolls to the top

- **WHEN** the user switches to a different page while scrolled down
- **THEN** the pane scrolls back to the top

### Requirement: Dropped and pasted files are copied into the vault and linked

Files dropped onto the editor pane, or pasted with no plain text, while a page
is open SHALL each be copied into the vault under a unique name, and a link
SHALL be inserted for every file copied successfully: an image link showing the
file for an image, a plain link otherwise. A drop SHALL insert at the point the
pointer released, or at the caret where that point names no position, and a
paste SHALL insert at the caret. The insertion SHALL go through the normal edit
path, so it appears in the page's draft and undoes like typing. A file whose
clipboard name is generic — a bitmap handed over without a real name — SHALL be
named from the paste's time so repeated pastes are identifiable; a meaningful
name SHALL be kept. A paste carrying plain text SHALL be left to the editor's
own text paste, whether or not files accompany it. A paste or drop with no page
open, an empty clipboard, a dropped directory, and a file whose copy failed
SHALL each change nothing. A copy SHALL never overwrite an earlier file.

#### Scenario: Dropping an image inserts an image link at the drop point

- **GIVEN** an open page with the caret near the top
- **WHEN** a PNG file is dropped onto a paragraph further down
- **THEN** the file is copied into the vault under a unique name and an image
  link is inserted at that paragraph, not at the caret

#### Scenario: Dropping a non-image inserts a plain link

- **WHEN** a PDF is dropped onto the editor pane
- **THEN** it is copied into the vault and a plain markdown link is inserted

#### Scenario: A colliding name is never overwritten

- **GIVEN** a vault that already holds a file named `photo.png`
- **WHEN** another `photo.png` is dropped
- **THEN** the new file lands under a numbered name and the inserted link points
  at the new file

#### Scenario: Pasting a screenshot attaches it and shows it

- **GIVEN** an open page with the caret in the editor and a clipboard holding a
  bitmap under a generic name
- **WHEN** the user pastes
- **THEN** it is copied into the vault under a name carrying the paste's time,
  an image link is inserted at the caret, and the reference shows the bytes

#### Scenario: Pasted text still follows the text rules

- **GIVEN** a clipboard carrying plain text, alone or alongside a file
- **WHEN** the user pastes
- **THEN** the editor's text paste handles it and no file is copied

#### Scenario: Drops never navigate and directories are ignored

- **GIVEN** the app showing the editor pane or the no-folder state
- **WHEN** a file or folder is dropped on the pane
- **THEN** the browser's default drop behavior is prevented, no directory is
  copied, and with no page open nothing is copied and no link is inserted

### Requirement: A written vault-file link has a destination Markdown reads

The destination of every link or image the app writes for a vault file SHALL be
in a form a Markdown reader reads as that destination: the characters that would
end or alter a destination — space, parentheses, angle brackets, quotation
marks, backtick, percent — SHALL be encoded, and the path separator SHALL NOT
be, so decoding the destination yields exactly the file's vault path.

#### Scenario: A name carrying a space is written readably

- **GIVEN** a vault file named `Q3 report.pdf`
- **WHEN** a link to it is written
- **THEN** the destination is the file's vault path with the space encoded, and
  reads back to the same file

#### Scenario: An ordinary path is written unchanged

- **GIVEN** a vault file whose path needs no encoding
- **WHEN** a link to it is written
- **THEN** the destination is that path with no character changed

#### Scenario: A written link is both a reference and a working link

- **GIVEN** a page holding the text the app writes for a vault file
- **WHEN** the page is saved
- **THEN** the page's files include that file, and Ctrl+Click on the link opens it

### Requirement: A reference dragged from the sidebar is written at the drop point

Releasing a sidebar row over the editor pane while a page is open SHALL insert,
at the drop point, the reference the row names: a file row as an ordinary
markdown link or image, and a page row as a reference token in one of the two
forms. The insertion SHALL go through the normal edit path and undo like typing.
The gesture SHALL write nothing to the vault and SHALL NOT open or navigate to
what it names, add a history entry, or change anything but the open page's text.
With no page open, or a payload naming nothing writable, the drop SHALL change
nothing. Where the release point names no position the reference can occupy —
outside the text, or inside a block that cannot hold it, such as a code block —
it SHALL be inserted at the caret.

#### Scenario: Dragging a file row writes a link to that file

- **GIVEN** a vault holding a file and an open page
- **WHEN** the file's row is dragged into the page
- **THEN** a markdown link to that file is inserted at the drop point and the
  file's bytes and the vault's listing are unchanged

#### Scenario: Dragging an image row writes an image

- **GIVEN** a vault holding an image and an open page
- **WHEN** the image's row is dragged into the page
- **THEN** an image link is inserted and renders the file's bytes

#### Scenario: Dragging a page row writes a reference

- **GIVEN** a vault holding a page named `reading list` and an open page
- **WHEN** that row is dragged into the page
- **THEN** `#[[reading list]]` is inserted at the drop point

#### Scenario: A dragged reference is an ordinary edit

- **GIVEN** an open page with unsaved edits and a vault holding a file
- **WHEN** the file's row is dropped into the page
- **THEN** the reference appears in the draft, and undoing restores the previous
  text

#### Scenario: A drag opens nothing and navigates nowhere

- **GIVEN** an open page and a vault holding a file
- **WHEN** the file's row is dragged into the page and released
- **THEN** no window opens, the same page stays open, and the history trail
  gains no entry

#### Scenario: A drag released inside a code block does not corrupt it

- **GIVEN** an open page holding a fenced code block, with the caret in a
  paragraph
- **WHEN** a file row is dropped onto the code block
- **THEN** the code block is unchanged and the reference is inserted at the caret

### Requirement: Vault image references render in the editor

When an open page references an image stored in the vault, the editor SHALL
display the file's bytes in place of the reference while the caret is outside
it, and SHALL show the source while the caret is inside it so the destination
stays editable. The page's Markdown SHALL NOT change. A reference the vault
cannot resolve SHALL be left as its source text and SHALL NOT be read again, and
a reference carrying a URL scheme SHALL be left untouched with no vault read. A
vault image SHALL be read only when it is needed for display, and the bytes the
open page holds SHALL NOT grow with the number of images it references.

#### Scenario: A vault image reference shows the file's bytes

- **GIVEN** an open page whose markdown references a vault image that exists
- **WHEN** the page renders, with the caret elsewhere
- **THEN** the reference displays the file's bytes and the markdown still reads
  the same path

#### Scenario: A remote image reference is left alone

- **GIVEN** a page referencing an image by an `https:` URL
- **WHEN** the page renders
- **THEN** the image keeps that URL and the vault is not read for it

#### Scenario: An unresolvable reference is not read again

- **GIVEN** a page referencing a vault image path with no file
- **WHEN** the page renders and is then edited
- **THEN** the reference stays unresolved and the vault is not read for that path
  again

#### Scenario: Putting the caret in the reference reveals its source

- **GIVEN** a rendered vault image reference
- **WHEN** the user places the caret inside the reference's text
- **THEN** the reference shows its Markdown source so the destination can be
  edited

### Requirement: Vault images fit the pane and expand to their original size

An image the vault resolved SHALL be displayed fitted to the pane's content
width: one wider than the pane SHALL be scaled down with its aspect ratio kept,
and one narrower SHALL be shown at its own width, never enlarged. It SHALL carry
a control in its corner that toggles between the fitted size and the image's own
size, visible while the pointer is over the image or the control has focus and
while the image is expanded, and named for the action it performs. The control
SHALL be present only for an image the vault resolved. The expanded state SHALL
NOT reach the document or any stored state: the markdown SHALL keep the reference
it had, the file SHALL be unchanged, and the state SHALL be discarded when the
page is left or reloaded. A remote image and an unresolvable vault reference
SHALL keep its own size and get no control.

#### Scenario: A wide vault image is scaled to the pane

- **GIVEN** an open page displaying a vault image wider than the pane's content
- **WHEN** the page renders
- **THEN** the image is displayed at the pane's content width with its aspect
  ratio kept

#### Scenario: A narrow vault image is left at its own size

- **GIVEN** an open page displaying a vault image narrower than the pane
- **WHEN** the page renders
- **THEN** the image is displayed at its own width, not enlarged

#### Scenario: The control expands and collapses

- **GIVEN** an open page displaying a fitted vault image
- **WHEN** the user activates the control
- **THEN** the image is shown at its own width, overflowing the pane where it is
  wider; activating it again fits the image to the pane

#### Scenario: Expanding changes nothing in the page

- **GIVEN** an open page displaying a vault image
- **WHEN** the user expands the image and then edits the page
- **THEN** the markdown still reads the same reference with no size in it and the
  file is unchanged

#### Scenario: The expanded state does not outlive the page

- **GIVEN** an open page whose vault image is expanded
- **WHEN** the user opens another page and returns
- **THEN** the image is fitted to the pane again

### Requirement: Empty pages invite typing

An open page whose content is empty SHALL show a short placeholder at the start
of the document inviting the user to type. It SHALL NOT appear while the page has
content, SHALL return when the user deletes all content, SHALL NOT be selectable,
and SHALL NOT be part of the page's content or written to its file.

#### Scenario: A blank page invites typing

- **WHEN** an open page has no content
- **THEN** a placeholder shows at the document start, and neither the page's
  content nor its file contains it

#### Scenario: Typing hides the placeholder

- **WHEN** the user types into an empty page
- **THEN** the placeholder disappears

#### Scenario: Emptying the page brings the placeholder back

- **WHEN** the user deletes all content from a page that had content
- **THEN** the placeholder shows again

### Requirement: External URLs and vault links open on Ctrl+Click

A URL written bare in a page — `http://…`, `https://…`, or `www.…` — SHALL be
displayed in the app's link style while the document and the saved Markdown keep
exactly the characters the user typed. Ctrl+Click (Cmd+Click on macOS) on that
text, and on a markdown link, SHALL open the target in the browser without
navigating the app away. A plain click SHALL place the caret and open nothing. A
bare fragment SHALL open nothing in any modifier state. A link whose target is a
vault path SHALL open the file stored there: a type the browser displays in a
new tab, any other type as a download for the operating system's application.
The vault SHALL be read once per activation and the page's Markdown and the
file's bytes SHALL NOT be changed. Because a browser cannot hand a file on disk
to the operating system in place, what opens is a copy as it was read; an edit
made in that application SHALL NOT be saved back by the app. A target the vault
cannot resolve SHALL open nothing and leave the app unchanged.

#### Scenario: A bare URL becomes a link and opens on Ctrl+Click

- **GIVEN** a page whose text contains a bare URL
- **WHEN** the page renders and the user Ctrl+Clicks that text
- **THEN** it is displayed as a link, the browser opens the URL in a new tab, and
  the page stays open where it was

#### Scenario: A plain click only edits

- **GIVEN** a page containing a bare URL and a markdown link
- **WHEN** the user clicks either without a modifier
- **THEN** no tab opens, the caret is placed where the click landed, and the text
  is unchanged

#### Scenario: The file keeps the characters typed

- **GIVEN** a page whose text contains a bare URL
- **WHEN** the page saves
- **THEN** the Markdown holds that URL exactly as typed, with no mark added

#### Scenario: A vault file that the browser can display opens in a tab

- **GIVEN** an open page linking a vault file the browser can display
- **WHEN** the user Ctrl+Clicks the link text
- **THEN** the stored bytes are displayed in a new tab, the page stays open, and
  the file is unchanged

#### Scenario: A vault file the browser cannot display downloads

- **GIVEN** an open page linking a vault file of a type the browser does not
  display
- **WHEN** the user Ctrl+Clicks the link text
- **THEN** the browser downloads the file and the app stays on the open page

#### Scenario: An unresolvable vault target opens nothing

- **GIVEN** an open page linking a vault path with no file
- **WHEN** the user Ctrl+Clicks the link text
- **THEN** nothing opens and the app does not navigate

### Requirement: The status bar shows the open page's path and save state

An open page SHALL show its file path in the status bar as a breadcrumb of
non-interactive segments with the extension kept on the last, purely
informational and showing the path its first save would create even before the
file exists. The status bar SHALL also report the save state: nothing while the
page is clean, "Unsaved changes" while it has unsaved edits, "Saving…" while a
save is in flight, and "Save failed" when the latest save failed. The status
SHALL stay visible, outside the pane's scroll region.

#### Scenario: The file behind the title is shown

- **GIVEN** a vault file in a nested folder
- **WHEN** the user opens that page
- **THEN** the status bar shows a breadcrumb of the file's path, each segment
  inert

#### Scenario: A page with no file yet shows its would-be path

- **WHEN** the user opens a page that has no file yet
- **THEN** the status bar shows the path that page will be saved under

#### Scenario: The path group is empty without a page

- **WHEN** no page is open, the folder is still loading, or search results are
  shown
- **THEN** the status bar shows no path

#### Scenario: The save lifecycle shows through

- **WHEN** the user types, then pauses, and the save succeeds
- **THEN** the status bar shows "Unsaved changes", then "Saving…", then clears

#### Scenario: The save status never scrolls away

- **WHEN** the user scrolls a long page while a save is in flight
- **THEN** the "Saving…" status stays visible

### Requirement: Typing a reference offers matching pages

While the caret sits at the end of an in-progress reference (`#` followed by
word characters, or `#[[` followed by text), the editor SHALL offer a popup of
candidate pages whose names match the typed text. Candidates SHALL be existing
pages only, in the app's page order (favorites first, then most recently
modified), capped at a small fixed number of rows. A candidate SHALL match when
its name starts with the typed text, or one of its words (delimited by space,
`-`, or `_`) starts with it; matching SHALL be case-insensitive and SHALL NOT
match a fragment inside a word. Each row SHALL show the page's name as it exists.
The popup SHALL NOT appear when the typed text is empty, when nothing matches,
inside code, or when the caret is not at the end of the token.

#### Scenario: Typing a prefix lists matching pages

- **WHEN** the user types a reference prefix and matching pages exist
- **THEN** they appear as rows, in the app's page order

#### Scenario: Rows show the on-disk name

- **GIVEN** the vault holds a page named with different casing than typed
- **WHEN** the user types a reference prefix
- **THEN** the row shows the page's name as it exists

#### Scenario: A bare `#` opens nothing

- **WHEN** the user types `#` before any name character
- **THEN** no popup appears

#### Scenario: No matches means no popup

- **WHEN** the user types a prefix matching no page
- **THEN** no popup appears

#### Scenario: Code is never completed

- **WHEN** the caret is inside code and the text contains a reference prefix
- **THEN** no popup appears

### Requirement: The completion popup is keyboard-navigable

The first row SHALL be active as soon as the popup appears. The arrow keys SHALL
move the active row, wrapping at the ends; Enter and Tab SHALL accept it; Escape
SHALL dismiss the popup, and the same token SHALL NOT reopen it until the text
changes. The popup SHALL claim only these unmodified keys and only while it is
visible; modified keys SHALL NOT be claimed, so Mod+Enter keeps activating the
reference. The popup SHALL hide when the editor loses focus.

#### Scenario: Arrow keys move the active row

- **WHEN** the popup shows several rows and the user presses the arrow keys
- **THEN** the active row moves, wrapping at the ends

#### Scenario: Type and Enter accepts the first row

- **WHEN** the user types a reference and presses Enter
- **THEN** the best matching row is accepted and the paragraph is not split

#### Scenario: Escape dismisses without accepting

- **WHEN** the popup is visible and the user presses Escape
- **THEN** it closes, the text is unchanged, and it does not reopen while the
  same token remains

#### Scenario: Modified keys are never claimed

- **WHEN** the popup is visible and the user presses Mod+Enter
- **THEN** the reference at the caret is activated and the popup accepts no row

#### Scenario: With the popup hidden, editor keys are unchanged

- **WHEN** no popup is visible and the user presses Enter, Tab, or an arrow key
- **THEN** the editor behaves exactly as it does without completion

### Requirement: Accepting a candidate writes the reference and saves normally

Accepting a row SHALL replace the in-progress token with the complete reference
token for the picked page, in the page's on-disk casing and in the form the user
was typing. The caret SHALL land immediately after the token with no trailing
space, and the insertion SHALL be one edit that reaches the draft and the
debounced save like any other, so it round-trips and is undoable. Focus SHALL
remain in the editor.

#### Scenario: A bracketed trigger keeps its brackets

- **WHEN** the user types `#[[read` and accepts the page `reading`
- **THEN** the page contains `#[[reading]]` and the caret sits after it

#### Scenario: The picked name uses its on-disk casing

- **WHEN** the user types `#read` and accepts the page `Reading`
- **THEN** the page contains `#Reading`

#### Scenario: The insertion saves and round-trips

- **WHEN** the user accepts a row and waits for the save
- **THEN** the file contains the token, reopening shows the same token, and one
  undo reverts the insertion

#### Scenario: Focus stays in the editor

- **WHEN** the user accepts a row
- **THEN** the editor keeps focus and the page is not navigated

### Requirement: The completion popup reads as app chrome

The reference-completion popup SHALL be presented as the app's own floating
surface, not the editor library's default tooltip: an `--ivory` fill, no border,
8px radius, and the whisper shadow DESIGN.md reserves for surfaces that float.
Its rows SHALL follow the app's menu-row recipe — the app's UI type,
`--near-black` ink, and the app's row padding and radius — and the active row,
whether moved to by keyboard or hovered by pointer, SHALL carry the app's
interactive fill. The popup SHALL NOT introduce a second chromatic color; the
active row SHALL use the app's warm interactive surface rather than an ink-blue
fill, so the accent stays restrained. The popup's list SHALL keep the platform's
own scrollbar, because it is an overlay whose width comes from its content and
so opts out of the reserved scrollbar lane. Presentation SHALL NOT change which
rows appear, their order or cap, or the keyboard contract.

#### Scenario: The popup carries the app's surface

- **WHEN** the completion popup opens over the editor
- **THEN** it is drawn on an ivory surface with the app's radius and whisper
  shadow, not the editor library's stock tooltip theme

#### Scenario: The active row is the app's interactive fill

- **WHEN** a row is active, by keyboard or pointer
- **THEN** it carries the same warm interactive fill the app's menus and
  dropdown rows use, with no second chromatic color

#### Scenario: A row shows only the candidate's name

- **WHEN** the popup lists matching pages
- **THEN** each row shows the page's name as it exists, with no icon, date, or
  badge added

#### Scenario: Presentation changes no behavior

- **WHEN** the popup opens and the user moves between rows and accepts one
- **THEN** the rows, their order, and the written reference token are exactly
  what they were before the styling

### Requirement: Paste inserts literal text

Pasting into the editor SHALL insert the clipboard's plain text verbatim:
pasted Markdown SHALL be inserted as Markdown with no interpretation, text that
merely looks like markup SHALL stay literal, and line breaks SHALL be preserved.
Rich-text and HTML flavors SHALL be ignored. A clipboard carrying no text SHALL
leave the document unchanged.

#### Scenario: Pasted Markdown lands as written

- **WHEN** the user pastes a multi-block Markdown document from outside
- **THEN** the text is inserted exactly as held, the saved Markdown contains that
  structure, and reopening shows the same text

#### Scenario: Pasting formatted web text stays plain

- **WHEN** the user pastes formatted text from a web page
- **THEN** it appears as plain text with no formatting carried over

#### Scenario: A clipboard with no text changes nothing

- **WHEN** the user pastes a clipboard carrying files but no text
- **THEN** the document is unchanged

### Requirement: The editor frames the located block

When the app opens a page to one or more blocks — a search result, which names
every block holding a match, or a Contents row, which names one heading — the
editor SHALL frame each around its whole extent and SHALL scroll the first into
view. The frames SHALL be identical, with nothing marking the scrolled-to block
apart from the scroll. The frame SHALL be drawn without changing layout, so it
moves and reflows nothing. It SHALL be presentational: it SHALL NOT enter the
page's Markdown, change the saved content, or be written. It SHALL NOT fade, and
a document change SHALL NOT clear it; each frame SHALL stay with the text it
marks as the document changes. Leaving the located page and returning, including
through Back and Forward, SHALL NOT clear it. A page opened with no block named
SHALL be unmarked. Locating SHALL NOT create an undoable edit and SHALL NOT move
the caret or the selection.

#### Scenario: A requested block is scrolled to and framed

- **GIVEN** a page with several blocks, opened to one of them
- **WHEN** the page renders
- **THEN** that block is scrolled into view and framed

#### Scenario: The frame covers the block's whole extent

- **GIVEN** a page opened to a block of several lines
- **WHEN** the page renders
- **THEN** the frame encloses every line of that block and neither neighbour

#### Scenario: Every matching block is framed

- **GIVEN** a page whose text holds the same term in several blocks
- **WHEN** the user opens the page from the result
- **THEN** all matching blocks are framed and the first is scrolled into view

#### Scenario: An edit keeps the mark

- **GIVEN** a page with a framed block
- **WHEN** the user types inside that block or in another
- **THEN** the frame is still there and still encloses the text it framed

#### Scenario: Returning to the page keeps the mark

- **GIVEN** a page located from a search result
- **WHEN** the user opens another page and comes back, or steps back through
  history
- **THEN** the block is framed again, without a further search

#### Scenario: The mark never reaches the file

- **GIVEN** a page opened to a framed block
- **WHEN** the page is saved or left untouched
- **THEN** the Markdown and the file hold no character for the mark, and the mark
  alone neither marks the page unsaved nor writes it

#### Scenario: The mark leaves the caret alone

- **GIVEN** a page opened to a framed block
- **WHEN** the user inspects the caret and the selection
- **THEN** both are where they were before the block was located

### Requirement: A page or journal ends with an empty line

An open page or journal SHALL end with exactly one empty line, and every page or
journal file the app writes SHALL end the same way. The document SHALL be
normalized when it opens, so a file whose last content line has no empty line
after it shows one, and a file with several trailing blank lines shows one. A
page with no content SHALL be a single empty line. The normalization SHALL
change nothing above the terminal empty line: every character the user typed
SHALL be preserved. Opening a file SHALL NOT write to it, so a file the user
never edits keeps its bytes and gains the empty line on its next save. A save
whose document already ends with exactly one empty line SHALL NOT rewrite the
file for that reason alone.

#### Scenario: A file without a trailing empty line opens with one

- **GIVEN** a page whose file ends with its last content line and no newline
- **WHEN** the page opens
- **THEN** the editor shows an empty line after that content line

#### Scenario: Opening does not write the file

- **GIVEN** a page whose file ends without a trailing empty line
- **WHEN** the page opens and the user makes no edit
- **THEN** the file is unchanged

#### Scenario: A save writes exactly one trailing empty line

- **GIVEN** an open page ending in its last content line
- **WHEN** the user edits and the save completes
- **THEN** the file ends with exactly one empty line after the last content line

#### Scenario: Several trailing blank lines collapse to one

- **GIVEN** a page whose file ends with more than one blank line
- **WHEN** the page is edited and saved
- **THEN** the file ends with exactly one empty line

#### Scenario: An empty page is one empty line

- **GIVEN** a page with no content
- **WHEN** the page is saved
- **THEN** the file holds a single empty line

#### Scenario: The content above the terminal line is untouched

- **GIVEN** a page whose content has no trailing newline
- **WHEN** the page opens and is saved without editing that content
- **THEN** every character above the terminal empty line is written back exactly
  as it was
