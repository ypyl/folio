## ADDED Requirements

### Requirement: The index derives the vault's boards from the boards/ folder

Reading a vault SHALL expose the paths of every board — every `.excalidraw` file under the vault's `boards/` directory, at any depth within it, when no path segment begins with `.` — ordered by path. The listing SHALL come from the same folder listing the pages come from, so a board added or removed outside the app appears on the next scan without the app writing anything. A `.excalidraw` file outside `boards/` SHALL NOT be listed as a board, and a board SHALL NOT produce a page.

#### Scenario: A board file is listed

- **GIVEN** a vault containing `boards/migration.excalidraw`
- **WHEN** the vault is indexed
- **THEN** the vault's boards include `boards/migration.excalidraw`

#### Scenario: Nested boards are listed

- **GIVEN** a vault containing `boards/2026/q3.excalidraw`
- **WHEN** the vault is indexed
- **THEN** the vault's boards include `boards/2026/q3.excalidraw`

#### Scenario: A hidden board is not listed

- **GIVEN** a vault containing `boards/.draft.excalidraw`
- **WHEN** the vault is indexed
- **THEN** it is not listed as a board

#### Scenario: A board added outside the app appears

- **GIVEN** an open vault whose index is up to date
- **WHEN** `boards/sketch.excalidraw` is copied into the folder outside the app and the index refreshes
- **THEN** the vault's boards include it

### Requirement: The index extracts board references and resolves them to boards

The index SHALL extract from each page's content every board reference written in Folio's two board forms (`#!word` where `word` is letters, digits, `_`, `-`; and `#![[Many Words]]`), recording the referenced board name and the lexical form used, each name once per page. The name SHALL resolve, ignoring letter case, to the board whose path is `boards/<name>.excalidraw`; a name with no matching board SHALL remain a valid board reference. Non-board forms, including `#word` and `#[[Page]]`, SHALL NOT be extracted as board references. For every board a page references, the index SHALL provide the reverse set: the pages whose content references that board, excluding a board's own file (which is not a page and holds no Markdown).

#### Scenario: Both board forms are extracted

- **WHEN** a page contains `See #!Migration and #![[Migration topology]]`
- **THEN** the index records board references to `Migration` and to `Migration topology`, each with its lexical form

#### Scenario: Duplicate board references collapse

- **WHEN** a page contains `#!Migration` twice
- **THEN** the index records a single board reference to `Migration`

#### Scenario: Page references are not board references

- **WHEN** a page contains `#Migration` and `#[[Migration]]`
- **THEN** the index records no board reference for either

#### Scenario: A board resolves case-insensitively

- **GIVEN** a vault holding `boards/Migration.excalidraw`
- **WHEN** a page contains `#!migration`
- **THEN** the reference resolves to `boards/Migration.excalidraw`

#### Scenario: A board reference to a missing board is valid

- **WHEN** a page contains `#![[Architecture]]` and no such board exists
- **THEN** the index records the reference and no board file is created

#### Scenario: A board reports the pages that reference it

- **GIVEN** `Ideas.md` and `Log.md` each containing a reference to `Migration`, and a board `boards/Migration.excalidraw`
- **WHEN** the vault is indexed
- **THEN** the board's referencing pages are `Ideas.md` and `Log.md`

#### Scenario: A page that removed its reference stops being a referrer

- **GIVEN** a page referencing `#!Migration`, and an index that reports it
- **WHEN** the page's content no longer contains the token and the index refreshes
- **THEN** the board's referencing pages no longer include that page
