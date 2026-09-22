## MODIFIED Requirements

### Requirement: No-folder state invites opening a folder

When no vault folder is open, the sidebar SHALL render its Journal, Pages, Boards, and Assets sections empty — no calendar marks, no rows — and the editor pane SHALL show an empty state inviting the user to open a folder. Where the browser provides the local-folder picker, that empty state SHALL also offer the one-time Logseq import action described by the logseq-import capability; where it does not, the invitation stands alone. The four section summaries SHALL still be rendered, in the order the ui-shell capability specifies.

#### Scenario: Before any folder is opened

- **WHEN** the app loads and no folder has been opened or granted
- **THEN** the Journal, Pages, Boards, and Assets sections show no rows and no calendar marks, their summaries remain in the sidebar, and the editor pane says "Open a folder to begin."

#### Scenario: Folder permission is not currently granted

- **WHEN** the user has stored folders but none is currently active or writable
- **THEN** the sidebar shows no rows and the editor pane shows the open-a-folder empty state

#### Scenario: The empty state offers the import action

- **WHEN** the app loads with no folder open in a browser that provides the local-folder picker
- **THEN** the editor pane offers the Import from Logseq action beside the open-a-folder invitation

#### Scenario: The empty state offers no import action without a picker

- **GIVEN** a browser whose runtime provides no local-folder picker
- **WHEN** the app loads with no folder open
- **THEN** the editor pane shows the open-a-folder empty state with no Import from Logseq action
