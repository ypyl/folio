# Spec Delta

## MODIFIED Requirements

### Requirement: Slides render read-only, as the app renders Markdown

Each slide SHALL render as read-only content derived from the page's Markdown,
using the same Markdown reading the rest of the app uses: headings, paragraphs,
emphasis, lists, links, blockquotes, code blocks, tables, and diagrams SHALL be
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

#### Scenario: A slide's diagram renders as a diagram

- **GIVEN** a slide containing a mermaid fence
- **WHEN** the presentation shows that slide
- **THEN** the diagram is drawn, and the page's Markdown keeps the fence it had

#### Scenario: A diagram that cannot be rendered reads as its source

- **GIVEN** a slide containing a mermaid fence the engine rejects
- **WHEN** the presentation shows that slide
- **THEN** the slide shows that source rather than an empty or broken box

#### Scenario: Slides are not editable

- **WHEN** the presentation shows a slide
- **THEN** the content carries no caret and offers no control that changes the
  page
