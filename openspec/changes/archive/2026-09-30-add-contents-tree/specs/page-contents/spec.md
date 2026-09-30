## MODIFIED Requirements

### Requirement: The Contents section lists the open page's headings

The right meta panel SHALL contain a Contents section, above the Links section. When a page is open the section SHALL list one row per heading in the page's content, in document order, labelled with the heading's text with inline formatting (emphasis, code, links) reduced to its plain text. The rows SHALL form a tree: a heading SHALL be a child of the nearest preceding heading with a lower level, and the headings deeper than it and before the next heading at its level or lower SHALL be its subtree. Each row SHALL be indented one step further for each heading level below the top level, so the tree shows the page's heading hierarchy. Only headings SHALL be listed: a list item, a paragraph, or any other block SHALL never produce a row (ADR-0027). Every heading whose subtree is not empty SHALL carry a disclosure control; a heading with no subtree SHALL carry none. Activating a heading's disclosure control SHALL collapse its subtree — hiding its descendants' rows — or expand it again, and SHALL NOT locate the heading. Activating a heading's label SHALL locate the heading. The section SHALL be open by default, and it SHALL size to its content up to a maximum height, scrolling within itself when the list is longer; the panel's Links section SHALL keep taking the remaining height while it is open, and when the Links section is collapsed the Contents section SHALL take the height Links gave up, still scrolling within itself when the list is longer than that. Two headings with the same text SHALL be two rows.

#### Scenario: Headings are listed in document order, indented by level

- **GIVEN** an open page whose content has an `# Alpha`, a `## Beta`, and a `### Gamma` in that order
- **WHEN** the user looks at the Contents section
- **THEN** it lists `Alpha`, `Beta`, and `Gamma` in that order, with `Beta` indented one step below `Alpha` and `Gamma` one step below `Beta`

#### Scenario: Headings nest under the nearest shallower heading

- **GIVEN** an open page whose content has an `# Alpha`, a `## Beta`, a `### Gamma`, and a `# Delta` in that order
- **WHEN** the user looks at the Contents section
- **THEN** `Beta` and `Gamma` are in `Alpha`'s subtree and `Delta` is not

#### Scenario: List items are never listed

- **GIVEN** an open page whose content has headings and a nested list
- **WHEN** the user looks at the Contents section
- **THEN** each heading has a row and no list item has one

#### Scenario: A heading's label is its plain text

- **GIVEN** an open page whose `##` heading contains bold text and an inline code span
- **WHEN** the user looks at the Contents section
- **THEN** the row's label is the heading's text with the formatting and code markers removed

#### Scenario: Only a heading with a subtree carries a disclosure control

- **GIVEN** an open page whose content has an `# Alpha` with a `## Beta` under it, then a `# Gamma` with no heading under it
- **WHEN** the user looks at the Contents section
- **THEN** `Alpha` carries a disclosure control and `Gamma` carries none

#### Scenario: A heading's subtree collapses and expands

- **GIVEN** an open page whose `# Alpha` has a `## Beta` under it
- **WHEN** the user activates the disclosure control on `Alpha`
- **THEN** `Beta`'s row is hidden and `Alpha`'s control reports the collapsed state; activating the control again shows `Beta`'s row

#### Scenario: A long list scrolls inside the section

- **GIVEN** an open page with more headings than the panel can show
- **WHEN** the user scrolls the Contents list to its end
- **THEN** only the Contents body scrolls, the panel itself does not scroll, and the other section summaries stay where they were

#### Scenario: Contents takes the space Links gives up

- **GIVEN** an open page with the Links section collapsed
- **WHEN** the user looks at the Contents section
- **THEN** it fills the panel's space above the collapsed Links summary and scrolls within itself when its list is longer than that

### Requirement: Contents is derived from saved content and costs nothing per keystroke

The Contents rows SHALL be derived from the open page's saved content, rebuilt only when that content changes, and never on a keystroke. The tree SHALL be built from those rows and rebuilt only when they change; collapsing or expanding a subtree SHALL only change which already-built rows are shown and SHALL do no derivation and no vault read. Deriving and displaying the section SHALL read no vault file and SHALL NOT change the editor's per-keystroke work. A heading the user has just typed SHALL appear once the page's content is saved; the section SHALL NOT reflect the unsaved draft.

#### Scenario: A new heading appears after the page saves

- **GIVEN** an open page with a Contents section showing its headings
- **WHEN** the user adds a new heading and the page is saved
- **THEN** a row for the new heading appears in the Contents section

#### Scenario: Typing does not rebuild the section

- **GIVEN** an open page with a Contents section
- **WHEN** the user types in the page
- **THEN** the Contents rows are not rebuilt on the keystroke, and the editor's per-keystroke work is unchanged

## ADDED Requirements

### Requirement: Collapsing a heading's subtree is a view operation

Collapsing or expanding a heading's subtree SHALL be a view operation on the open page: it SHALL NOT change the page's Markdown or its file, SHALL NOT create an undoable edit, SHALL NOT move the caret or change the selection, SHALL NOT add an entry to the page history trail, and SHALL NOT be written to the vault or to `.folio/`. Collapse state SHALL be session-scoped and per open page: opening another page, returning to a page, or reloading the app SHALL show every heading expanded, and no collapse state SHALL persist.

#### Scenario: Collapsing changes nothing but what is shown

- **GIVEN** an open page with a heading whose subtree is collapsed
- **WHEN** the user inspects the page
- **THEN** the page's Markdown, its file, its save state, the caret, and the history trail are unchanged, and no `.folio/` entry was written

#### Scenario: Opening another page shows every heading expanded

- **GIVEN** a heading collapsed on the open page
- **WHEN** the user opens another page and then returns to the first
- **THEN** every heading on the first page is expanded
