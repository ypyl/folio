# static-navigation Specification

## MODIFIED Requirements

### Requirement: Open page renders title and content
When a page is open, the editor pane SHALL show the page's title (its filename stem) as a heading and its body in an editable WYSIWYG Markdown surface: ATX headings, paragraphs, and page references in Folio's two forms — `#word` and `#[[Page]]` — appear as plain editable text, not as chips. References SHALL NOT navigate or respond to clicks. Plain `[[Page]]` wikilinks are not a reference form and SHALL render as literal editable text.

#### Scenario: Page renders title and markdown body
- **WHEN** a page is open in the editor pane
- **THEN** the pane shows the page title as a heading and an editable WYSIWYG body containing the page's Markdown

#### Scenario: Reference chips are inert
- **WHEN** the open page's body contains `#word` or `#[[Page]]`
- **THEN** it appears as plain editable text that neither navigates nor responds to clicks, and no chip is rendered

#### Scenario: Plain wikilink renders as text
- **WHEN** the open page's body contains a plain `[[Page]]` wikilink
- **THEN** it appears as literal text, not as a chip