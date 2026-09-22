## ADDED Requirements

### Requirement: An empty list item holding a child block round-trips

When an empty paragraph inside a list item is followed by another block in the same item,
the editor SHALL write a blank line between the two, so the empty line does not start an
HTML block that swallows the block after it. On reading Markdown, the editor SHALL apply
the same normalization before parsing, so a file already written without that blank line
is read back with the child block intact rather than as one inline `html` atom. The
normalization SHALL NOT alter an item whose next line is a sibling item, a blank line, or
anywhere inside a fenced code block.

#### Scenario: A code block under an empty bullet survives a save and open

- **GIVEN** a list item whose text line is empty and which holds a fenced code block
- **WHEN** the page is saved and reopened
- **THEN** the code block is still a code block with its content, not raw `html` text

#### Scenario: A nested list under an empty bullet survives a save and open

- **GIVEN** an empty list item holding a nested list
- **WHEN** the page is saved and reopened
- **THEN** the nested list is still a list

#### Scenario: An already-broken file is read back correctly

- **GIVEN** a file whose empty bullet and following code block were written without a separating blank line
- **WHEN** the page is opened
- **THEN** the code block is a code block again, and saving writes the separating blank line

#### Scenario: Sibling items and blank lines are left alone

- **GIVEN** a list where an empty item's next line is another item at the same indent, or a blank line
- **WHEN** the page is saved
- **THEN** no blank line is inserted and the list is unchanged

### Requirement: Backspace and Delete act on the caret's list item

When the caret is in a list item, Backspace and Delete SHALL act on that item rather than
on the raw document position alone.

- Delete at the start of a list item's first text block SHALL delete the character after
  the caret when one exists. When that block is empty and the item's list is followed by
  a non-empty paragraph, Delete SHALL move that paragraph into the item, filling the
  empty bullet and removing the original paragraph. When neither applies, Delete SHALL
  leave the editor's default behavior.
- Backspace at the start of an empty list item's first text block SHALL remove that empty
  line. The item's remaining children SHALL be promoted to the parent level rather than
  deleted, so a code block or nested list the item holds SHALL survive one level up; the
  empty item SHALL be removed, and its list SHALL be removed with it when it was the
  list's only item. The caret SHALL land at the end of the parent's text, or the nearest
  text position when the parent has none.
- Backspace on a non-empty list item SHALL keep the editor's existing lift behavior.

The gestures SHALL NOT run inside a fenced code block or when a modifier key is held.

#### Scenario: Delete deletes the following character in a non-empty item

- **GIVEN** a list item whose text is not empty with the caret at its start
- **WHEN** the user presses Delete
- **THEN** the character after the caret is deleted and the item stays a list item

#### Scenario: Delete fills an empty bullet from the paragraph below

- **GIVEN** a list whose last item is empty, followed by a non-empty paragraph
- **WHEN** the user presses Delete
- **THEN** the paragraph's content moves into the empty item, the original paragraph is gone, and the list has one fewer empty item

#### Scenario: Backspace removes an empty bullet and keeps its code block

- **GIVEN** a list item whose first block is empty and which also holds a fenced code block
- **WHEN** the user presses Backspace at the start of the empty block
- **THEN** the empty item is removed, the code block is promoted to the parent level, and the caret sits at the end of the parent's text

#### Scenario: Backspace deletes a genuinely empty bullet

- **GIVEN** a list item whose only content is an empty text block
- **WHEN** the user presses Backspace at the start of that block
- **THEN** the item is removed, and the list is removed too when it held no other item

#### Scenario: Backspace still lifts a non-empty item

- **GIVEN** a list item whose text is not empty with the caret at its start
- **WHEN** the user presses Backspace
- **THEN** the item is lifted out of the list, as it was before
