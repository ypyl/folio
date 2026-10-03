# presentations Specification

## Purpose

Turning the currently open page into a full-viewport, view-only slide deck: slides are
derived from the page's own Markdown, navigated one at a time, and presented without
changing the page or writing anything to the vault.

## Requirements

### Requirement: A top-level thematic break delimits slides

Slides SHALL be delimited by top-level thematic breaks: each `---` line that the page's
Markdown grammar parses as a thematic-break block starts a new slide. The content before the
first break SHALL be the first slide, and the content after the last break SHALL be the last
slide. A page with no top-level thematic break SHALL be a single slide, and an empty page
SHALL be a single empty slide. A `---` inside a fenced code block or an inline code span
SHALL NOT delimit slides, and neither SHALL a thematic break nested inside another block such
as a blockquote or a list item. A break with no content between it and the next break SHALL
not produce a slide.

#### Scenario: Breaks separate slides

- **GIVEN** an open page whose content is "Intro" then a top-level `---` then "Talk" then a top-level `---` then "End"
- **WHEN** the user opens a presentation
- **THEN** the deck has three slides: "Intro", "Talk", "End"

#### Scenario: No break is one slide

- **GIVEN** an open page with no top-level thematic break
- **WHEN** the user opens a presentation
- **THEN** the deck has exactly one slide holding the whole page

#### Scenario: A break inside a code block is content

- **GIVEN** an open page containing a fenced code block whose body holds a `---` line
- **WHEN** the user opens a presentation
- **THEN** the `---` does not start a new slide

#### Scenario: A nested break is not a boundary

- **GIVEN** a page containing a thematic break inside a blockquote or a list item
- **WHEN** the user opens a presentation
- **THEN** that break does not start a new slide

#### Scenario: An empty segment produces no slide

- **GIVEN** an open page whose first block is a top-level `---`
- **WHEN** the user opens a presentation
- **THEN** the deck's first slide is the content that follows, not an empty slide

### Requirement: Slides render read-only through the app's Markdown semantics

Each slide's content SHALL render as read-only content derived from the page's Markdown, using
one Markdown grammar: a slide's text SHALL be split into slides by top-level thematic breaks, and
within a slide, headings, paragraphs, emphasis, lists, links, blockquotes, code blocks, and tables
SHALL be interpreted the same way everywhere in the app. A slide SHALL present no editing
affordance: no caret, no text entry, and no editing or formatting control. A vault image a slide
references SHALL display the file's bytes, read through the vault storage seam, the same way the
editor displays it. Rendering a slide SHALL NOT introduce a Markdown grammar or a rendering path
separate from the one the page's Markdown already has.

#### Scenario: Common constructs render

- **GIVEN** a slide containing headings, a bullet list, a fenced code block, and a table
- **WHEN** the presentation shows that slide
- **THEN** each construct renders as its formatted content, not as literal Markdown

#### Scenario: A vault image displays its bytes

- **GIVEN** a slide referencing an image stored in the vault
- **WHEN** the presentation shows that slide
- **THEN** the image's bytes are displayed, and the page's Markdown keeps the path it had

#### Scenario: Slides are not editable

- **WHEN** the presentation shows a slide
- **THEN** the content carries no caret and offers no control that changes the page

### Requirement: Navigation moves one slide at a time and reports position

The presentation SHALL move forward by one slide on `ArrowRight`, `Space`, `PageDown`, or
`ArrowDown`, and backward by one slide on `ArrowLeft`, `PageUp`, or `ArrowUp`, and SHALL
move to the first slide on `Home` and the last on `End`. Moving backward from the first
slide and forward from the last SHALL do nothing: navigation SHALL NOT wrap. The
presentation SHALL report the current position as the current slide number over the total
slide count, and SHALL indicate overall progress through the deck. On-screen controls SHALL
offer the next, previous, and close actions, each with a name that states its action, and
SHALL be operable by keyboard.

#### Scenario: Forward and backward

- **GIVEN** a deck of three slides showing the first
- **WHEN** the user moves forward
- **THEN** the second slide is shown

- **WHEN** the user moves backward
- **THEN** the first slide is shown

#### Scenario: Ends do not wrap

