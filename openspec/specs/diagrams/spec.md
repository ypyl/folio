# Diagrams

## Purpose

A diagram written as a fenced block on a page, drawn from its own text with no
file of its own, presentational in exactly the way a table and an image are.

## Requirements

### Requirement: A diagram renders in every build

The capability SHALL be on in every build. No build-time flag and no app-level
preference SHALL gate whether a `mermaid` fence renders, and every surface that
shows a page's Markdown — the editor pane and a presentation deck — SHALL draw a
fence's diagram without being handed a gate. Turning the app-level experimental
switch on or off SHALL NOT change what a page draws.

#### Scenario: The shipped build draws a diagram

- **GIVEN** a build with no environment override
- **WHEN** a page holding a `mermaid` fence is shown
- **THEN** the fence renders as its diagram, with no switch to flip

#### Scenario: The experimental switch does not change what a page draws

- **GIVEN** a page holding a `mermaid` fence and the app's experimental mode both
  off and on
- **WHEN** the page is shown in each state
- **THEN** the fence renders as its diagram in both

#### Scenario: A slide draws its diagram in every build

- **GIVEN** a page holding a `mermaid` fence and a presentation of that page
- **WHEN** the deck shows the fence's slide
- **THEN** the slide shows the drawing, with no switch to flip

### Requirement: A mermaid fence renders as a diagram

A fenced block whose info string is `mermaid`, compared ignoring letter case and
surrounding space, and whose body draws a diagram SHALL render as that diagram
while the surface shows it. A fenced block with any other info string, an
indented code block, and a `mermaid` fence with no body SHALL keep the source
they render today.

#### Scenario: A flowchart renders

- **GIVEN** a page holding a fenced block whose info string is `mermaid` and whose
  body draws a flowchart
- **WHEN** the page is shown with the selection outside that block
- **THEN** the diagram is drawn and its source text is not shown

#### Scenario: The info string decides, ignoring case

- **GIVEN** a page holding a fence opened with three backticks and `Mermaid`
- **WHEN** the page is shown with the selection outside that block
- **THEN** the diagram is drawn

#### Scenario: Another language keeps its source

- **GIVEN** a page holding a fence whose info string is `js`, and an indented
  code block
- **WHEN** the page is shown
- **THEN** both keep the source and the highlighting they had

#### Scenario: An empty mermaid fence keeps its source

- **GIVEN** a page holding a fence whose info string is `mermaid` and whose body
  is empty
- **WHEN** the page is shown with the selection outside that block
- **THEN** no diagram is drawn and the fence reads as source

### Requirement: A diagram shows its source at the selection

While the selection is inside a diagram's block, the surface SHALL show the
block's Markdown text instead of the diagram, and SHALL show the diagram again
once the selection leaves it. A page whose block begins the document SHALL show
its diagram on open, without a press, even though the seeded selection sits on
that block's first character. The source SHALL be the block's text, editable as
it is today.

#### Scenario: The caret reveals the source

- **GIVEN** a page holding a rendered diagram
- **WHEN** the user places the caret inside that block
- **THEN** the block reads as its Markdown source

#### Scenario: A page that opens on a fence shows its drawing

- **GIVEN** a page whose only content is a mermaid fence
- **WHEN** the user opens that page
- **THEN** the diagram is drawn, with no press and no keypress

#### Scenario: Leaving the block brings the diagram back

- **GIVEN** the caret inside a diagram's block, its source showing
- **WHEN** the user places the caret outside that block
- **THEN** the diagram is drawn again

#### Scenario: Pressing a diagram reveals its source

- **GIVEN** a page holding a rendered diagram and the caret elsewhere
- **WHEN** the user presses on the diagram
- **THEN** the caret lands in that block and its source shows

### Requirement: A diagram writes nothing

A diagram SHALL be a rendering of text the page already holds. It SHALL create,
rename, or write no file, SHALL produce no page, board, index entry, backlink, or
favorite of its own, and SHALL leave the block's Markdown unchanged.

