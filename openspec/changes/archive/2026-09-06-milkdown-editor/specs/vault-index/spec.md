# vault-index Specification

## ADDED Requirements

### Requirement: The index absorbs the app's own writes
A page saved by the app SHALL reach the index immediately, without waiting for a diff-rescan: the page's content and parsed references SHALL update in memory as soon as the save succeeds, the backlink entries affected by the page's references SHALL be re-derived, and the index's change snapshot SHALL be updated for that page so the next refresh does not re-read it. A save that failed or never ran SHALL leave the index unchanged.

#### Scenario: A saved edit is visible immediately
- **WHEN** a page's edited content is saved successfully
- **THEN** the index holds the new content and the re-parsed references for that page, without any refresh

#### Scenario: Backlink entries re-derive from the edit
- **WHEN** a saved edit adds or removes a reference to another page
- **THEN** that target's backlink list reflects the edited page's new links immediately

#### Scenario: The next refresh skips the written file
- **WHEN** a diff-rescan runs after a page was saved by the app
- **THEN** that page is not re-read, because its change snapshot matches the file's current state

#### Scenario: A failed save leaves the index unchanged
- **WHEN** a save fails
- **THEN** the index still holds the page's previous content and references