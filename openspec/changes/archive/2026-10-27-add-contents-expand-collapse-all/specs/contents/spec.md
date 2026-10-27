# Spec Delta

## ADDED Requirements

### Requirement: Contents offers Expand all and Collapse all controls

While the open page has headings, the Contents section SHALL offer an Expand all
control and a Collapse all control. It SHALL offer neither control for a page
with no heading, while no page is open, or while the loading placeholder shows,
because there is nothing for them to act on.

#### Scenario: Controls appear with the rows

- **GIVEN** an open page with headings
- **WHEN** the user looks at the Contents section
- **THEN** it offers both an Expand all and a Collapse all control

#### Scenario: No headings offer no controls

- **GIVEN** an open page with no heading
- **WHEN** the user looks at the Contents section
- **THEN** it shows its empty-state copy and neither control

### Requirement: Expand all and Collapse all set every subtree

Expand all SHALL show every heading. Collapse all SHALL hide every heading that
sits below another heading, leaving only the headings with no shallower heading
above them. Either control SHALL leave each row's disclosure control reporting
the state that row now has, and SHALL leave one subtree's own toggle working
afterwards.

#### Scenario: Expand all shows every heading

- **GIVEN** an open page whose headings are partly collapsed
- **WHEN** the user activates Expand all
- **THEN** every heading has a row and every disclosure control reports expanded

#### Scenario: Collapse all leaves only the top-level headings

- **GIVEN** an open page with a top-level heading that has subheadings and
  another top-level heading
- **WHEN** the user activates Collapse all
- **THEN** only the two top-level rows remain, each disclosure control reporting
  collapsed

### Requirement: Expand all and Collapse all change only what is shown

Both controls SHALL be view operations, on the terms a single subtree toggle
already keeps: neither SHALL change the page's text or file, create an undoable
edit, move the caret or the selection, add a history entry, locate a heading,
scroll the editor, or write anything to the vault.

#### Scenario: Collapsing all changes nothing but what is shown

- **GIVEN** an open page with headings
- **WHEN** the user activates Collapse all
- **THEN** the page's text, file, save state, caret, and history trail are
  unchanged, nothing was written to the vault, and the editor did not scroll
