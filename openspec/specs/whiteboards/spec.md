# Whiteboards

## Purpose

Whiteboards: a board is a drawing stored in the vault that the app creates,
edits, and writes, referenced from a page or journal by a `#!` token and opened
in the main pane.

## Requirements

### Requirement: A board is a vault drawing, not a page and not a file

A board SHALL be a drawing stored in the vault's boards. A board SHALL NOT
produce a page, page-search content, a backlink, a favorite, or editor content,
and it SHALL NOT be listed among the vault's files. Unlike a file, a board SHALL
be opened, edited, and saved by the app: the board holds the drawing, and a save
SHALL write it back. The app SHALL NOT rename, move, or delete a board.

#### Scenario: A board is not a page

- **WHEN** a vault holds a board
- **THEN** it produces no page and is found by no page-content search

#### Scenario: A board is not a file

- **WHEN** the Files listing renders
- **THEN** the board is not listed among the file rows

#### Scenario: A board is editable

- **GIVEN** an open board
- **WHEN** the user draws an element and the save settles
- **THEN** the board holds the new drawing and no other file changed

### Requirement: A board is referenced by a `#!` token

A board reference SHALL be written in exactly one of two forms: `#!word`, where
`word` is a single word of letters, digits, `_`, or `-`, or `#![[Many Words]]`,
which may contain spaces. The referenced name SHALL resolve to the board of that
name, ignoring letter case, and the name SHALL be the board's identity. A `#!`
with no valid name SHALL remain literal text, and other tools' conventions SHALL
NOT be board references.

#### Scenario: A single-word reference resolves to its board

- **GIVEN** a vault holding a board named Migration
- **WHEN** a page's Markdown contains `#!Migration`
- **THEN** the reference resolves to that board

#### Scenario: A bracketed reference holds a spaced name

- **GIVEN** a vault holding a board named Migration topology
- **WHEN** a page's Markdown contains `#![[Migration topology]]`
- **THEN** the reference resolves to that board

#### Scenario: Resolution ignores letter case

- **GIVEN** a vault holding a board named Migration
- **WHEN** a page's Markdown contains `#!migration`
- **THEN** the reference resolves to that board

#### Scenario: A bare sigil is literal text

- **WHEN** a page's Markdown contains `#!` with no name
- **THEN** no board reference is produced and the text stays literal

### Requirement: A reference to a board with no file is valid and creates it on first save

A board reference SHALL be valid even when no board file exists for its name.
Activating such a reference SHALL open a blank board, and merely opening SHALL
create no file. The file SHALL be created only when the board's first change is
saved, so referencing or opening a board never leaves an orphan file. The board
SHALL take the name it was referenced by.

#### Scenario: A new name opens a blank board

- **GIVEN** a vault with no board of that name
- **WHEN** the user writes `#![[Architecture]]` and activates it
- **THEN** a blank board opens and the vault holds no new file

#### Scenario: The first save creates the board

- **GIVEN** a blank board opened from a reference and never saved
- **WHEN** the user draws an element and the save settles
- **THEN** the board exists in the vault holding the drawing

#### Scenario: A failed save creates no partial board

- **GIVEN** a blank board whose write fails
- **WHEN** the save attempt fails
- **THEN** no board file is created and the app reports the board's save state

### Requirement: A board reference renders as a badge and opens the board

While a page is open, a board reference SHALL render as a badge over its literal
text, visually distinct from a page reference. Activating the badge SHALL open
the board in the main pane. The token's literal text SHALL remain the page's
canonical content, so moving the caret or editing elsewhere changes nothing on
disk. A board reference inside a code block SHALL be left alone.

#### Scenario: The badge is distinct from a page reference

- **GIVEN** an open page holding a board reference and a page reference
- **WHEN** the page renders
- **THEN** each shows a badge, and the two badges are visually distinguishable

#### Scenario: Activating the badge opens the board

- **WHEN** the user activates a board reference's badge
- **THEN** the board opens and the token's Markdown is unchanged

#### Scenario: A reference in a code block is left alone

- **GIVEN** a page whose code block contains `#!Migration`
- **WHEN** the page renders
- **THEN** the text stays literal with no badge

### Requirement: Completion offers the vault's boards and writes a canonical token

While the caret is inside a board reference, the app SHALL offer the vault's
boards that match the typed text, ranked the way page references are, and SHALL
write the chosen board's token in the form the trigger used and in the board's
own name, as an ordinary edit that saves and undoes like typing. Accepting SHALL
NOT open the board, navigate, or change anything but the page's text. A trigger
matching no board SHALL offer nothing.

#### Scenario: A typed prefix offers matching boards

- **GIVEN** a vault holding two boards, with a page open
- **WHEN** the user types a board reference beginning with one board's name
- **THEN** the picker offers that board and no other

#### Scenario: Accepting writes the canonical token

