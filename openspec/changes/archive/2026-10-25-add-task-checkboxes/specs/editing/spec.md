# Spec Delta

## ADDED Requirements

### Requirement: A task list item renders as a checkbox

A GFM task list item SHALL render its marker as a checkbox: `[ ]` unchecked and
`[x]` or `[X]` checked, in place of the three marker characters. The checkbox
SHALL be the whole control for the marker, and it SHALL stay a checkbox while
the caret is on its line, so a press never swaps the control for its source.
The document SHALL keep every character: the file still holds `[ ]` or `[x]`, a
save writes it unchanged, and a copied page carries the Markdown.

A press on the checkbox SHALL write the opposite marker as one edit, and that
edit SHALL be the only thing a press changes: the caret SHALL NOT move, the
selection SHALL NOT move, and the press SHALL NOT open anything. The edit SHALL
be undoable through the editor's normal history, restoring the previous marker.
A press SHALL NOT navigate: the checkbox is an edit, not a reference.

The checkbox SHALL appear only where the Markdown grammar reads a task list
item: a list item whose content starts with `[ ]`, `[x]`, or `[X]` followed by
whitespace. A marker outside a list item, a marker with no space after it, and
a marker inside a code fence or code span SHALL stay literal text. A task item
in a nested list SHALL render the same way as one at the top level.

#### Scenario: An unchecked item renders an unchecked box

- **GIVEN** a page holding `- [ ] buy milk`
- **WHEN** the user opens it
- **THEN** a checkbox renders unchecked in place of `[ ]`
- **AND** the page's text still holds `- [ ] buy milk`

#### Scenario: A checked item renders a checked box

- **GIVEN** a page holding `- [x] buy milk` or `- [X] buy milk`
- **WHEN** the user opens it
- **THEN** a checkbox renders checked in place of the marker

#### Scenario: A press ticks the item and the save keeps it

- **GIVEN** an open page holding `- [ ] buy milk`
- **WHEN** the user presses the checkbox, the save completes, and the page is
  reopened
- **THEN** the text is `- [x] buy milk` and the box renders checked

#### Scenario: A press does not move the caret

- **GIVEN** an open page with the caret in another paragraph
- **WHEN** the user presses a task's checkbox
- **THEN** the marker is written and the caret stays where it was

#### Scenario: Undo restores the previous marker

- **GIVEN** an item the user has just ticked
- **WHEN** the user undoes
- **THEN** the text is `[ ]` again and the box renders unchecked

#### Scenario: A marker that is not a task stays text

- **GIVEN** a page whose text holds `[ ]` in a paragraph, `- [x]todo` with no
  space after the marker, and `- [ ] inside` inside a fenced code block
- **WHEN** the user opens it
- **THEN** each renders as its literal characters and no checkbox appears

#### Scenario: A nested task renders as a checkbox

- **GIVEN** a page holding a nested list whose inner item starts with `- [ ]`
- **WHEN** the user opens it
- **THEN** the inner item renders a checkbox like a top-level one

#### Scenario: The box stays a control beside the caret

- **GIVEN** an open page holding `- [ ] buy milk`
- **WHEN** the user places the caret at the start of that line, at either end of
  the marker, or inside the item's text
- **THEN** the checkbox is still a checkbox and the marker's characters are not
  shown
