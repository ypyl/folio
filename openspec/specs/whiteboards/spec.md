# whiteboards Specification

## Purpose
Whiteboards: an Excalidraw board is a vault file the app creates, edits, and writes, referenced from a page or journal by a `#!` token and opened in the main pane.

## Requirements

### Requirement: A board is a vault file under boards/, not a page and not an asset

A board SHALL be a `.excalidraw` file under the vault's `boards/` directory, at any depth within it, when no path segment begins with `.`. A board SHALL NOT produce a page record, page-search content, a backlink entry, a pin, or editor content, and it SHALL NOT be listed among the vault's assets. Unlike an asset, a board SHALL be parsed, edited, and written by the app: its file holds the board's scene, and a save SHALL write that scene back to the same path. The app SHALL NOT rename, move, or delete a board. A `.excalidraw` file outside `boards/` SHALL NOT be listed as a board.

#### Scenario: A board file is not a page

- **GIVEN** a vault containing `boards/migration.excalidraw`
- **WHEN** the vault is indexed
- **THEN** the file produces no page record, appears in no Pages listing, and is found by no page-content search

#### Scenario: A board file is not an asset

- **GIVEN** a vault containing `boards/migration.excalidraw`
- **WHEN** the sidebar's Assets section renders
- **THEN** the board is not listed among the assets

#### Scenario: A board outside boards/ is not listed as a board

- **GIVEN** a vault containing `notes/migration.excalidraw`
- **WHEN** the vault is indexed
- **THEN** no board is listed for it

#### Scenario: A board is editable, unlike an asset

- **GIVEN** an open board
- **WHEN** the user draws an element and the save settles
- **THEN** the board's file at its path holds the new scene, and no other file changed

### Requirement: A board is referenced by a #! token that resolves to its file

A board reference SHALL be written in exactly one of two lexical forms: `#!word`, where `word` is a single word of letters, digits, `_`, and `-`; or `#![[Many Words]]`, which may contain spaces. The referenced name SHALL resolve, ignoring letter case, to the board whose file is `boards/<name>.excalidraw`, and the name SHALL be the board's identity the way a page's stem is a page's identity. The token SHALL remain literally in the page's Markdown; the board file is derived from it (ADR-0001, ADR-0012). A `#!` not followed by a valid name SHALL NOT be a board reference and SHALL remain literal text, and a name that cannot be a filename SHALL NOT be a board reference. Plain `[[Page]]` and other tools' reference conventions SHALL NOT be board references.

#### Scenario: A single-word reference resolves to its board

- **GIVEN** a vault holding `boards/Migration.excalidraw`
- **WHEN** a page's Markdown contains `#!Migration`
- **THEN** the reference names the board `Migration` and resolves to `boards/Migration.excalidraw`

#### Scenario: A bracketed reference holds a spaced name

- **GIVEN** a vault holding `boards/Migration topology.excalidraw`
- **WHEN** a page's Markdown contains `#![[Migration topology]]`
- **THEN** the reference resolves to that board

#### Scenario: Resolution ignores letter case

- **GIVEN** a vault holding `boards/Migration.excalidraw`
- **WHEN** a page's Markdown contains `#!migration`
- **THEN** the reference resolves to `boards/Migration.excalidraw`

#### Scenario: A bare sigil is literal text

- **WHEN** a page's Markdown contains `#!` with no name, or `#!` followed by a character no name can hold
- **THEN** no board reference is produced and the text stays literal

### Requirement: A board reference to a board that does not exist is valid and creates the file on first save

A board reference SHALL be valid even when no board file exists for its name. Activating such a reference SHALL open a blank board in the main pane, and merely opening SHALL NOT create a file. The file SHALL be created at `boards/<name>.excalidraw` only when the board's first change is saved, so typing or opening a board reference never leaves an orphan file in the vault. The name SHALL be used as the file's stem exactly as referenced, so the file's name matches the token that created it.

#### Scenario: A new name opens a blank board

- **GIVEN** a vault with no `boards/` directory
- **WHEN** the user writes `#![[Architecture]]` and activates it
- **THEN** a blank board opens in the main pane, the vault folder contains no new file, and no board is listed

#### Scenario: The first save materializes the file

- **GIVEN** a blank board opened from `#![[Architecture]]` that has never been saved
- **WHEN** the user draws an element and the save settles
- **THEN** `boards/Architecture.excalidraw` exists and holds the board's scene

