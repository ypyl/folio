## Purpose

The right meta panel's Contents section: the open page's headings, shown as an indented list so a reader can see the page's shape and move to a section, derived from saved content and never written to the vault.

## ADDED Requirements

### Requirement: The Contents section lists the open page's headings

The right meta panel SHALL contain a Contents section, above the Backlinks section. When a page is open the section SHALL list one row per heading in the page's content, in document order, labelled with the heading's text with inline formatting (emphasis, code, links) reduced to its plain text. Each row SHALL be indented one step further for each heading level below the top level, so the list shows the page's heading hierarchy. Only headings SHALL be listed: a list item, a paragraph, or any other block SHALL never produce a row (ADR-0027). The section SHALL be open by default, and it SHALL size to its content up to a maximum height, scrolling within itself when the list is longer; the panel's link sections SHALL keep sharing the remaining height. Two headings with the same text SHALL be two rows.

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

### Requirement: Contents shows a state for every surface

The Contents section SHALL show a state for every app surface, so it is never blank or misleading. While no page is open (the brand empty state, a search-results surface, or an open board) it SHALL show placeholder copy rather than rows, except that while a board is open the section SHALL be absent because the panel shows the board's Referenced by section instead (the whiteboards capability). When a page is open but carries no heading it SHALL show empty-state copy rather than placeholder copy. While the active folder's index builds it SHALL show the shell's loading placeholder.

#### Scenario: A page with no headings shows empty copy

- **GIVEN** an open page whose content has no heading
- **WHEN** the user looks at the Contents section
- **THEN** it shows empty-state copy and no rows

#### Scenario: No page open shows placeholder copy

- **GIVEN** no page is open and no board is open
- **WHEN** the user looks at the Contents section
- **THEN** it shows placeholder copy and no rows

#### Scenario: A board shows no Contents section

- **GIVEN** a board is open
- **WHEN** the user looks at the meta panel
- **THEN** the panel shows the board's Referenced by section and no Contents section

#### Scenario: Indexing shows a loading placeholder

- **GIVEN** the active folder's index is building
- **WHEN** the user looks at the Contents section
- **THEN** it shows the shell's loading placeholder rather than rows or copy

### Requirement: Activating a Contents entry locates its heading

Activating a Contents row SHALL locate its heading by scrolling the heading's top-level block into view and marking it with the editor's existing block-locate highlight, exactly as opening a search result locates a match. Locating SHALL be a view operation: it SHALL NOT change the page's Markdown or its file, SHALL NOT move the caret or change the text selection, SHALL NOT create an undoable edit, SHALL NOT be written to the vault, and SHALL NOT add an entry to the page history trail or change which page is open. A row whose heading is no longer in the document SHALL do nothing.

#### Scenario: Activating a row scrolls to its heading

- **GIVEN** an open page with a heading far down the document
- **WHEN** the user activates that heading's row
- **THEN** the heading's block is scrolled into view and carries the locate highlight

#### Scenario: Locating changes nothing

- **GIVEN** an open page being viewed with a Contents row activated
- **WHEN** the user inspects the page
- **THEN** the page's Markdown, its file, and its save state are unchanged, the caret has not moved, and the history trail has gained no entry

### Requirement: Contents is derived from saved content and costs nothing per keystroke

The Contents rows SHALL be derived from the open page's saved content, rebuilt only when that content changes, and never on a keystroke. Deriving and displaying the section SHALL read no vault file and SHALL NOT change the editor's per-keystroke work. A heading the user has just typed SHALL appear once the page's content is saved; the section SHALL NOT reflect the unsaved draft.

#### Scenario: A new heading appears after the page saves

- **GIVEN** an open page with a Contents section showing its headings
- **WHEN** the user adds a new heading and the page is saved
- **THEN** a row for the new heading appears in the Contents section

#### Scenario: Typing does not rebuild the section

- **GIVEN** an open page with a Contents section
- **WHEN** the user types in the page
- **THEN** the Contents rows are not rebuilt on the keystroke, and the editor's per-keystroke work is unchanged
