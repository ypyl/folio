# Contents

## Purpose

The right panel's Contents section: the open page's headings, shown as an
indented tree so a reader can see the page's shape, collapse or expand a
subtree, and move to a section, without changing the page.

## Requirements

### Requirement: The Contents section lists the open page's headings

The right panel SHALL contain a Contents section, above the Links section. When
a page is open, the section SHALL list one row per heading in the page's
content, in document order, labelled with the heading's text with inline
formatting reduced to plain text. The rows SHALL form a tree: a heading SHALL be
a child of the nearest preceding heading with a lower level, and each row SHALL
be indented one step further for each level below the top, so the tree shows the
page's heading hierarchy. Only headings SHALL produce rows; a list item, a
paragraph, or any other block SHALL never produce one. A heading whose subtree
is not empty SHALL carry a disclosure control; a heading with no subtree SHALL
carry none. Activating a disclosure control SHALL collapse or expand the
subtree without locating the heading; activating the heading's label SHALL
locate it. Two headings with the same text SHALL be two rows.

#### Scenario: Headings are listed in document order, indented by level

- **GIVEN** an open page with an Alpha, a Beta, and a Gamma heading in that order
- **WHEN** the user looks at the Contents section
- **THEN** it lists Alpha, Beta, and Gamma in that order, indented by level

#### Scenario: Headings nest under the nearest shallower heading

- **GIVEN** an open page with an Alpha heading, a Beta and a Gamma under it, then
  a Delta heading
- **WHEN** the user looks at the Contents section
- **THEN** Beta and Gamma are in Alpha's subtree and Delta is not

#### Scenario: Only headings are listed

- **GIVEN** an open page with headings and a nested list
- **WHEN** the user looks at the Contents section
- **THEN** each heading has a row and no list item has one

#### Scenario: A heading's label is its plain text

- **GIVEN** an open page whose heading contains bold text and an inline code span
- **WHEN** the user looks at the Contents section
- **THEN** the row's label is the heading's text with the formatting removed

#### Scenario: Only a heading with a subtree carries a disclosure control

- **GIVEN** an open page with a heading that has a subheading, then a heading
  with none
- **WHEN** the user looks at the Contents section
- **THEN** the first carries a disclosure control and the second carries none

#### Scenario: A heading's subtree collapses and expands

- **GIVEN** an open page whose heading has a subheading
- **WHEN** the user activates the disclosure control
- **THEN** the subheading's row is hidden and the control reports the collapsed
  state; activating it again shows the row

#### Scenario: A long list scrolls inside the section

- **GIVEN** an open page with more headings than the panel can show
- **WHEN** the user scrolls the Contents list to its end
- **THEN** only the Contents body scrolls and the panel itself does not

### Requirement: Contents shows a state for every surface

The section SHALL show a state for every surface, so it is never blank or
misleading. While no page is open it SHALL show placeholder copy rather than
rows, except that while a board is open the section SHALL be absent because the
panel shows the board's Referenced by section instead. When a page is open but
carries no heading it SHALL show empty-state copy. While the active folder is
loading it SHALL show the workspace's loading placeholder.

#### Scenario: A page with no headings shows empty copy

- **GIVEN** an open page with no heading
- **WHEN** the user looks at the Contents section
- **THEN** it shows empty-state copy and no rows

#### Scenario: No page open shows placeholder copy

- **GIVEN** no page is open and no board is open
- **WHEN** the user looks at the Contents section
- **THEN** it shows placeholder copy and no rows

#### Scenario: A board shows no Contents section

- **GIVEN** a board is open
- **WHEN** the user looks at the right panel
- **THEN** the panel shows the board's Referenced by section and no Contents
  section

#### Scenario: Loading shows a placeholder

- **GIVEN** the active folder is loading
- **WHEN** the user looks at the Contents section
- **THEN** it shows the loading placeholder rather than rows or copy

### Requirement: Activating a Contents entry locates its heading

Activating a Contents row SHALL locate its heading by scrolling it into view and
marking it with the editor's locate highlight, exactly as opening a search
result locates a match. Locating SHALL be a view operation: it SHALL NOT change
the page's text or file, SHALL NOT move the caret or the selection, SHALL NOT
create an undoable edit, SHALL NOT be written to the vault, and SHALL NOT add an
entry to the page history trail or change which page is open. A row whose
heading is no longer in the document SHALL do nothing.

#### Scenario: Activating a row scrolls to its heading

- **GIVEN** an open page with a heading far down the document
- **WHEN** the user activates that heading's row
- **THEN** the heading is scrolled into view and carries the locate highlight

#### Scenario: Locating changes nothing

- **GIVEN** an open page with a Contents row activated
- **WHEN** the user inspects the page
- **THEN** its text, file, and save state are unchanged, the caret has not
  moved, and the history trail has gained no entry

### Requirement: Contents grows with the page and collapses as a view only

The Contents rows SHALL be derived from the page's saved content and SHALL
reflect a newly typed heading only once the page is saved; the section SHALL NOT
reflect the unsaved draft. Collapsing or expanding a subtree SHALL be a view
operation: it SHALL NOT change the page's text or file, create an undoable edit,
move the caret or the selection, add a history entry, or write anything to the
vault. Collapse state SHALL be per open page and last only for the session:
opening another page, returning to a page, or reloading the app SHALL show every
heading expanded.

#### Scenario: A new heading appears after the page saves

- **GIVEN** an open page with a Contents section showing its headings
- **WHEN** the user adds a heading and the page is saved
- **THEN** a row for the new heading appears

#### Scenario: Collapsing changes nothing but what is shown

- **GIVEN** an open page with a collapsing subtree
- **WHEN** the user inspects the page
- **THEN** its text, file, save state, caret, and history trail are unchanged and
  nothing was written to the vault

#### Scenario: Opening another page shows every heading expanded

- **GIVEN** a heading collapsed on the open page
- **WHEN** the user opens another page and then returns
- **THEN** every heading on the first page is expanded
