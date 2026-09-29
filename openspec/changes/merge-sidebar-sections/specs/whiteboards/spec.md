## RENAMED Requirements

- FROM: `### Requirement: The sidebar's Boards section lists the vault's boards and opens them`
- TO: `### Requirement: The Files listing's board rows list the vault's boards and open them`

## MODIFIED Requirements

### Requirement: A board is a vault file under boards/, not a page and not an asset

A board SHALL be a `.excalidraw` file under the vault's `boards/` directory, at any depth within it, when no path segment begins with `.`. A board SHALL NOT produce a page record, page-search content, a backlink entry, a pin, or editor content, and it SHALL NOT be listed among the vault's assets. Unlike an asset, a board SHALL be parsed, edited, and written by the app: its file holds the board's scene, and a save SHALL write that scene back to the same path. The app SHALL NOT rename, move, or delete a board. A `.excalidraw` file outside `boards/` SHALL NOT be listed as a board.

#### Scenario: A board file is not a page

- **GIVEN** a vault containing `boards/migration.excalidraw`
- **WHEN** the vault is indexed
- **THEN** the file produces no page record, appears in no Files listing as a page, and is found by no page-content search

#### Scenario: A board file is not an asset

- **GIVEN** a vault containing `boards/migration.excalidraw`
- **WHEN** the Files section renders
- **THEN** the board is not listed among the asset rows

#### Scenario: A board outside boards/ is not listed as a board

- **GIVEN** a vault containing `notes/migration.excalidraw`
- **WHEN** the vault is indexed
- **THEN** no board is listed for it

#### Scenario: A board is editable, unlike an asset

- **GIVEN** an open board
- **WHEN** the user draws an element and the save settles
- **THEN** the board's file at its path holds the new scene, and no other file changed

### Requirement: The Files listing's board rows list the vault's boards and open them

The sidebar's Files listing SHALL hold the vault's board rows: the vault's board inventory (vault-index), ordered by path within the board group and labelled by each board's path inside `boards/`, each marked with a `b` badge before its label. Board rows SHALL follow the listing's page rows and precede its asset rows (static-navigation and vault-assets capabilities). When the vault holds no boards the listing SHALL show no board rows. While the index builds it SHALL show the shell's loading placeholders. Activating a board row SHALL open that board in the main pane, and the row for the open board SHALL carry the active marking and SHALL always be rendered while the board is open, even when it sits outside the listing's visible region. The listing SHALL render only the rows near the visible part of its own scroll region, so the number of rows in the document does not grow with the number of boards.

#### Scenario: The section lists boards in path order

- **GIVEN** a vault holding `boards/Migration.excalidraw` and `boards/Archive/old.excalidraw`
- **WHEN** the Files listing renders
- **THEN** it lists two board rows (each with a `b` badge) after the page rows and before the asset rows, ordered by path, labelled `Archive/old.excalidraw` and `Migration.excalidraw`

#### Scenario: Activating a row opens the board

- **WHEN** the user activates a board row
- **THEN** the board opens in the main pane, the editor pane's page is replaced, and the row is marked active

#### Scenario: The open board's row is always rendered

- **GIVEN** the open board sits far from the current scroll position in the Files listing
- **WHEN** the Files section renders
- **THEN** that board's row is in the document and marked as the active row, exactly as an open page's row is

#### Scenario: A large board inventory renders a bounded number of rows

- **GIVEN** a vault with thousands of boards
- **WHEN** the Files section renders
- **THEN** only a small number of rows near the visible part of its scroll region are in the document, and that number does not grow with the number of boards

#### Scenario: An empty boards folder shows copy

- **GIVEN** an open vault with no boards
- **WHEN** the Files section renders
- **THEN** it shows no board rows
