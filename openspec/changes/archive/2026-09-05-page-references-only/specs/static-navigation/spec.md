## MODIFIED Requirements

### Requirement: Open page renders title and content
When a page is open, the editor pane SHALL show the page's title as a heading and its body rendered from Markdown: ATX headings, paragraphs, and page references in Folio's two forms — `#word` and `#[[Page]]` — shown as inert reference chips. Chips SHALL NOT navigate or respond to clicks. Plain `[[Page]]` wikilinks are not a reference form and SHALL render as literal text, not as chips.

#### Scenario: Page renders title and markdown body
- **WHEN** a page is open in the editor pane
- **THEN** the pane shows the page title as a heading and the body with headings, paragraphs, and reference chips

#### Scenario: Reference chips are inert
- **WHEN** the user clicks a `#word` or `#[[Page]]` reference chip in the rendered content
- **THEN** nothing happens: no navigation occurs and the open page is unchanged

#### Scenario: Plain wikilink renders as text
- **WHEN** the rendered content contains a plain `[[Page]]` wikilink
- **THEN** it appears as literal text, not as a reference chip