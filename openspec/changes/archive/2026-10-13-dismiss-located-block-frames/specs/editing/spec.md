# Spec Delta

## MODIFIED Requirements

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
through Back and Forward, SHALL NOT clear it. Pressing `Escape` SHALL clear the
frames when no other surface claims the key, and a page whose frames were
cleared SHALL be unmarked when it is opened again; the next locate SHALL frame
it again. `Escape` SHALL NOT clear the frames while a surface that claims it is
open. A page opened with no block named SHALL be unmarked. Locating SHALL NOT
create an undoable edit and SHALL NOT move the caret or the selection.

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

#### Scenario: Escape clears the frames

- **GIVEN** a page with one or more framed blocks and no other surface open
- **WHEN** the user presses `Escape`
- **THEN** the frames are gone, and the page and its file are otherwise
  unchanged

#### Scenario: A cleared page stays unmarked

- **GIVEN** a page whose frames were cleared with `Escape`
- **WHEN** the user opens another page and comes back
- **THEN** the page is unmarked, and a later locate frames it again

#### Scenario: Escape yields to an open surface

- **GIVEN** a page with framed blocks and a surface that claims `Escape` open —
  the search spotlight, the results view, the app tour, the presentation deck,
  the row context menu, or the editor's completion popup
- **WHEN** the user presses `Escape`
- **THEN** that surface handles the key and the frames are still there

#### Scenario: The mark never reaches the file

- **GIVEN** a page opened to a framed block
- **WHEN** the page is saved or left untouched
- **THEN** the Markdown and the file hold no character for the mark, and the mark
  alone neither marks the page unsaved nor writes it

#### Scenario: The mark leaves the caret alone

- **GIVEN** a page opened to a framed block
- **WHEN** the user inspects the caret and the selection
- **THEN** both are where they were before the block was located
