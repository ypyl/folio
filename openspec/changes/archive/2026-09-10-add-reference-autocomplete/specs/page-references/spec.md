## ADDED Requirements

### Requirement: Reference completion produces one of the two canonical forms
When a page reference is completed from the editor's picker, the inserted text SHALL be exactly one reference token in Folio's two lexical forms. It SHALL be `#name` when the trigger was `#` and the picked page name is a single word, and `#[[name]]` in every other case, including whenever the trigger was `#[[`. The inserted token SHALL carry the page name exactly as it exists on disk, and SHALL read back as a reference to that same page name.

#### Scenario: A single-word name completes in the word form
- **WHEN** completion inserts the page `reading` from a `#` trigger
- **THEN** the text is `#reading`, which the editor badges and the index counts as a reference to `reading`

#### Scenario: A multi-word name completes in the bracketed form
- **WHEN** completion inserts the page `reading list` from a `#` trigger
- **THEN** the text is `#[[reading list]]`

#### Scenario: A bracketed trigger stays bracketed
- **WHEN** the user types `#[[read` and completion inserts the page `reading`
- **THEN** the text is `#[[reading]]`

#### Scenario: A name that is not a word completes in the bracketed form
- **WHEN** completion inserts a page named `café` or `2.0`
- **THEN** the text is `#[[café]]` or `#[[2.0]]`, never `#café` or `#2.0`, because the word form only accepts letters, digits, `_`, and `-`

#### Scenario: The completed reference resolves to the picked page
- **WHEN** a completion token is saved and the vault is re-indexed
- **THEN** the picked page's backlinks include the page holding the token

### Requirement: Names with no valid reference token are never offered
A page whose name cannot be written as a reference token that reads back to that exact name SHALL NOT be offered as a completion candidate.

#### Scenario: A name containing a closing bracket is not offered
- **WHEN** the vault holds a page named `weird]name` and the user types `#weird`
- **THEN** no row for it appears, because no reference form can express that name

#### Scenario: A name with surrounding whitespace is not offered
- **WHEN** the vault holds a page whose name has leading or trailing whitespace
- **THEN** it is not offered, because reference parsing trims the name and the token would resolve to a different page

### Requirement: Completion never introduces a third reference form
The completion picker SHALL NOT be offered for plain `[[Page]]` wikilinks, and no completion SHALL insert a reference convention other than Folio's two forms.

#### Scenario: A plain wikilink gets no picker
- **WHEN** the user types `[[Rea` in the editor
- **THEN** no popup appears and the text stays literal Markdown text