#### Scenario: A failed save creates no partial board

- **GIVEN** a blank board opened from a reference whose write fails
- **WHEN** the save attempt fails
- **THEN** no board file is created and the app reports the board's save state rather than discarding its content

### Requirement: A board reference renders as a badge distinct from a page reference and opens the board

While a page is open, a board reference in its content SHALL render as a badge over its literal text, visually distinct from a page-reference badge. Activating the badge SHALL open the board in the main pane. The token's literal text SHALL remain the page's canonical content; the badge is presentation over it, and moving the caret or editing elsewhere SHALL NOT change what is on disk. A board reference inside a code span or fenced code block SHALL be left alone.

#### Scenario: The badge is visually distinct from a page reference

- **GIVEN** an open page whose content holds `#!Migration` and `#[[Roadmap]]`
- **WHEN** the page renders
- **THEN** the board reference and the page reference each show a badge, and the two badges are visually distinguishable

#### Scenario: Activating the badge opens the board

- **WHEN** the user activates a board reference's badge
- **THEN** the board opens in the main pane and the token's Markdown is unchanged

#### Scenario: A reference in a code block is left alone

- **GIVEN** a page whose fenced code block contains `#!Migration`
- **WHEN** the page renders
- **THEN** the text stays literal with no badge and no board is opened by clicking it

### Requirement: Completion offers the vault's boards and writes a canonical token

While the caret is inside a `#!` or `#![[` board-reference token, the app SHALL offer the vault's boards that match the typed text, ranked the way page references are ranked, and SHALL write the chosen board's canonical token when a candidate is accepted. The token SHALL be written in the form the trigger used (the word form stays word form; a spaced name escalates to the bracketed form), in the name's on-disk casing, as an ordinary edit that saves and undoes like typing. Accepting SHALL NOT open the board, navigate, or change any state other than the page's text. A trigger matching no board SHALL offer nothing.

#### Scenario: A typed prefix offers matching boards

- **GIVEN** a vault holding `boards/Migration.excalidraw` and `boards/Roadmap.excalidraw`, with a page open
- **WHEN** the user types `#!Mig`
- **THEN** the picker offers `Migration` and no other board

#### Scenario: Accepting writes the canonical token

- **GIVEN** the picker is offering the board `Migration` for the typed fragment `mig`
- **WHEN** the user accepts that row
- **THEN** the page's text holds the token `#!Migration` in the on-disk casing, and no board is opened

#### Scenario: The picker opens nothing

- **GIVEN** the caret is inside `#!` and the typed fragment matches no board
- **WHEN** the picker would offer candidates
- **THEN** it offers nothing and the typed text stays as the user wrote it

### Requirement: The sidebar's Boards section lists the vault's boards and opens them

The sidebar's Boards section SHALL list the vault's board inventory (vault-index), ordered by path and labelled by each board's path inside `boards/`. When the vault holds no boards the section SHALL show empty-state copy, and while the index builds it SHALL show the shell's loading placeholders. Activating a board row SHALL open that board in the main pane, and the row for the open board SHALL carry the active marking. The listing SHALL render only the rows near the visible part of its own scroll region, so the number of rows in the document does not grow with the number of boards.

#### Scenario: The section lists boards in path order

- **GIVEN** a vault holding `boards/Migration.excalidraw` and `boards/Archive/old.excalidraw`
- **WHEN** the Boards section renders
- **THEN** it lists two rows, ordered by path, labelled `Archive/old.excalidraw` and `Migration.excalidraw`

#### Scenario: Activating a row opens the board

- **WHEN** the user activates a Boards row
- **THEN** the board opens in the main pane, the editor pane's page is replaced, and the row is marked active

#### Scenario: A large board inventory renders a bounded number of rows

- **GIVEN** a vault with thousands of boards
- **WHEN** the Boards section renders
- **THEN** only a small number of rows near the visible part of its scroll region are in the document, and that number does not grow with the number of boards

#### Scenario: An empty boards folder shows copy

- **GIVEN** an open vault with no boards
- **WHEN** the Boards section is open
- **THEN** it shows empty-state copy instead of rows

### Requirement: Any .excalidraw file opens in the board editor

Activating a vault file whose path ends in `.excalidraw` SHALL open it in the board editor, whether reached by a board-reference badge, an ordinary Markdown link, the sidebar's Boards section, or a search result. The extension SHALL decide the view the way the app decides what a vault file's open gesture does; a link to a board's path is an ordinary Markdown link and does not itself feed the board's referring pages.