#### Scenario: Showing a diagram changes no file

- **GIVEN** a page holding a mermaid fence, saved
- **WHEN** the page is opened, the diagram is drawn, and the page is saved again
- **THEN** the vault holds no new file and the page's Markdown is unchanged

#### Scenario: A diagram adds nothing to the vault's indexes

- **GIVEN** a vault holding a page with a diagram and no other page
- **WHEN** the vault is opened
- **THEN** the page's Links list, the Files listing, and the search results hold
  no entry for the diagram

### Requirement: A diagram that cannot be rendered keeps its source

Where a `mermaid` fence's body is not a diagram the engine accepts, the surface
SHALL keep the block's source and SHALL show a note saying the diagram could not
be rendered. The note SHALL NOT be a dialog, SHALL NOT block the text or the
caret, SHALL add no file, and SHALL leave the Markdown unchanged.

#### Scenario: An unreadable diagram reads as source with a note

- **GIVEN** a page holding a mermaid fence whose body the engine rejects
- **WHEN** the page is shown with the selection outside that block
- **THEN** the block's source is shown with a note that it could not be rendered

#### Scenario: The text is still editable

- **GIVEN** a page holding an unreadable diagram, its note showing
- **WHEN** the user presses on the block and edits the text
- **THEN** the caret is placed in the block and the edit is saved like any other

### Requirement: A diagram renders only while it is on screen

Rendering SHALL be bounded by the visible region: a diagram the pane does not
show SHALL NOT be drawn until the pane scrolls it into view, and SHALL NOT be
drawn again while its text and its visible state are unchanged. A diagram the
pane scrolls away from SHALL release what its drawing held.

#### Scenario: A diagram below the fold waits

- **GIVEN** a page holding a diagram far below the first screen
- **WHEN** the page opens
- **THEN** that diagram is not drawn until the pane scrolls it into view

#### Scenario: Scrolling back does not redraw

- **GIVEN** a diagram already drawn, scrolled out of view and back into view
- **WHEN** the pane shows it again and its text is unchanged
- **THEN** the drawn diagram is reused rather than drawn again

### Requirement: Typing never waits on the diagram engine

An edit SHALL NOT be delayed by drawing a diagram: a keystroke SHALL NOT start a
diagram render, and an edit that leaves a diagram's text unchanged SHALL NOT draw
that diagram again.

#### Scenario: Typing elsewhere draws nothing

- **GIVEN** a page holding a rendered diagram and text after it
- **WHEN** the user types in that text
- **THEN** the diagram is not drawn again and the typing keeps its pace

#### Scenario: Typing inside a diagram draws nothing

- **GIVEN** the caret inside a diagram's block, its source showing
- **WHEN** the user edits that source
- **THEN** no diagram is drawn until the selection leaves the block

### Requirement: A diagram is drawn in the app's palette

A drawn diagram SHALL use the app's colours, type, and line weights rather than
the engine's stock theme, so it does not read as a foreign surface on the page.
The configuration SHALL be scoped to what the app draws and SHALL NOT change any
other surface.

#### Scenario: A diagram uses the app's colours

- **WHEN** a diagram is drawn
- **THEN** its fill, ink, and lines come from the app's design tokens

#### Scenario: The rest of the app is unchanged

- **GIVEN** a page holding a drawn diagram
- **WHEN** the rest of the page and the app's chrome render
- **THEN** their colours and fonts are unchanged

### Requirement: The engine loads only when a diagram is shown

The diagram engine SHALL be fetched the first time a diagram is drawn, and SHALL
NOT be fetched or preloaded when the app starts. Opening a page with no diagram
SHALL fetch nothing. The offline install SHALL NOT include the engine, so
installing the app does not download a diagram renderer the vault may never use.

#### Scenario: Starting the app fetches no engine

- **GIVEN** an app that has not shown a diagram
- **WHEN** the app starts
- **THEN** it fetches the diagram engine and preloads nothing for it

