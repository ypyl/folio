# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: A presentation is entered and left explicitly and changes nothing
**Reason**: Presenting is disabled for now: the page row's Present entry is off, because a deck derived from the page's Markdown is rendered by the reading view, and that rendering is not yet at parity with the page itself, so entering one would show a worse copy of it. The rest of the capability, its view, and its requirements stay as its specification for when Presenting returns.
**Migration**: None. Nothing was written, and no page changes.