#### Scenario: A path link opens the board

- **GIVEN** a page whose Markdown holds `[Arch](boards/Migration.excalidraw)`
- **WHEN** the user activates that link
- **THEN** the board editor opens for `boards/Migration.excalidraw`

#### Scenario: Every route opens the same view

- **WHEN** the user reaches a board from its badge, its sidebar row, a path link, and a search result in turn
- **THEN** each opens the board editor for that board

### Requirement: The board editor saves board changes only

While a board is open, the app SHALL save the board's scene to its file when the board's elements or text change, debounced so that a continuous edit writes once when it settles. Panning and zooming the canvas SHALL NOT be a document change and SHALL NOT write the file. The board's saved content SHALL be the scene the editor holds; the app SHALL NOT persist the canvas camera as document content. The status bar's save state SHALL reflect the board's save, and a failed save SHALL leave the file as it was rather than writing partially.

#### Scenario: Drawing saves the scene

- **GIVEN** an open board
- **WHEN** the user draws a rectangle and pauses
- **THEN** the board's file is written once with the rectangle in its scene

#### Scenario: Panning does not save

- **GIVEN** an open board whose scene has already been saved
- **WHEN** the user pans or zooms the canvas and pauses
- **THEN** the board's file is not written and its content is unchanged

#### Scenario: A failed save keeps the prior scene

- **GIVEN** an open board whose file holds a saved scene
- **WHEN** a save attempt fails
- **THEN** the file still holds its prior scene and the app reports the save as failed

### Requirement: While a board is open the meta panel shows the pages that reference it

While a board is open, the meta panel SHALL show a "Referenced by" section listing one row per page whose Markdown contains a board reference resolving to that board, ordered by row label. Activating a row SHALL navigate to that page. When no page references the board, the section SHALL show empty-state copy, and while the index builds it SHALL show the shell's loading placeholders. The board's open/close state SHALL NOT otherwise change the panel's page-metadata sections.

#### Scenario: A board lists the pages that reference it

- **GIVEN** `boards/Migration.excalidraw`, referenced from `Ideas.md` and `Log.md`
- **WHEN** the board is open
- **THEN** the panel's Referenced by section lists `Ideas` and `Log` rows, alphabetically

#### Scenario: A row navigates to its page

- **WHEN** the user activates a row in Referenced by
- **THEN** that page opens in the main pane

#### Scenario: An unreferenced board shows copy

- **GIVEN** a board no page references
- **WHEN** the board is open
- **THEN** the Referenced by section shows empty-state copy

### Requirement: A board with no background of its own opens on the app's parchment

While a board is open, the board editor's canvas background SHALL be the scene's own `viewBackgroundColor` when the board carries one. A board whose scene names no background — a board created from a reference and never saved, or a file that carries no background value — SHALL open with the canvas background set to the app's parchment token (`--parchment`, `#f5f4ed`) rather than the editor's own white default, so a new board is not the one pure-white surface in the app. The default SHALL apply only when the scene names none: a board saved with a background, or one whose background the user changed with the editor's background picker, SHALL reopen with that value unchanged. The background SHALL be part of the board's scene, so it saves and reopens like any other board property, and the app SHALL NOT write a background over one the board already holds.

#### Scenario: A new board opens on parchment

- **GIVEN** a vault with no board file for `boards/Migration.excalidraw`
- **WHEN** the user opens a `#!Migration` reference
- **THEN** the board editor's canvas background is `#f5f4ed`, not the editor's white default

#### Scenario: A board that names no background gets the default

- **GIVEN** a board file whose scene carries no `viewBackgroundColor`
- **WHEN** the board is opened
- **THEN** the canvas background is `#f5f4ed`

#### Scenario: A board's own background is respected

- **GIVEN** a board file whose scene carries `viewBackgroundColor` `#fffce8`
- **WHEN** the board is opened
- **THEN** the canvas background is `#fffce8`, unchanged by the default

#### Scenario: The background saves with the scene

- **GIVEN** a new board opened on the parchment default
- **WHEN** the user draws an element and the save settles
- **THEN** the board's file holds the scene with `viewBackgroundColor` `#f5f4ed`

### Requirement: A page's board references are listed in the References section

