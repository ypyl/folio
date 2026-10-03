# Spec Delta

## ADDED Requirements

### Requirement: A markdown link reads as its text at rest

A markdown link in a page's text SHALL display as its own link text while the selection is outside the construct: the opening `[`, the closing `]`, and the destination with any title SHALL NOT be shown, so `[Example](https://example.com)` reads as `Example` in the app's link style, which is brand ink with no underline, the one link behavior DESIGN.md defines. An autolink (`<https://example.com>`) SHALL display without its angle brackets on the same rule.

When the selection touches the link, the whole construct SHALL be shown again, so it is edited as Markdown; moving the selection away SHALL render it as its text again. Hiding SHALL be presentational: the document SHALL keep every character, a save SHALL write the construct as it was, and the link's destination SHALL remain what activating the link opens, whether it is hidden or shown.

A link whose link text is empty SHALL show its source, because hiding its marks would leave nothing visible to click or to find. A link inside an inline code span or a fenced code block SHALL keep its characters verbatim, as every other construct does in literal text.

#### Scenario: A link reads as its text

- **GIVEN** a page whose text contains `[Example](https://example.com)`, with the caret elsewhere
- **WHEN** the page renders
- **THEN** it shows `Example` in the app's link style, and neither the brackets nor the destination are shown

#### Scenario: The whole construct comes back for editing

- **GIVEN** a rendered link
- **WHEN** the user puts the caret inside it, or selects across it
- **THEN** the whole construct is shown as `[Example](https://example.com)`, and it is editable as Markdown

#### Scenario: Moving away renders it again

- **GIVEN** a link showing its construct
- **WHEN** the user moves the caret out of it
- **THEN** it displays as its text again, with no character of the construct lost

#### Scenario: The file keeps the construct

- **GIVEN** a page whose text contains a markdown link
- **WHEN** the user edits an unrelated part of the page and the save completes
- **THEN** the saved Markdown still holds that link's brackets and destination exactly as they were

#### Scenario: The hidden destination is still what opens

- **GIVEN** a rendered link whose destination is hidden
- **WHEN** the user Ctrl+Clicks its text
- **THEN** the destination opens, exactly as it would if the construct were shown

#### Scenario: An autolink reads without its brackets

- **GIVEN** a page whose text contains `<https://example.com>`, with the caret elsewhere
- **WHEN** the page renders
- **THEN** it shows the URL without the angle brackets, and shows them again when the caret enters it

#### Scenario: An empty link keeps its source

- **GIVEN** a page whose text contains a link with no link text
- **WHEN** the page renders
- **THEN** the construct is shown as written, so there is something visible to click

#### Scenario: A link in code stays literal

- **GIVEN** a page containing a markdown link inside an inline code span and inside a fenced block
- **WHEN** the page renders
- **THEN** both show their characters verbatim, with nothing hidden and no link styling
