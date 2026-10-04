# Presentations

## Purpose

Turning the currently open page into a full-viewport, view-only slide deck.
Slides come from the page's own Markdown, are shown one at a time, and change
nothing in the page or the vault.

## Requirements

### Requirement: Presenting a page renders it as a full-viewport deck

Presenting SHALL render the page as a slide deck occupying the whole workspace,
replacing the folder rail, sidebar, editor pane, and right panel while it is
open, and showing exactly one slide at a time. Presenting SHALL be entered from
a page row's menu and SHALL be available only for a page backed by a file: a
journal day and a page with no file have no row and so cannot be presented.
When the presented page is the one open, the deck SHALL show the page's current
content, including edits not yet saved. When it is not the one open, the app
SHALL open it first and then present it, so its unsaved edits present too.
Presenting SHALL read and write no vault file.

#### Scenario: A page row presents

- **GIVEN** a vault with a page row in the Files listing
- **WHEN** the user activates Present on that row
- **THEN** the workspace is replaced by a full-viewport deck showing the page's
  first slide

#### Scenario: The open page presents without navigating

- **GIVEN** a page open in the editor
- **WHEN** the user activates Present on that page's row
- **THEN** the deck shows the page's content and remains on that page

#### Scenario: A page that is not open opens first

- **GIVEN** a page row that is not the open page
- **WHEN** the user activates Present on that row
- **THEN** that page opens and the deck shows its first slide

#### Scenario: Unsaved edits are what present

- **GIVEN** an open page with edits that have not been saved
- **WHEN** the user presents that page
- **THEN** the deck shows the edited content and the page's file is unchanged

#### Scenario: A journal day cannot be presented

- **GIVEN** a journal day open in the editor
- **WHEN** the user looks for a way to present it
- **THEN** there is no page row and so no present affordance

#### Scenario: A page with no file cannot be presented

- **GIVEN** a page open in the editor with no file
- **WHEN** the user looks for a way to present it
- **THEN** there is no page row and so no present affordance

### Requirement: A top-level thematic break delimits slides

Slides SHALL be delimited by top-level thematic breaks: each `---` line that the
page reads as a thematic break starts a new slide. The content before the first
break SHALL be the first slide, and the content after the last break SHALL be
the last slide. A page with no top-level break SHALL be a single slide, and an
empty page SHALL be a single empty slide. A `---` inside a code block or a
nested block SHALL NOT delimit slides, and a break with no content between it
and the next SHALL produce no slide.

#### Scenario: Breaks separate slides

- **GIVEN** a page whose content is "Intro", a top-level `---`, "Talk", a
  top-level `---`, then "End"
- **WHEN** the user opens a presentation
- **THEN** the deck has three slides: "Intro", "Talk", "End"

#### Scenario: No break is one slide

- **GIVEN** a page with no top-level thematic break
- **WHEN** the user opens a presentation
- **THEN** the deck has exactly one slide holding the whole page

#### Scenario: A break inside a code block is content

- **GIVEN** a page with a fenced code block whose body holds a `---` line
- **WHEN** the user opens a presentation
- **THEN** that `---` does not start a new slide

#### Scenario: A nested break is not a boundary

- **GIVEN** a page with a thematic break inside a blockquote or a list item
- **WHEN** the user opens a presentation
- **THEN** that break does not start a new slide

#### Scenario: An empty segment produces no slide

- **GIVEN** a page whose first block is a top-level `---`
- **WHEN** the user opens a presentation
- **THEN** the first slide is the content that follows, not an empty slide

### Requirement: Slides render read-only, as the app renders Markdown

Each slide SHALL render as read-only content derived from the page's Markdown,
using the same Markdown reading the rest of the app uses: headings, paragraphs,
emphasis, lists, links, blockquotes, code blocks, and tables SHALL be
interpreted the same way. A slide SHALL present no editing affordance and no
formatting control. A vault image a slide references SHALL display the file's
bytes, as the editor displays it. The page's Markdown SHALL be unchanged by
presenting it.

#### Scenario: Common constructs render

- **GIVEN** a slide containing headings, a bullet list, a fenced code block, and
  a table
- **WHEN** the presentation shows that slide
- **THEN** each renders as formatted content, not as literal Markdown

#### Scenario: A vault image displays its bytes

- **GIVEN** a slide referencing an image stored in the vault
- **WHEN** the presentation shows that slide
- **THEN** the image is displayed and the page's Markdown keeps the reference it
  had

#### Scenario: Slides are not editable

- **WHEN** the presentation shows a slide
- **THEN** the content carries no caret and offers no control that changes the
  page

### Requirement: Navigation moves one slide at a time and reports position

The presentation SHALL move forward by one slide on `ArrowRight`, `Space`,
`PageDown`, or `ArrowDown`, and backward on `ArrowLeft`, `PageUp`, or
`ArrowUp`, and SHALL move to the first slide on `Home` and the last on `End`.
Moving backward from the first slide or forward from the last SHALL do nothing;
navigation SHALL NOT wrap. The presentation SHALL report the current slide
number over the total and SHALL indicate progress through the deck. On-screen
controls SHALL offer next, previous, and close, each named for its action and
operable by keyboard.

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
- **GIVEN** a deck showing its last slide
- **WHEN** the user moves forward
- **THEN** the last slide remains shown

#### Scenario: Position is reported

- **WHEN** a deck of three slides shows its second slide
- **THEN** the presentation reports the position as 2 of 3 and indicates
  progress through the deck

#### Scenario: Controls are reachable and usable by keyboard

- **WHEN** the presentation is open
- **THEN** its next, previous, and close controls are focusable, named for their
  actions, and move or close the deck when activated

### Requirement: Fullscreen can be toggled without leaving the presentation

The presentation SHALL enter and leave fullscreen on `F` and through an
on-screen control. Opening a presentation SHALL NOT itself enter fullscreen, and
leaving fullscreen SHALL NOT close the presentation. Where the browser refuses
or ignores the fullscreen request, the presentation SHALL remain usable.

#### Scenario: F toggles fullscreen

- **GIVEN** an open presentation in a window
- **WHEN** the user presses `F`
- **THEN** the presentation enters fullscreen
- **WHEN** the user presses `F` again
- **THEN** it returns to the window and remains open

#### Scenario: A refusing browser leaves the deck usable

- **GIVEN** a browser that refuses the fullscreen request
- **WHEN** the user requests fullscreen
- **THEN** the presentation stays open and navigable