#### Scenario: A page with no diagram fetches no engine

- **GIVEN** an app running with a page holding no mermaid fence
- **WHEN** the user opens that page
- **THEN** the diagram engine is not fetched

#### Scenario: The first diagram loads the engine

- **GIVEN** an app running with a page holding a mermaid fence
- **WHEN** the diagram is drawn
- **THEN** the engine loads once and later diagrams reuse it

### Requirement: One engine configuration serves every renderer

The app and the board editor SHALL share one diagram engine, whose configuration
is global and mutable. A renderer SHALL set the configuration it draws with
immediately before it draws, and SHALL restore the configuration it found once
that drawing settles, whether it drew or was refused. Page and slide drawings
SHALL be serialized, so the engine is never asked for two of them at once. The
app's palette SHALL NOT outlive the drawing it was set for, so a diagram pasted
into a board SHALL NOT be drawn in the app's palette.

#### Scenario: A board render does not change the page's diagrams

- **GIVEN** a vault holding a board with pasted mermaid text and a page with a
  diagram
- **WHEN** the board is opened, its text is converted, and the page's diagram is
  then drawn
- **THEN** the page's diagram is drawn in the app's palette

#### Scenario: Two diagrams on one page do not interleave

- **GIVEN** a page holding two diagrams, both on screen and not yet drawn
- **WHEN** the pane draws them
- **THEN** they are drawn one after the other and each is complete

#### Scenario: A page's palette does not reach a board paste

- **GIVEN** a page that has drawn a diagram
- **WHEN** the user pastes mermaid text into a board and the board editor
  converts it
- **THEN** the converted elements do not use the app's palette

#### Scenario: A refused drawing leaves the engine as it was found

- **GIVEN** a fence the engine refuses, after a drawing in the app's palette
- **WHEN** the refusal settles and the next renderer draws
- **THEN** it finds the configuration that was in place before the app drew

### Requirement: A diagram fits the pane's width

A drawn diagram SHALL be sized to the pane's content width, scaled down where its
own proportions need more room, and SHALL NOT overflow the pane horizontally or
scroll on its own. A rendered diagram SHALL offer no zoom, pan, or fullscreen
control of its own.

#### Scenario: A wide diagram is scaled to the pane

- **GIVEN** a page holding a diagram wider than the pane
- **WHEN** the diagram is drawn
- **THEN** it fits the pane's width without horizontal scrolling

#### Scenario: A diagram carries no view control

- **GIVEN** a drawn diagram
- **WHEN** the user looks at it and presses on it
- **THEN** it offers no zoom, pan, or fullscreen control

### Requirement: A diagram that is not drawn yet shows a placeholder

While a fence's drawing is pending, the surface SHALL show a loading placeholder
in the block's place, sized so the content below it does not jump when the drawing
lands. The placeholder SHALL be the app's own loading shape, SHALL be decorative,
and SHALL NOT be a control. The block SHALL be marked busy for assistive
technology, labelled as a diagram being drawn. The placeholder SHALL be replaced
by the drawing when it lands, and by the block's source with its note when the
engine refuses it.

#### Scenario: A pending drawing shows a placeholder

- **GIVEN** a page holding a mermaid fence whose drawing has not landed
- **WHEN** the page is shown
- **THEN** the block's place holds a loading placeholder, and the block reports
  itself busy to assistive technology

#### Scenario: The drawing replaces the placeholder

- **GIVEN** a pending diagram showing its placeholder
- **WHEN** the engine answers
- **THEN** the drawing replaces the placeholder and the block is no longer busy

#### Scenario: A refusal replaces the placeholder too

- **GIVEN** a pending diagram showing its placeholder
- **WHEN** the engine refuses the source
- **THEN** the block shows the source and its note, and reports itself no longer
  busy

#### Scenario: The placeholder is not a control

- **GIVEN** a pending diagram showing its placeholder
- **WHEN** the user presses it
- **THEN** the press behaves as a press on the drawing would: the caret lands in
  the fence and its source shows
