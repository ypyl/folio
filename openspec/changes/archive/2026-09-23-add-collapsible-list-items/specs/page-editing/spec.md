## ADDED Requirements

### Requirement: A list item with children can be folded

An open page's editor SHALL offer a fold control beside every list item that holds nested content — a nested list, or any block after the item's first block. Activating the control SHALL fold the item, hiding its nested content in the editor; activating it again SHALL expand the item. A list item whose only content is its own first block SHALL show no control. Folding SHALL change only what the editor draws and SHALL NOT change the page: the serialized Markdown and the file SHALL keep every line of a folded item, and a fold alone SHALL NOT mark the page edited or cause a write. The control SHALL sit beside the item's native marker, which SHALL keep being drawn by the browser as it is today (ADR-0020). Fold state SHALL be scoped to the open page and the current session: opening another page or reloading the app SHALL show every item expanded, and no fold state SHALL be written to the vault — no `.folio/` entry and no Markdown property.

#### Scenario: A folded item hides its nested content

- **GIVEN** an open page holding a list item with nested items
- **WHEN** the user activates that item's fold control
- **THEN** the nested items disappear from view, the item's own text stays visible, and the control now offers to expand

#### Scenario: Expanding restores the nested content

- **GIVEN** a folded list item
- **WHEN** the user activates its control again
- **THEN** the nested items are visible again and the item reads exactly as it did before the fold

#### Scenario: The file keeps a folded item's lines

- **GIVEN** an open page with a folded list item and no other edits
- **WHEN** the page is saved or left untouched
- **THEN** the Markdown and the file hold the item's nested lines exactly as they were, and the fold alone neither marks the page dirty nor writes it

#### Scenario: A leaf item has no control

- **GIVEN** a list whose items hold no nested content
- **WHEN** the page renders
- **THEN** no item shows a fold control

#### Scenario: Folds do not survive leaving the page

- **GIVEN** an open page with a folded list item
- **WHEN** the user opens another page and returns, or reloads the app
- **THEN** every item is expanded

#### Scenario: The vault gains no fold state

- **GIVEN** a page whose list items were folded and expanded
- **WHEN** the vault is inspected
- **THEN** no `.folio/` entry and no Markdown property records a fold, and the page's bytes carry only the user's own edits

### Requirement: A folded item's hidden content cannot be edited

While an item is folded, its hidden nested content SHALL NOT take the caret or a selection. A caret or selection that would land inside the hidden content SHALL instead be placed in the item's visible text, so typing always lands in visible text and never silently edits content the user cannot see. Folding an item whose nested content holds the caret SHALL move the caret to that item's visible text. The hidden content SHALL remain part of the document, so expanding restores it exactly. Activating a fold control SHALL NOT take the caret out of the document.

#### Scenario: Folding moves the caret out of the nested content

- **GIVEN** a list item with the caret inside its nested items
- **WHEN** the user folds the item
- **THEN** the caret is placed in the item's own visible text and the nested content is unchanged

#### Scenario: The caret cannot move into hidden content

- **GIVEN** a folded list item with the caret in its visible text
- **WHEN** the user presses an arrow key that would move the caret toward the hidden nested items
- **THEN** the caret stays in visible text rather than entering the hidden content

#### Scenario: A keyboard fold control does not disturb the caret

- **GIVEN** a folded list item with the caret in its visible text
- **WHEN** the user activates the item's fold control
- **THEN** the caret stays in the document at the same visible position

### Requirement: Folding re-glues the line-number gutter

When a fold or an expand changes the rendered height of the document without changing its text, the line-number gutter SHALL re-measure and keep every number aligned with its block's first line, exactly as it does for a reflow. A fold SHALL NOT change which lines are numbered: numbers SHALL remain the page's canonical Markdown line numbers.

#### Scenario: Blocks below a folded item keep their numbers

- **GIVEN** an open page whose blocks below a list item show line numbers in the gutter
- **WHEN** the item is folded so the blocks below move up the pane
- **THEN** every block below the folded item keeps its own number, aligned with its first line

#### Scenario: A fold does not renumber

- **GIVEN** an open page with a folded list item
- **WHEN** the fold hides nested lines and later expands them
- **THEN** the numbers shown are the page's canonical Markdown line numbers in both states

### Requirement: Folding work stays bounded by the edited list

A keystroke SHALL NOT pay for folding beyond the list it edits. The fold state SHALL be carried forward across a document change, and a list's fold controls SHALL be rebuilt only when that change alters the list's structure; a text keystroke inside a list SHALL leave the list's fold-control elements in place. Toggling one item SHALL recompute only the tree it belongs to. A page with no folded items SHALL add no document pass beyond checking that its folded set is empty.

#### Scenario: Typing in a list leaves its fold controls in place

- **GIVEN** an open page holding a long list whose items show fold controls
- **WHEN** the user types a character in one item's text
- **THEN** the fold controls are not recreated, the item's text is the only thing that changes, and the work does not grow with the page's other blocks

#### Scenario: Toggling one item recomputes only its tree

- **GIVEN** an open page with two separate nested lists
- **WHEN** the user folds one item in the first list
- **THEN** the second list's controls are untouched, and the visible state of the second list is unchanged