- **GIVEN** the picker is offering a board
- **WHEN** the user accepts that row
- **THEN** the page's text holds the board's token in its own name and no board
  is opened

#### Scenario: No matching board offers nothing

- **GIVEN** the caret is inside a board reference matching no board
- **WHEN** the picker would offer candidates
- **THEN** it offers nothing and the typed text stays as written

### Requirement: The Files listing lists boards and opens them

The sidebar's Files listing SHALL hold the vault's board rows, ordered by name
and marked with a `b` badge, after its page rows and before its file rows. When
the vault holds no boards the listing SHALL show none. While the folder is
loading the listing SHALL show the loading placeholder. Activating a board row
SHALL open that board, and the open board's row SHALL carry the active marking
and SHALL always be rendered while the board is open.

#### Scenario: The listing lists boards in name order, badged

- **WHEN** the Files listing renders
- **THEN** board rows appear after the page rows and before the file rows, in
  name order, each with a `b` badge

#### Scenario: Activating a row opens the board

- **WHEN** the user activates a board row
- **THEN** the board opens, the page leaves the main pane, and the row is marked
  active

#### Scenario: The open board's row is always rendered

- **GIVEN** the open board sits far from the current scroll position
- **WHEN** the Files listing renders
- **THEN** that board's row is in the document and marked active

### Requirement: A board opens whenever its file is chosen

Choosing a vault file that is a board SHALL open it in the board editor,
whatever route it came by: a board badge, an ordinary Markdown link, the Files
listing, or a search result.

#### Scenario: A path link opens the board

- **GIVEN** a page whose Markdown links a board's path
- **WHEN** the user activates that link
- **THEN** the board editor opens for that board

#### Scenario: Every route opens the same view

- **WHEN** the user reaches a board from its badge, its sidebar row, a path
  link, and a search result in turn
- **THEN** each opens the board editor for that board

### Requirement: The board editor saves board changes only

While a board is open, the app SHALL save the board when its drawing or text
changes, once the edit settles. Panning and zooming the canvas SHALL NOT be a
change and SHALL NOT write the board. The saved board SHALL hold the drawing,
not the current view. The status bar's save state SHALL reflect the board's
save, and a failed save SHALL leave the board as it was rather than writing
partially.

#### Scenario: Drawing saves the board

- **GIVEN** an open board
- **WHEN** the user draws a rectangle and pauses
- **THEN** the board is written once with the rectangle

#### Scenario: Panning does not save

- **GIVEN** an open board already saved
- **WHEN** the user pans or zooms the canvas and pauses
- **THEN** the board is not written

#### Scenario: A failed save keeps the prior board

- **GIVEN** an open board holding a saved drawing
- **WHEN** a save attempt fails
- **THEN** the board still holds its prior drawing and the app reports the save
  as failed

### Requirement: While a board is open the right panel lists the pages that reference it

While a board is open, the right panel SHALL show a "Referenced by" section
listing one row per page that references that board, ordered most recently
edited first, each marked with an `in` badge. Activating a row SHALL open that
page. When no page references the board the section SHALL show empty-state copy,
and while the folder is loading it SHALL show the loading placeholder.

#### Scenario: A board lists the pages that reference it

- **GIVEN** a board referenced by two pages, one edited more recently
- **WHEN** the board is open
- **THEN** the panel lists both pages, most recently edited first, each badged
  `in`

#### Scenario: A row opens its page

- **WHEN** the user activates a row in Referenced by
- **THEN** that page opens

#### Scenario: An unreferenced board shows copy

- **GIVEN** a board no page references
- **WHEN** the board is open
- **THEN** the section shows empty-state copy

### Requirement: A new board opens on the app's parchment

A board whose drawing names no background — one opened from a reference and
never saved, or a file that carries no background — SHALL open on the app's
parchment colour, not on a white default, so a new board is not the one pure
white surface in the app. A board saved with its own background SHALL reopen
with that background unchanged. The background SHALL be part of the board, so it
saves and reopens like any other board property.

#### Scenario: A new board opens on parchment

- **GIVEN** a vault with no board for a reference
- **WHEN** the user opens the reference
- **THEN** the board opens on the app's parchment background, not white

#### Scenario: A board's own background is respected

- **GIVEN** a board saved with its own background colour
- **WHEN** the board is opened
- **THEN** that background is used, unchanged

#### Scenario: The background saves with the board

- **GIVEN** a new board opened on the parchment default
- **WHEN** the user draws an element and the save settles
- **THEN** the board holds the parchment background

### Requirement: A blank board shows a note naming its reference token

