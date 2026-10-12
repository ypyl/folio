# Spec Delta

## MODIFIED Requirements

### Requirement: References and markup render in place

In the editor, a reference in either form SHALL render as a visible badge over
its literal text, keeping its Markdown source visible and editable; the badge
SHALL look the same whether or not its block is being edited, and moving the
caret SHALL NOT repaint it. No badge SHALL render inside code. Plain `[[Page]]`
wikilinks SHALL stay literal text. Inline formatting — bold, italic,
strikethrough, inline code — and markdown links SHALL render as their formatted
result while the selection is outside them, and SHALL show their markers again
when the selection touches them, so each is edited as Markdown. A hidden marker
SHALL be stepped over rather than landed inside. The document SHALL keep every
character, and a save SHALL write each construct exactly as it was. A markdown
link SHALL display as its own text while the selection is outside it; `Example`
for `[Example](https://example.com)`, and an autolink without its angle
brackets. A link whose text is empty SHALL show its source, and a rendered
link's hidden destination SHALL remain what Ctrl+Click opens. Inside code,
characters SHALL stay literal. A fenced code block SHALL render as a full-width
panel: each of the block's lines SHALL carry the panel's fill across the whole
line, with the block's first and last lines padded and its ends rounded, so the
block reads apart from the prose. The panel's fill SHALL be the app's code
surface — the same fill inline code carries — so the block reads as one surface
and no narrower background shows behind its text. The fence lines SHALL stay
visible and editable, the panel SHALL carry no border, and the rendering SHALL
remain presentational — the document keeps every character.

#### Scenario: A reference renders as a badge

- **WHEN** the editor body contains `#Inbox` or `#[[reading list]]`
- **THEN** the token renders as a badge over its literal text

#### Scenario: Badges do not follow the caret

- **WHEN** the user places the caret in the block containing a reference
- **THEN** the reference still renders as a badge and the text does not repaint

#### Scenario: Code is never badged or formatted

- **WHEN** the editor body contains `#word`, `**bold**`, or a link inside inline
  code or a fenced code block
- **THEN** the characters stay literal, with no badge, no formatting, and no
  hidden markers

#### Scenario: Formatted runs read at rest

- **GIVEN** a paragraph containing `**bold**`, `*italic*`, and `~~struck~~`
- **WHEN** the page renders
- **THEN** the words read as bold, italic, and struck, with no markers shown

#### Scenario: The markers come back for editing

- **GIVEN** a rendered bold run
- **WHEN** the user puts the caret inside it or selects across it
- **THEN** its markers are shown and it is editable as Markdown

#### Scenario: The file keeps the markers

- **GIVEN** a page whose paragraph holds `**bold**`
- **WHEN** the user edits an unrelated part and saves
- **THEN** the saved Markdown still holds `**bold**`

#### Scenario: A link reads as its text

- **GIVEN** a page whose text contains `[Example](https://example.com)`
- **WHEN** the page renders
- **THEN** it shows `Example` in the app's link style, and the construct returns
  when the caret enters it

#### Scenario: The hidden destination is still what opens

- **GIVEN** a rendered link whose destination is hidden
- **WHEN** the user Ctrl+Clicks its text
- **THEN** the destination opens

#### Scenario: A fenced block is highlighted source

- **GIVEN** a page whose Markdown contains a fence opened with a language
- **WHEN** the page renders
- **THEN** the block's content is highlighted for that language, the block reads
  as one full-width panel in the app's code surface with padding and rounded
  ends, the fence lines stay visible and editable, and a fence with no language
  renders monochrome

#### Scenario: The panel is presentational

- **GIVEN** a page holding a fenced code block
- **WHEN** the user edits an unrelated part and saves
- **THEN** the saved Markdown still holds the same fence and the block's source
  is unchanged

#### Scenario: A table renders as a table at rest

- **GIVEN** a page holding a pipe table, with the caret off it
- **WHEN** the page renders
- **THEN** it shows a bordered table with a header row and body rows, with each
  column aligned as the delimiter row asks and cell markup and references
  rendered; putting the caret on it shows its source again

#### Scenario: The file keeps a pipe table

- **GIVEN** a rendered table
- **WHEN** the page is saved and reopened
- **THEN** the saved Markdown is still the same pipe table
