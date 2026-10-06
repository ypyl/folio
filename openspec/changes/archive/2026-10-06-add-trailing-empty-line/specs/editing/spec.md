# Spec Delta

## MODIFIED Requirements

### Requirement: The open page is edited in place

Opening a page SHALL put its content in an editable Markdown surface, not a
read-only preview. The document SHALL be the page's Markdown itself: what an
edit changes, and what the file receives, is the Markdown, character for
character. Markdown constructs the surface renders in place — inline formatting,
images, tables, reference styling — SHALL be presentational only: they SHALL NOT
change the text, and putting the caret in one SHALL show its source. Standard
constructs — headings, paragraphs, emphasis, lists, links, code, blockquotes,
tables — SHALL be editable as Markdown. Editing SHALL NOT reformat text the user
did not touch: whitespace, marker style, and line breaks SHALL be preserved as
typed, except for the terminal empty line, which is normalized so the page
always ends with one.

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

## ADDED Requirements

### Requirement: A page or journal ends with an empty line

An open page or journal SHALL end with exactly one empty line, and every page or
journal file the app writes SHALL end the same way. The document SHALL be
normalized when it opens, so a file whose last content line has no empty line
after it shows one, and a file with several trailing blank lines shows one. A
page with no content SHALL be a single empty line. The normalization SHALL
change nothing above the terminal empty line: every character the user typed
SHALL be preserved. Opening a file SHALL NOT write to it, so a file the user
never edits keeps its bytes and gains the empty line on its next save. A save
whose document already ends with exactly one empty line SHALL NOT rewrite the
file for that reason alone.

#### Scenario: A file without a trailing empty line opens with one

- **GIVEN** a page whose file ends with its last content line and no newline
- **WHEN** the page opens
- **THEN** the editor shows an empty line after that content line

#### Scenario: Opening does not write the file

- **GIVEN** a page whose file ends without a trailing empty line
- **WHEN** the page opens and the user makes no edit
- **THEN** the file is unchanged

#### Scenario: A save writes exactly one trailing empty line

- **GIVEN** an open page ending in its last content line
- **WHEN** the user edits and the save completes
- **THEN** the file ends with exactly one empty line after the last content line

#### Scenario: Several trailing blank lines collapse to one

- **GIVEN** a page whose file ends with more than one blank line
- **WHEN** the page is edited and saved
- **THEN** the file ends with exactly one empty line

#### Scenario: An empty page is one empty line

- **GIVEN** a page with no content
- **WHEN** the page is saved
- **THEN** the file holds a single empty line

#### Scenario: The content above the terminal line is untouched

- **GIVEN** a page whose content has no trailing newline
- **WHEN** the page opens and is saved without editing that content
- **THEN** every character above the terminal empty line is written back exactly
  as it was
