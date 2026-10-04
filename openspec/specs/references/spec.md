# References

## Purpose

Folio's reference model: a reference points at a page, written in exactly one of
two hashtag forms, with no separate tag concept and no other tools' conventions.

## Requirements

### Requirement: A page reference has exactly two forms

A page reference SHALL be written in exactly one of two forms: `#word`, where
`word` is a single word of letters, digits, `_`, or `-`, or `#[[Page name]]`,
where the bracketed content is the page name. Both forms SHALL name the page
whose name is the referenced text.

#### Scenario: Single-word reference

- **WHEN** a note contains `#reading`
- **THEN** it references the page `reading`

#### Scenario: Multi-word reference

- **WHEN** a note contains `#[[reading list]]`
- **THEN** it references the page `reading list`

### Requirement: Tags are not a separate concept

Folio SHALL NOT treat `#word` as a tag or label. It is a reference to the page
`word`, in the same namespace as every other reference. There SHALL be no tags
listing, no tags surface, and no tag-versus-page distinction anywhere in the app.

#### Scenario: A hashtagged word is a page reference

- **WHEN** a note contains `#ideas`
- **THEN** it references the page `ideas`, identical in kind to `#[[ideas]]`

#### Scenario: No tags surface exists

- **WHEN** the user looks across the app
- **THEN** there is no tags section, tags list, or tag-versus-page distinction

### Requirement: Unsupported conventions render as text

Plain `[[Page]]` wikilinks and other tools' conventions, such as `#tag/word`,
SHALL NOT be parsed as references. They SHALL render as literal Markdown text,
not as reference chips, and SHALL NOT contribute to links or navigation.

#### Scenario: A plain wikilink is not a reference

- **WHEN** a note contains `[[Inbox]]`
- **THEN** it renders as literal text and is not a reference

### Requirement: A reference to a page that does not exist yet is valid

A reference SHALL be recognized even when the page it names does not exist in
the vault yet.

#### Scenario: A missing page is still referenced

- **WHEN** a note contains `#[[feature roadmap]]` and no page of that name exists
- **THEN** the reference is still recognized as naming that page

### Requirement: A date-shaped name names a journal day

A reference whose name is a valid calendar date in zero-padded `YYYY-MM-DD` form
SHALL name the journal day for that date, whether or not that day has a file.
Both forms SHALL follow this rule. A name that is not a valid calendar date
SHALL keep the ordinary rule: it names the page whose name matches, or a page
that does not exist yet.

#### Scenario: A date reference targets the journal day with no file yet

- **GIVEN** a vault with no file for a day
- **WHEN** a note contains `#[[2026-09-16]]`
- **THEN** it names the journal day for that date and creates no page for it

#### Scenario: The word form follows the same rule

- **WHEN** a note contains `#2026-09-16`
- **THEN** it names the same journal day as `#[[2026-09-16]]`

#### Scenario: A name that is not a real date is a page

- **WHEN** a note contains `#[[2026-13-45]]` or `#[[2026-9-6]]`
- **THEN** each names an ordinary page, not a journal day

#### Scenario: Links reach a day with no file

- **WHEN** a note referencing a day with no file is saved
- **THEN** that day's backlinks list the note

### Requirement: Completion writes one of the two forms

Completing a reference from the editor's picker SHALL insert exactly one
reference token: `#name` when the picked page's name is a single word, and
`#[[name]]` in every other case, including whenever the user's trigger was
already bracketed. The inserted token SHALL carry the page's name as it exists
and SHALL read back as a reference to that page.

#### Scenario: A single-word name completes in the word form

- **WHEN** the user completes the page `reading` from a `#` trigger
- **THEN** the text is `#reading` and reads back as a reference to `reading`

#### Scenario: A multi-word name completes in the bracketed form

- **WHEN** the user completes the page `reading list` from a `#` trigger
- **THEN** the text is `#[[reading list]]`

#### Scenario: A bracketed trigger stays bracketed

- **WHEN** the user types `#[[read` and completes the page `reading`
- **THEN** the text is `#[[reading]]`

#### Scenario: A name that is not a word completes bracketed

- **WHEN** the user completes a page named `café` or `2.0`
- **THEN** the text is `#[[café]]` or `#[[2.0]]`, never the word form

### Requirement: A page that no reference can name is never offered

A page whose name cannot be written as a reference that reads back to that exact
name SHALL NOT be offered as a completion candidate, and SHALL NOT be draggable
into a page.

#### Scenario: A name with a closing bracket is not offered

- **WHEN** the vault holds a page named `weird]name` and the user starts a
  reference
- **THEN** no row for it appears, because no form can express that name

#### Scenario: A name with surrounding whitespace is not offered

- **WHEN** the vault holds a page whose name has leading or trailing whitespace
- **THEN** it is not offered, because the reference would name a different page

### Requirement: Completion never introduces a third form

The picker SHALL NOT be offered for plain `[[Page]]` wikilinks, and no
completion SHALL insert a convention other than the two forms.

#### Scenario: A plain wikilink gets no picker

- **WHEN** the user types `[[Rea` in the editor
- **THEN** no picker appears and the text stays literal Markdown

### Requirement: A page row can be dragged into the open page

A page row in the Files listing SHALL be draggable, carrying the page's name.
Releasing it over the editor pane SHALL write a reference to that page at the
drop point, in one of the two forms: `#name` for a single word, `#[[name]]`
otherwise. A drag SHALL NOT by itself open the page, add a history entry, or
change any other state; only a drag released over the editor pane writes, and
only the open page's own text changes. A press and release that does not start a
drag SHALL still open the page.

#### Scenario: A single-word page is dragged as the word form

- **GIVEN** an open page and a page named `reading`
- **WHEN** its row is dragged into the page
- **THEN** the text `#reading` is inserted at the drop point

#### Scenario: A multi-word page is dragged as the bracketed form

- **GIVEN** an open page and a page named `reading list`
- **WHEN** its row is dragged into the page
- **THEN** the text `#[[reading list]]` is inserted at the drop point

#### Scenario: A dragged reference resolves to that page

- **GIVEN** a page named `reading list` dragged into the open page
- **WHEN** the page is saved
- **THEN** its text references `reading list`, and that page's backlinks include
  the page it was dropped into

#### Scenario: Dragging a page row does not open it

- **GIVEN** an open page and a page named `reading`
- **WHEN** its row is dragged into the page and released
- **THEN** `reading` does not open, the history trail gains no entry, and the
  open page stays open

#### Scenario: A click on a row still opens the page

- **WHEN** the user presses and releases on a page row without moving the pointer
- **THEN** that page opens and no reference is written
