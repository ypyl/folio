## Purpose

Defines Folio's asset model: the vault files a page points at with ordinary Markdown links, how those files are listed and opened, and why they stay outside everything page-shaped (ADR-0022).

## ADDED Requirements

### Requirement: An asset is a vault file a page references, never a page
An asset SHALL be a file in the vault that is not a page. The app SHALL derive assets from two sources: the vault's own `assets/` folder, and the vault-relative paths a page's Markdown links and images target. An asset SHALL NOT become a page: it produces no page record, no search content, no reference-namespace entry, no backlink entry, no pin, and no editor content, and it SHALL NOT be edited, renamed, moved, or deleted by the app.

#### Scenario: An asset file never becomes a page

- **GIVEN** a vault containing `assets/notes.md` and `assets/q3-report.pdf`
- **WHEN** the vault is indexed
- **THEN** neither file produces a page, appears among the vault's pages, or is found by search

#### Scenario: An asset is not reachable through the reference namespace

- **GIVEN** a vault containing `assets/notes.md` and a page referencing `#[[notes]]`
- **WHEN** the vault is indexed
- **THEN** the reference names the page `notes`, not `assets/notes.md`

#### Scenario: Invoking an asset never writes

- **WHEN** an asset is listed, opened, or referenced
- **THEN** the vault file's bytes are unchanged and the page's Markdown is unchanged

### Requirement: The Assets section lists the vault's assets
The sidebar's Assets section SHALL list the vault's asset inventory (vault-index), ordered by path, each row labelled by its path relative to the `assets/` folder. The section header SHALL be rendered in every app state, as the shell's sidebar requirement specifies. When the folder holds no files, the section SHALL show empty-state copy instead of rows, and while the index builds it SHALL show the shell's loading placeholders. The listing SHALL cover every inventoried file while rendering only the rows near its own visible region, so the number of rows in the document does not grow with the number of assets.

#### Scenario: The section lists the folder's files in path order

- **GIVEN** a vault containing `assets/shot.png`, `assets/q3-report.pdf`, and `assets/Annual review.docx`
- **WHEN** the Assets section renders
- **THEN** it lists three rows, ordered by path, labelled `Annual review.docx`, `q3-report.pdf`, and `shot.png`

#### Scenario: Nested folders are labelled by their relative path

- **GIVEN** a vault containing `assets/2026/q3-report.pdf`
- **WHEN** the Assets section renders
- **THEN** the row is labelled `2026/q3-report.pdf`, so two files with the same name in different folders read differently

#### Scenario: An orphan is listed

- **GIVEN** a vault containing `assets/orphan.png` that no page references
- **WHEN** the Assets section renders
- **THEN** `orphan.png` is listed like any other asset

#### Scenario: An empty assets folder shows copy

- **GIVEN** an open vault whose `assets/` folder holds no files
- **WHEN** the Assets section is open
- **THEN** it shows empty-state copy instead of rows

#### Scenario: A large assets folder renders a bounded number of rows

- **GIVEN** a vault with thousands of files under `assets/`
- **WHEN** the Assets section renders
- **THEN** only a small number of rows near the visible part of the section are in the document, that number does not grow with the folder, and scrolling reaches the last file

#### Scenario: A file added externally appears

- **GIVEN** an open vault whose index is up to date
- **WHEN** a file is copied into `assets/` outside the app and the index refreshes
- **THEN** the file is listed in the Assets section

### Requirement: Activating an asset opens the file and changes nothing else
Activating an asset row — in the Assets section or in a page's Forwardlinks — SHALL open the file at that path exactly as a vault link opens (ADR-0021): a type the browser displays SHALL be shown in a new window, and every other type SHALL be downloaded for the operating system's registered application. The path SHALL be used as the file's literal name, without percent-decoding. The vault file SHALL NOT be written, the page's Markdown SHALL NOT be changed, and no app state SHALL change: the open page stays open, the sidebar's active marking does not move, the history trail gains no entry, and nothing on the search surface changes. A path the vault cannot read — a file deleted since the index was built — SHALL open nothing and leave the app as it is.

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

### Requirement: Forwardlinks lists a page's assets beside its page references
When a page is open, its Forwardlinks SHALL list one asset row per asset reference, alongside the page rows for the pages it references, labelled with the file's name, ordered with the page rows by label, and never dimmed or marked as the open page. Activating an asset row SHALL open the file (see "Activating an asset opens the file and changes nothing else"); activating a page row SHALL navigate as before.

#### Scenario: A page's files appear in Forwardlinks

- **GIVEN** an open page whose content is `[Q3 report](assets/q3-report.pdf) and #Roadmap`
- **WHEN** the user looks at the Forwardlinks section
- **THEN** it lists a `q3-report.pdf` row beside the `Roadmap` row, ordered by label

#### Scenario: An asset row opens instead of navigating

- **GIVEN** an open page whose Forwardlinks lists `q3-report.pdf`
- **WHEN** the user activates that row
- **THEN** the file opens, and the editor keeps showing the same page with the same active marking

#### Scenario: A page with no assets lists only page rows

- **GIVEN** an open page that references pages but no vault files
- **WHEN** the user looks at the Forwardlinks section
- **THEN** no asset row is listed
