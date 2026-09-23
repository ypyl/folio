## REMOVED Requirements

### Requirement: The editor shows block line numbers

**Reason**: The numbers existed so that a search result's `· line N` could be found in the gutter when the page opened, but opening a result never took the reader there. Search now marks the matched block on the page directly, so the numbers are unused noise, and their rail, padding, and per-block measurement all go with them.

**Migration**: A page opened to a search match is scrolled to and marked by "The editor locates and marks a block". The rail that held the numbers keeps the fold controls only.

### Requirement: Folding re-glues the line-number gutter

**Reason**: The rail no longer holds line numbers, so there is no line-number gutter for a fold to re-glue.

**Migration**: Replaced by "Folding re-glues the rail", which keeps the fold controls aligned after a fold.

## ADDED Requirements

### Requirement: Folding re-glues the rail

When a fold or an expand changes the rendered height of the document without changing its text, the rail SHALL re-measure and keep every fold control aligned with its item's first line, exactly as it does for a reflow. A fold SHALL NOT change any control's state, and the rail SHALL hold fold controls only.

#### Scenario: Controls re-glue with their items

- **GIVEN** an open page with a fold control on a list item
- **WHEN** a fold above it moves the item up the pane
- **THEN** the control is still aligned with that item's first line

#### Scenario: A fold keeps every control's state

- **GIVEN** an open page with two fold controls, one folded
- **WHEN** a fold or expand changes the document's height
- **THEN** each control still shows the state of the item it belongs to

### Requirement: The editor locates and marks a block

When the app opens a page to a specific block — today, opening a search result — the editor SHALL scroll that top-level block into view and mark it with a highlight visually distinct from the prose that SHALL NOT move or reflow the page's text. The mark SHALL be presentational: it SHALL NOT enter the page's Markdown, SHALL NOT change the serialized content or the file, and SHALL NOT be written. It SHALL fade after a short time (about two seconds) and SHALL be cleared at once by the next document change or by a later location request. A request that names no block, or a page opened without one, SHALL be left unmarked. Locating SHALL be a view operation: it SHALL NOT create an undoable document edit.

#### Scenario: A requested block is scrolled to and marked

- **GIVEN** a page with several blocks, opened to one of its later blocks
- **WHEN** the page renders
- **THEN** that block is scrolled into view and carries a visible mark

#### Scenario: The mark fades

- **GIVEN** a page opened to a marked block
- **WHEN** the mark's short time passes with no further action
- **THEN** the mark is gone and the page's text is unchanged

#### Scenario: An edit clears the mark

- **GIVEN** a page with a marked block
- **WHEN** the user types anywhere in the page
- **THEN** the mark is cleared immediately

#### Scenario: A later request replaces the mark

- **GIVEN** a page with a marked block
- **WHEN** the app asks to locate a different block
- **THEN** only the new block is marked

#### Scenario: The mark never reaches the file

- **GIVEN** a page opened to a marked block
- **WHEN** the page is saved or left untouched
- **THEN** the Markdown and the file hold no character representing the mark, and the mark alone neither marks the page dirty nor writes it

## MODIFIED Requirements

### Requirement: Folding work stays bounded by the edited list

A keystroke SHALL NOT pay for folding. The fold state SHALL be carried forward across a document change, and a list's fold state SHALL change only for the tree a toggle touches. The rail's fold controls SHALL be drawn by the rail's single measure-then-write update, which runs on the debounced markdown change stream, on a fold, and on a reflow — never synchronously on a keystroke, so typing pays nothing for folding and a keystroke's cost does not grow with the number of foldable items. That rail update's cost SHALL grow with the number of foldable items in one pass, not with its square.

#### Scenario: Typing in a list leaves its fold controls in place

- **GIVEN** an open page holding a long list whose items show fold controls
- **WHEN** the user types a character in one item's text
- **THEN** the fold state is unchanged, no fold work runs on the keystroke, the item's text is the only thing that changes, and the rail redraws its controls in its next debounced update rather than on the keystroke

#### Scenario: Toggling one item recomputes only its tree

- **GIVEN** an open page with two separate nested lists
- **WHEN** the user folds one item in the first list
- **THEN** the fold state change is scoped to the first list's tree, and the second list's visible state is unchanged