- **GIVEN** a deck showing its first slide
- **WHEN** the user moves backward
- **THEN** the first slide remains shown

#### Scenario: The last slide's next does nothing

- **GIVEN** a deck showing its last slide
- **WHEN** the user moves forward
- **THEN** the last slide remains shown

#### Scenario: Position is reported

- **WHEN** a deck of three slides shows its second slide
- **THEN** the presentation reports the position as 2 of 3 and indicates progress through the deck

#### Scenario: Controls can be reached and used by keyboard

- **WHEN** the presentation is open
- **THEN** its next, previous, and close controls are focusable, carry names stating their actions, and move or close the deck when activated

### Requirement: Fullscreen can be toggled without leaving the presentation

The presentation SHALL enter and leave fullscreen on `F` and through an on-screen control
that toggles between fullscreen and windowed. Opening a presentation SHALL NOT itself enter
fullscreen. Leaving fullscreen SHALL NOT close the presentation. Where the browser refuses
or ignores the fullscreen request, the presentation SHALL remain usable in the window.

#### Scenario: F toggles fullscreen

- **GIVEN** an open presentation in a window
- **WHEN** the user presses `F`
- **THEN** the presentation enters fullscreen
- **AND** **WHEN** the user presses `F` again
- **THEN** the presentation returns to the window and remains open

#### Scenario: A refusing browser leaves the deck usable

- **GIVEN** a browser that refuses the fullscreen request
- **WHEN** the user requests fullscreen
- **THEN** the presentation stays open and navigable in the window

### Requirement: Presenting adds nothing to the editor's typing cost

Opening a presentation SHALL derive the deck from the page once, and moving between slides
SHALL reuse that derived deck: navigation SHALL NOT re-parse, re-serialize, or re-read the
page, and SHALL NOT read the vault. Opening and closing a presentation SHALL leave the
editor's per-keystroke work unchanged.

#### Scenario: Navigation reads nothing

- **GIVEN** an open presentation
- **WHEN** the user moves through every slide
- **THEN** the page is not re-parsed or re-serialized and no vault file is read

#### Scenario: The editor's keystroke cost is unchanged

- **GIVEN** a presentation that has been opened and closed
- **WHEN** the user types in the editor
- **THEN** the work per keystroke is the same as before the presentation

### Requirement: Presenting a page renders it as a full-viewport deck

Presenting SHALL render the presented page as a slide deck that occupies the whole workspace, replacing the folder rail, sidebar, editor pane, and meta panel for as long as the presentation is open, and showing exactly one slide at a time. Presenting SHALL be entered from a page row's context menu (row-context-menu capability) and SHALL be available only for a file-backed page row: a journal day has no row, and a page with no file on disk has no row, so neither can be presented. When the presented page is the open page, the content as it currently stands in the editor SHALL be the source of slides, including edits not yet saved to the file. When the presented page is not the open page, the app SHALL open it first and derive the deck from the live document once that document is ready, so its draft's unsaved edits present there too. Presenting SHALL NOT read or write any vault file.

#### Scenario: A page row presents

- **GIVEN** a vault with a page row in the Files listing
- **WHEN** the user activates Present on that row
- **THEN** the workspace is replaced by a full-viewport deck showing that page's first slide

#### Scenario: The open page presents without navigating

- **GIVEN** a page open in the editor
- **WHEN** the user activates Present on that page's row
- **THEN** the deck shows the page's content and remains on that page

#### Scenario: A non-open page opens first

- **GIVEN** a page row that is not the open page
- **WHEN** the user activates Present on that row
- **THEN** that page opens in the editor and the deck shows its first slide

#### Scenario: Unsaved edits are what present

- **GIVEN** an open page with edits that have not been saved
- **WHEN** the user presents that page
- **THEN** the deck shows the edited content, and the page's file remains as it was

#### Scenario: A journal day cannot be presented

- **GIVEN** a journal day open in the editor
- **WHEN** the user looks for a way to present it
- **THEN** there is no page row for the day and so no present affordance

#### Scenario: A page with no file cannot be presented

- **GIVEN** a page open in the editor that has no file on disk
- **WHEN** the user looks for a way to present it
- **THEN** there is no page row for it and so no present affordance
