## ADDED Requirements

### Requirement: A thematic break renders as a visible rule

A `---` line that a page's Markdown parses as a thematic break SHALL render in the editor as a horizontal rule that is clearly visible against the page surface. The rule SHALL be drawn in the palette's tertiary ink (`--stone`), in the app's canonical form — a `1px` line spanning the block, with the standard block margin above and below it — and SHALL use no token other than an existing one. The rule SHALL stay subordinate to body text: it is a divider, not a heading, and it SHALL NOT carry a weight, a fill, or a second edge beyond the line itself. Drawing it SHALL be presentational: the page's Markdown SHALL keep the `---` exactly as the user wrote it, the break SHALL stay one block for the gutter, the search, and the caret, and drawing it SHALL add no work to the keystroke path. A thematic break nested inside another block — a blockquote or a list item — SHALL be drawn the same way.

#### Scenario: A rule is visible on the page

- **GIVEN** an open page with `---` between two paragraphs
- **WHEN** the page renders
- **THEN** a horizontal rule is drawn in `--stone`, spanning the block, clearly visible against the parchment surface, with space above and below it

#### Scenario: The file keeps its dashes

- **GIVEN** a page whose file holds `---` between two paragraphs
- **WHEN** the page renders and the page saves
- **THEN** the rule is shown on screen and the saved Markdown still holds the `---` line, with no other characters written

#### Scenario: A rule is one block and typing stays bounded

- **GIVEN** an open page with a thematic break among many other blocks
- **WHEN** the gutter numbers the page's blocks and the user types elsewhere in the page
- **THEN** the break is numbered as a single block, and the work per keystroke does not grow with the document's size

#### Scenario: A nested break is drawn the same

- **GIVEN** a page containing `---` inside a blockquote
- **WHEN** the page renders
- **THEN** the rule is drawn inside the blockquote with the same visible ink as a top-level rule
