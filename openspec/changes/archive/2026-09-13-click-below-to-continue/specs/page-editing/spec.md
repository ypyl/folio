## ADDED Requirements

### Requirement: The space below the last block belongs to the page
The editor's editable surface SHALL fill the pane's height, so that the empty space below a page's last block is part of the document rather than dead background. A click in that space SHALL place the caret at the end of the document, and the next keystroke SHALL continue the page there. The click SHALL NOT create a block, SHALL NOT change the document's Markdown, and SHALL NOT open a reference or any other target. On a page whose content is taller than the pane, the surface SHALL grow with the content as it does now, so nothing about scrolling changes. The surface SHALL NOT grow upward: the first block's start line, the document's readable column width, the line-number gutter, and an empty page's placeholder SHALL be unaffected.

#### Scenario: Clicking under the last block continues the page
- **GIVEN** an open page whose content ends well above the pane's bottom
- **WHEN** the user clicks in the empty space below the last block and types
- **THEN** the typed text lands at the end of the page, and the page's Markdown gains only that text

#### Scenario: Clicking beside a short last line continues the page
- **GIVEN** a page whose last block is short — a heading, a list item, or a lone reference
- **WHEN** the user clicks the empty space to the right of that line
- **THEN** the caret is placed in that block at the end of its text, and no reference or other target is activated

#### Scenario: The document's start line and width do not move
- **GIVEN** a page open before and after this surface grows
- **WHEN** the page renders
- **THEN** the first block starts on the same line at the same x, the gutter numbers are unchanged, and the prose column keeps its width

#### Scenario: Content taller than the pane scrolls as before
- **GIVEN** a page whose content exceeds the pane's height
- **WHEN** the user scrolls the pane
- **THEN** the page scrolls exactly as it did, with the surface extending to the content's end and no extra empty area inserted above the document
