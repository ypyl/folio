## MODIFIED Requirements

### Requirement: The Contents section lists the open page's headings

The right meta panel SHALL contain a Contents section, above the Links section. When a page is open the section SHALL list one row per heading in the page's content, in document order, labelled with the heading's text with inline formatting (emphasis, code, links) reduced to its plain text. Each row SHALL be indented one step further for each heading level below the top level, so the list shows the page's heading hierarchy. Only headings SHALL be listed: a list item, a paragraph, or any other block SHALL never produce a row (ADR-0027). The section SHALL be open by default, and it SHALL size to its content up to a maximum height, scrolling within itself when the list is longer; the panel's Links section SHALL keep taking the remaining height. Two headings with the same text SHALL be two rows.

#### Scenario: Headings are listed in document order, indented by level

- **GIVEN** an open page whose content has an `# Alpha`, a `## Beta`, and a `### Gamma` in that order
- **WHEN** the user looks at the Contents section
- **THEN** it lists `Alpha`, `Beta`, and `Gamma` in that order, with `Beta` indented one step below `Alpha` and `Gamma` one step below `Beta`

#### Scenario: List items are never listed

- **GIVEN** an open page whose content has headings and a nested list
- **WHEN** the user looks at the Contents section
- **THEN** each heading has a row and no list item has one

#### Scenario: A heading's label is its plain text

- **GIVEN** an open page whose `##` heading contains bold text and an inline code span
- **WHEN** the user looks at the Contents section
- **THEN** the row's label is the heading's text with the formatting and code markers removed

#### Scenario: A long list scrolls inside the section

- **GIVEN** an open page with more headings than the panel can show
- **WHEN** the user scrolls the Contents list to its end
- **THEN** only the Contents body scrolls, the panel itself does not scroll, and the other section summaries stay where they were
