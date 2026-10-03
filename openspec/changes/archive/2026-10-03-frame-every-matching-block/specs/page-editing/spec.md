# Spec Delta

## MODIFIED Requirements

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
