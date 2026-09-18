# page-references Specification

## Purpose

Defines Folio's canonical page-reference model: every reference is a page, written in exactly one of two hashtag forms, with no separate tag concept and no other tools' reference conventions.

## Requirements

### Requirement: Page references have exactly two lexical forms
A page reference SHALL be written in exactly one of two forms: `#word`, where `word` is a single word (letters, digits, `_`, `-`), or `#[[Page name]]`, where the bracketed content is the page name. Both forms SHALL resolve to the page whose name is the referenced text.

#### Scenario: Single-word reference
- **WHEN** a note contains `#reading`
- **THEN** it is a reference to the page `reading`

#### Scenario: Multi-word reference
- **WHEN** a note contains `#[[reading list]]`
- **THEN** it is a reference to the page `reading list`

### Requirement: Tags are not a separate concept
Folio SHALL NOT treat `#word` as a tag or label. `#word` is a page reference to the page `word`, in the same namespace as every other reference. There SHALL be no tags index, no tags UI, and no tag-vs-page distinction anywhere in the app.

#### Scenario: Hashtagged word is a page reference
- **WHEN** a note contains `#ideas`
- **THEN** it is treated as a reference to the page `ideas`, identical in nature to `#[[ideas]]`

#### Scenario: No tags surface exists
- **WHEN** the app UI and index are inspected
- **THEN** no tags section, tags list, or tag-vs-page distinction is present

### Requirement: Unsupported reference conventions render as text
Plain `[[Page]]` wikilinks and any other tools' reference conventions (for example `#tag/word`) SHALL NOT be parsed as references. They SHALL render as literal Markdown text, not as reference chips, and SHALL NOT contribute to backlinks or navigation.

#### Scenario: Plain wikilink is not a reference
- **WHEN** a note contains `[[Inbox]]`
- **THEN** it renders as literal text `[[Inbox]]` and is not a reference chip

### Requirement: References to pages that do not exist yet are valid
A reference SHALL be valid even when the target page does not exist in the vault yet. The app SHALL NOT require a target page to exist for a reference to be recognized.

#### Scenario: Reference to a missing page is recognized
- **WHEN** a note contains `#[[feature roadmap]]` and no page `feature roadmap` exists
- **THEN** the reference is still recognized as a reference to the page `feature roadmap`

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

### Requirement: A date-shaped name names the journal day
A reference whose name is a valid calendar date in zero-padded `YYYY-MM-DD` form SHALL name the journal day for that date and resolve to the path `journals/<date>.md`, whether or not that file exists on disk. The app SHALL NOT resolve such a name to a page under `pages/`. Both lexical forms SHALL follow this rule. A name that is not a valid calendar date SHALL keep the ordinary resolution rule: the page whose filename stem matches, otherwise a blank page under `pages/`.

#### Scenario: A date reference targets the journal day with no file yet
- **GIVEN** a vault with no `journals/2026-09-16.md`
- **WHEN** a note contains `#[[2026-09-16]]`
- **THEN** the reference names the journal day for 2026-09-16, whose path is `journals/2026-09-16.md`, and no page under `pages/` is created or opened for it

#### Scenario: The word form follows the same rule
- **WHEN** a note contains `#2026-09-16`
- **THEN** it names the same journal day as `#[[2026-09-16]]`, resolving to `journals/2026-09-16.md`

#### Scenario: An existing journal file is the target
- **GIVEN** a vault containing `journals/2026-09-16.md`
- **WHEN** a note contains `#[[2026-09-16]]`
- **THEN** the reference resolves to `journals/2026-09-16.md`

#### Scenario: A date reference stays a valid reference with no page
- **GIVEN** a vault with no journal file for 2026-09-16
- **WHEN** a note contains `#[[2026-09-16]]` and is saved
- **THEN** the reference is recorded as valid, and the vault gains no file for that day

#### Scenario: A name that is not a real date is a page
- **WHEN** a note contains `#[[2026-13-45]]`
- **THEN** it resolves to the page `2026-13-45` and materializes under `pages/` on first save

#### Scenario: An unpadded date is a page
- **WHEN** a note contains `#[[2026-9-6]]`
- **THEN** it resolves to the page `2026-9-6` and materializes under `pages/` on first save

#### Scenario: Backlinks reach a day with no file
- **WHEN** a note containing `#[[2026-09-16]]` is saved, and no journal file exists for that day
- **THEN** the open journal day for 2026-09-16 lists that note in its Backlinks

### Requirement: A page row can be dragged into the open page
A row in the sidebar's Pages section SHALL be draggable, carrying the page's name. Dragging a row and releasing it over the editor pane SHALL write a reference to that page at the drop point (see "A reference dragged from the sidebar is written at the drop point"), in exactly one of the two lexical forms this capability defines ("Reference completion produces one of the two canonical forms"): `#name` when the name is a single word, and `#[[name]]` otherwise. The written token SHALL read back as a reference to the page the row named.

A row whose page name cannot be written as a reference token that reads back to that exact name SHALL NOT be draggable, exactly as such a name is never offered as a completion candidate ("Names with no valid reference token are never offered").

A drag SHALL NOT navigate to the page, open it, pin it, or change any state by itself: only a drag released over the editor pane writes anything, and only the open page's own text changes. A press and release on a row that does not start a drag SHALL still open the page exactly as before.

#### Scenario: A single-word page is dragged as the word form
- **GIVEN** an open page and a vault holding a page named `reading`
- **WHEN** its row is dragged from the sidebar's Pages section into the page
- **THEN** the text `#reading` is inserted at the drop point

#### Scenario: A multi-word page is dragged as the bracketed form
- **GIVEN** an open page and a vault holding a page named `reading list`
- **WHEN** its row is dragged into the page
- **THEN** the text `#[[reading list]]` is inserted at the drop point

#### Scenario: A dragged page reference resolves to that page
- **GIVEN** an open page and a vault holding a page named `reading list`
- **WHEN** its row is dragged into the page and the page is saved
- **THEN** the page's text holds a reference to `reading list`, and that page's backlinks include the page it was dropped into

#### Scenario: A name no token can express is not draggable
- **GIVEN** a vault holding a page named `weird]name`
- **WHEN** the user drags its row from the sidebar's Pages section into the open page
- **THEN** nothing is written into the page, because no reference form expresses that name

#### Scenario: Dragging a page row does not open it
- **GIVEN** an open page and a vault holding a page named `reading`
- **WHEN** its row is dragged into the page and released
- **THEN** the `reading` page does not open, no entry is added to the history trail, and the open page is still the one that was open

#### Scenario: A click on a row still opens the page
- **GIVEN** an open page listing another page in the sidebar
- **WHEN** the user presses and releases on that row without moving the pointer
- **THEN** that page opens as it did before this gesture existed, and no reference is written
