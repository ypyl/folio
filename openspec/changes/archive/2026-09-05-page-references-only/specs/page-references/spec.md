## Purpose

Defines Folio's canonical page-reference model: every reference is a page, written in exactly one of two hashtag forms, with no separate tag concept and no other tools' reference conventions.

## ADDED Requirements

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