While a page is open, the meta panel's References section SHALL list one row per board the page's Markdown references with a `#!` token, in the same list as the page's asset rows and ordered with them alphabetically by row label. A board row SHALL be labelled by the board's path inside `boards/` — the label the sidebar's Boards section uses — and SHALL NOT appear in Forwardlinks, which lists page references only. A board the vault does not hold yet SHALL be rendered dimmed and remain activatable; a board the vault holds SHALL NOT be dimmed. Activating a board row SHALL open the board in the main pane, as activating a Boards row does: a navigation recorded in the session trail, never a file copy, and the vault file SHALL NOT be written by the activation. A `.excalidraw` file reached from the References list SHALL open in the board editor whether the row came from a `#!` token or an ordinary path link, because the extension decides the view. When a page references a board and also links the same file by path, the section SHALL list one row for it, not two.

#### Scenario: A page's board appears in References

- **GIVEN** an open page whose content is `See #!Migration` and a vault holding `boards/Migration.excalidraw`
- **WHEN** the user looks at the References section
- **THEN** it lists a `Migration.excalidraw` row

#### Scenario: Board and asset rows share one alphabetical list

- **GIVEN** an open page whose content is `#!Migration and [report](assets/q3-report.pdf)`
- **WHEN** the user looks at the References section
- **THEN** it lists `Migration.excalidraw` and `q3-report.pdf` rows, ordered by label

#### Scenario: A board with no file is dimmed but opens

- **GIVEN** an open page whose content is `#!Architecture` and no `boards/Architecture.excalidraw` in the vault
- **WHEN** the user looks at the References section and activates the row
- **THEN** the row is rendered dimmed and opening it shows a blank board in the main pane

#### Scenario: Activating a board row navigates to the board

- **GIVEN** an open page whose References section lists `Migration.excalidraw`
- **WHEN** the user activates that row
- **THEN** the board opens in the main pane, the row is the active entry in the trail, and the board's file is unchanged by the activation

#### Scenario: A board is not a Forwardlink

- **GIVEN** an open page whose content is `#!Migration and #Roadmap`
- **WHEN** the user looks at the Forwardlinks section
- **THEN** it lists only the `Roadmap` row

#### Scenario: A token and a path link to one board yield one row

- **GIVEN** an open page whose content is `#!Migration and [x](boards/Migration.excalidraw)`
- **WHEN** the user looks at the References section
- **THEN** it lists a single `Migration.excalidraw` row

### Requirement: The board editor's chrome renders in the app's palette

While a board is open, the board editor's own chrome — its toolbar, islands, menus, dialogs, buttons, inputs, and popups — SHALL render in the app's design language rather than the editor library's stock light theme. The accent (selection, active tools, focus, links) SHALL be the app's ink-blue brand and no second chromatic colour SHALL appear in the chrome; island and panel surfaces SHALL be the app's warm ivory and parchment, never pure white; body and label text SHALL be the app's warm near-black and olive; borders SHALL be the app's warm hairline; floating surfaces SHALL carry the app's whisper shadow; and the interface font SHALL be the app's own, not the editor library's bundled font. The override SHALL be scoped to the board editor so no surface elsewhere in the app changes.

The editor's layout, toolbar arrangement, tool icons, canvas rendering, and the hand-drawn drawing fonts SHALL be unchanged: this is the palette around the canvas, not a re-skin of the editor's structure.

#### Scenario: The accent is the app's ink-blue

- **GIVEN** an open board
- **WHEN** the editor's active tool, selection, or a link renders
- **THEN** its accent colour is the brand ink-blue, not the library's violet-blue

#### Scenario: Islands are warm, never white

- **GIVEN** an open board
- **WHEN** the toolbar and any open menu or dialog render
- **THEN** their backgrounds are the app's ivory or parchment, not `#ffffff` and not a cool gray

#### Scenario: The interface font is the app's

- **GIVEN** an open board
- **WHEN** the editor's chrome text renders
- **THEN** it uses the app's interface font stack, not the library's bundled font

#### Scenario: The drawing surface is untouched

- **GIVEN** an open board with drawn elements
- **WHEN** the board renders
- **THEN** the hand-drawn drawing font, the toolbar's layout and tool icons, and the canvas rendering are the editor's own, changed only in the palette around them

#### Scenario: The override does not leak

- **GIVEN** the app with a board open
- **WHEN** the rest of the app's surfaces render
- **THEN** their colours and fonts are unchanged by the board editor's chrome override
