## RENAMED Requirements

- FROM: `### Requirement: The Assets section lists the vault's assets`
- TO: `### Requirement: The Files listing's asset rows list the vault's assets`

## MODIFIED Requirements

### Requirement: The Files listing's asset rows list the vault's assets

The sidebar's Files listing SHALL hold the vault's asset rows: the vault's asset inventory (vault-index), ordered by path, each row labelled by its path relative to the `assets/` folder and marked with an `a` badge before its label. Asset rows SHALL follow the listing's page rows and, where boards are present, its board rows (static-navigation and whiteboards capabilities). When the folder holds no files the listing SHALL show no asset rows; the Files listing shows its own empty-state copy only when it holds no rows at all. While the index builds the listing SHALL show the shell's loading placeholders. The listing SHALL cover every inventoried file while rendering only the rows near its own visible region, so the number of rows in the document does not grow with the number of assets.

#### Scenario: The section lists the folder's files in path order

- **GIVEN** a vault containing `assets/shot.png`, `assets/q3-report.pdf`, and `assets/Annual review.docx`
- **WHEN** the Files listing renders
- **THEN** it lists three asset rows (each with an `a` badge), ordered by path, labelled `Annual review.docx`, `q3-report.pdf`, and `shot.png`

#### Scenario: Nested folders are labelled by their relative path

- **GIVEN** a vault containing `assets/2026/q3-report.pdf`
- **WHEN** the Files listing renders
- **THEN** the row is labelled `2026/q3-report.pdf`, so two files with the same name in different folders read differently

#### Scenario: An orphan is listed

- **GIVEN** a vault containing `assets/orphan.png` that no page references
- **WHEN** the Files listing renders
- **THEN** `orphan.png` is listed like any other asset

#### Scenario: An empty assets folder shows copy

- **GIVEN** an open vault whose `assets/` folder holds no files
- **WHEN** the Files section renders
- **THEN** it shows no asset rows, and shows its empty-state copy only if it holds no rows at all

#### Scenario: A large assets folder renders a bounded number of rows

- **GIVEN** a vault with thousands of files under `assets/`
- **WHEN** the Files section renders
- **THEN** only a small number of rows near the visible part of the section are in the document, that number does not grow with the folder, and scrolling reaches the last file

#### Scenario: A file added externally appears

- **GIVEN** an open vault whose index is up to date
- **WHEN** a file is copied into `assets/` outside the app and the index refreshes
- **THEN** the file is listed in the Files section's asset rows

### Requirement: Activating an asset opens the file and changes nothing else

Activating an asset row — in the Files section's asset rows or in a page's Forwardlinks Files group — SHALL open the file at that path exactly as a vault link opens (ADR-0021): a type the browser displays SHALL be shown in a new window, and every other type SHALL be downloaded for the operating system's registered application. The path SHALL be used as the file's literal name, without percent-decoding. The vault file SHALL NOT be written, the page's Markdown SHALL NOT be changed, and no app state SHALL change: the open page stays open, the sidebar's active marking does not move, the history trail gains no entry, and nothing on the search surface changes. A path the vault cannot read — a file deleted since the index was built — SHALL open nothing and leave the app as it is.

#### Scenario: A displayable asset opens in a window

- **GIVEN** a vault containing `assets/q3-report.pdf`, with a page open in the editor
- **WHEN** the user activates its row
- **THEN** the file's bytes open in a new window, and the app's open page and panes are unchanged

#### Scenario: A non-displayable asset downloads

- **GIVEN** a vault containing `assets/archive.zip`
- **WHEN** the user activates its row
- **THEN** the browser downloads the file for the operating system's registered application

#### Scenario: Opening an asset leaves the session alone

- **GIVEN** a page open with unsaved edits, and a vault holding an asset
- **WHEN** the user activates the asset's row
- **THEN** the same page stays open, its save state is unchanged, no entry is added to the history trail, and Back and Forward step where they did before

#### Scenario: A name carrying a percent sign opens the file it names

- **GIVEN** a vault containing `assets/100% done.pdf`
- **WHEN** the user activates its row
- **THEN** `assets/100% done.pdf` is read and opened, not a decoded approximation of the name

#### Scenario: An unreadable asset opens nothing

- **GIVEN** an asset row listed by the index whose file was deleted from the folder
- **WHEN** the user activates the row
- **THEN** nothing opens and the app remains as it was

### Requirement: An asset row can be dragged into the open page

A row in the sidebar's Files listing SHALL be draggable, carrying the vault path of the file it lists. Dragging a row and releasing it over the editor pane SHALL write a reference to that file at the drop point (see "A reference dragged from the sidebar is written at the drop point"). A drag SHALL NOT open the file and SHALL NOT change any app state by itself: only a drag that is released over the editor pane writes anything, and only the open page's own text changes.

A drag is not an activation: a press and release on a row that does not start a drag SHALL still open the file exactly as before (ADR-0021), and a drag that ends anywhere other than the editor pane SHALL leave the app as it was.

#### Scenario: Dragging a row does not open the file

- **GIVEN** an open page and a vault holding `assets/q3-report.pdf`
- **WHEN** its row is dragged out of the sidebar and released somewhere with no drop target
- **THEN** no window opens, no download starts, and the page's text is unchanged

#### Scenario: A click on a row still opens the file

- **GIVEN** an open page and a vault holding `assets/q3-report.pdf`
- **WHEN** the user presses and releases on its row without moving the pointer
- **THEN** the file opens as it did before this gesture existed, and no reference is written into the page

#### Scenario: The row carries the file's path, not its label

- **GIVEN** a vault holding `assets/2026/q3-report.pdf`
- **WHEN** its row is dragged into the open page
- **THEN** the written destination is the vault path `assets/2026/q3-report.pdf`, not the row's label `2026/q3-report.pdf`