A board that holds no elements SHALL show a short note over its canvas. The note
SHALL name the board's `#!` reference token in one of the two reference forms,
so the user can write it in a page, and SHALL say that drawing saves the board.
For a board whose name has no `#!` token form, the note SHALL omit the token and
describe the reference without it. The note SHALL be presentational only: it
SHALL NOT block drawing or selection on the canvas, SHALL NOT be a dialog, SHALL
NOT trap focus, and SHALL require no dismissal. It SHALL disappear once the board
holds an element and SHALL NOT reappear for that open board. A board that holds
elements SHALL show no note. The note SHALL be styled from the app's design
tokens, like the rest of the board editor's chrome, and SHALL add no file and
change no board content.

#### Scenario: A new board shows the note

- **GIVEN** a vault with no board of that name
- **WHEN** the user activates a `#![[Architecture]]` reference and the blank
  board opens
- **THEN** the note is shown, names `#![[Architecture]]`, says drawing saves the
  board, and the vault holds no new file

#### Scenario: A board with elements shows no note

- **GIVEN** a saved board holding a drawing
- **WHEN** the board opens
- **THEN** no note is shown

#### Scenario: The note clears on the first element

- **GIVEN** a blank board showing the note
- **WHEN** the user draws an element
- **THEN** the note disappears and does not return while the board stays open

#### Scenario: The note does not block the canvas

- **GIVEN** a blank board showing the note
- **WHEN** the user draws on the canvas under the note
- **THEN** the element is created, because the note takes no pointer input

#### Scenario: A name with no token form still shows the note

- **GIVEN** a board whose name has no `#!` token form
- **WHEN** the blank board opens
- **THEN** the note is shown, describes the reference, and names no token

### Requirement: A page's boards are listed in its Links list

While a page is open, its Links list SHALL include one row per board the page
references, after its page rows and its file rows, marked with a `b` badge and
labelled with the board's name. A board the vault does not hold yet SHALL be
rendered dimmed but remain activatable; a board the vault holds SHALL NOT be
dimmed. Activating a board row SHALL open the board, recorded as a navigation
and writing no file. When a page references a board and also links the same
board by path, the list SHALL hold one row, not two.

#### Scenario: A page's board appears in its Links list

- **GIVEN** an open page referencing a board the vault holds
- **WHEN** the user looks at the Links list
- **THEN** it lists the board, marked with a `b` badge

#### Scenario: File rows come before board rows

- **GIVEN** an open page that references a board and links a file
- **WHEN** the user looks at the Links list
- **THEN** the file row appears above the board row

#### Scenario: A board with no file is dimmed but opens

- **GIVEN** an open page referencing a board the vault does not hold
- **WHEN** the user activates the row
- **THEN** the row is dimmed and opening it shows a blank board

#### Scenario: A token and a path link to one board yield one row

- **GIVEN** an open page referencing a board and also linking its path
- **WHEN** the user looks at the Links list
- **THEN** it holds a single row for that board

### Requirement: The board editor uses the app's design language

While a board is open, the board editor's own chrome SHALL use the app's design
language rather than the editor's stock light theme: the app's accent, warm
surfaces, warm text, hairline borders, whisper shadow, and interface font. The
override SHALL be scoped to the board editor, so no surface elsewhere changes,
and the editor's layout, toolbar, tool icons, canvas rendering, and drawing
fonts SHALL be unchanged. The canvas cursor for a drawing tool SHALL be the
app's own crosshair, drawn in the app's colour so it reads against light and
dark drawings, and only for the tools that would show a crosshair. The board
editor's main menu SHALL offer the editor's editing and view actions and SHALL
NOT list the editor library's own project links.

#### Scenario: The board editor uses the app's palette

- **WHEN** the board editor's toolbar, menus, and dialogs render
- **THEN** they use the app's accent, surfaces, text, borders, shadow, and font

#### Scenario: The override does not leak

- **GIVEN** the app with a board open
- **WHEN** the rest of the app's surfaces render
- **THEN** their colours and fonts are unchanged

#### Scenario: A drawing tool shows the app's crosshair

- **GIVEN** an open board
- **WHEN** the user selects a drawing tool and moves over the canvas
- **THEN** the pointer shows the app's crosshair, and other tools keep the
  cursor they had

#### Scenario: The menu carries no project links

- **GIVEN** an open board
- **WHEN** the user opens the editor's main menu
- **THEN** it offers the editor's actions and no library project links

### Requirement: The board editor loads only when a board opens

The board editor SHALL load only when a board is opened. Starting the app SHALL
NOT fetch or preload the board editor, and the offline install SHALL NOT include
it, so installing the app does not download a board editor the vault may never
use. This SHALL NOT change any other board behavior.

#### Scenario: Starting the app fetches no board editor

- **GIVEN** an app that has not opened a board
- **WHEN** the app starts
- **THEN** it does not fetch or preload the board editor

#### Scenario: Opening a board loads the board editor

- **GIVEN** the app running with no board open
- **WHEN** the user opens a board
- **THEN** the board editor loads and the board renders in the main pane
