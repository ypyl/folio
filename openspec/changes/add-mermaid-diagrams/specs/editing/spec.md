# Spec Delta

## MODIFIED Requirements

### Requirement: The open page is edited in place

Opening a page SHALL put its content in an editable Markdown surface, not a
read-only preview. The document SHALL be the page's Markdown itself: what an
edit changes, and what the file receives, is the Markdown, character for
character. Markdown constructs the surface renders in place — inline formatting,
images, tables, diagrams, reference styling — SHALL be presentational only: they
SHALL NOT change the text, and putting the caret in one SHALL show its source.
Standard constructs — headings, paragraphs, emphasis, lists, links, code,
blockquotes, tables — SHALL be editable as Markdown. Editing SHALL NOT reformat
text the user did not touch: whitespace, marker style, and line breaks SHALL be
preserved as typed, except for the terminal empty line, which is normalized so
the page always ends with one.

#### Scenario: A page opens editable

- **WHEN** the user opens a page
- **THEN** its content appears as editable Markdown text

#### Scenario: The surface is the file

- **GIVEN** a page holding constructs the surface renders in place
- **WHEN** the user edits the page, the save completes, and the page is reopened
- **THEN** the Markdown written to the file is the Markdown the surface held,
  with every construct's characters intact

#### Scenario: Untouched formatting is not rewritten

- **GIVEN** a page using `_emphasis_`, setext headings, or `*` list markers
- **WHEN** the user edits an unrelated paragraph and saves
- **THEN** those constructs are written back exactly as they were

#### Scenario: A diagram is presentational

- **GIVEN** a page holding a mermaid fence shown as a diagram
- **WHEN** the user edits elsewhere and saves
- **THEN** the fence is written back character for character
