# vault-assets Specification

## Purpose
Defines Folio's asset model: the vault files a page points at with ordinary Markdown links, how those files are listed and opened, and why they stay outside everything page-shaped (ADR-0022).

## Requirements

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
Activating an asset row — in the Assets section or in a page's References section — SHALL open the file at that path exactly as a vault link opens (ADR-0021): a type the browser displays SHALL be shown in a new window, and every other type SHALL be downloaded for the operating system's registered application. The path SHALL be used as the file's literal name, without percent-decoding. The vault file SHALL NOT be written, the page's Markdown SHALL NOT be changed, and no app state SHALL change: the open page stays open, the sidebar's active marking does not move, the history trail gains no entry, and nothing on the search surface changes. A path the vault cannot read — a file deleted since the index was built — SHALL open nothing and leave the app as it is.

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

### Requirement: The References section lists a page's assets
When a page is open, the meta panel's References section SHALL list one row per asset the page references, labelled with the file's name and ordered by label, and never dimmed or marked as the open page. The section SHALL be the only panel section holding asset rows: a page's assets SHALL NOT appear in Forwardlinks. Activating an asset row SHALL open the file (see "Activating an asset opens the file and changes nothing else"). While the index builds, the section SHALL show the shell's loading placeholders, and when the open page references no asset it SHALL show empty-state copy.

#### Scenario: A page's files appear in the References section

- **GIVEN** an open page whose content is `[Q3 report](assets/q3-report.pdf) and #Roadmap`
- **WHEN** the user looks at the References section
- **THEN** it lists a `q3-report.pdf` row, and no page row

#### Scenario: A page's files are not page rows

- **GIVEN** an open page whose content is `[Q3 report](assets/q3-report.pdf) and #Roadmap`
- **WHEN** the user looks at the Forwardlinks section
- **THEN** it lists only the `Roadmap` row

#### Scenario: An asset row opens instead of navigating

- **GIVEN** an open page whose References section lists `q3-report.pdf`
- **WHEN** the user activates that row
- **THEN** the file opens, and the editor keeps showing the same page with the same active marking

#### Scenario: A page with no assets shows copy

- **GIVEN** an open page that references pages but no vault files
- **WHEN** the user opens the References section
- **THEN** it shows empty-state copy and no rows

### Requirement: A reference to an existing asset is completed at the link destination
While the caret is inside an inline link's or image's destination in the editor, the app SHALL offer the vault's files that match the text typed so far, and SHALL write the chosen file's vault-relative path as the destination when a candidate is accepted. The candidates SHALL be exactly the vault paths a page's asset reference can name — vault-relative, not a page, and held by the vault — each labelled by its path inside the `assets/` folder and matched against the typed text. The written reference SHALL be an ordinary Markdown link, or an ordinary Markdown image when the user is typing an image's destination, with the same label rule the drop and paste gestures use: the label the user typed, or the file's name when none was typed. Completion SHALL be offered only when the typed destination is vault-relative, does not begin with `#`, is not already closed by a `)` at the caret, and matches at least one candidate; an empty destination, a scheme, an absolute path, a fragment, and text matching no file SHALL offer nothing, so a link the app cannot complete behaves exactly as it did before. Accepting SHALL NOT open the file, navigate, or change any state other than the page's own text, and SHALL NOT create a page, a reference token, or any entry in the reference namespace.

#### Scenario: A typed prefix offers the matching files
- **GIVEN** a vault holding `assets/q3-report.pdf` and `assets/shot.png`, with a page open
- **WHEN** the user types `[Q3 report](q3` in the page
- **THEN** the picker offers `q3-report.pdf` and no other file

#### Scenario: Accepting writes the file's path as an ordinary link
- **GIVEN** the picker is offering `q3-report.pdf` for the typed label `Q3 report`
- **WHEN** the user accepts that row
- **THEN** the page's text is `[Q3 report](assets/q3-report.pdf)`, a link that opens the file, and no file is opened by the acceptance itself

#### Scenario: An empty label is filled with the file's name
- **GIVEN** a vault holding `assets/shot.png` and a page open
- **WHEN** the user types `[](sh` and accepts the row for `shot.png`
- **THEN** the page's text is `[shot](assets/shot.png)`

#### Scenario: An image destination writes an image
- **GIVEN** a vault holding `assets/shot.png` and a page open
- **WHEN** the user types `![icon](sh` and accepts the row for `shot.png`
- **THEN** the page's text is `![icon](assets/shot.png)`, and the image renders the file's bytes with `icon` as its alternative text

#### Scenario: An image destination offers no file that cannot be an image
- **GIVEN** a vault holding `assets/shot.png` and `assets/q3-report.pdf`, with a page open
- **WHEN** the user types `![scan](q3`
- **THEN** nothing is offered, because a PDF cannot be an image

#### Scenario: A reference deleted earlier can be added back
- **GIVEN** a page whose text no longer mentions `assets/shot.png`, and a vault that still holds it
- **WHEN** the user types `[shot](sh` and accepts the row for `shot.png`, then the page is saved
- **THEN** the page's text holds a link to `assets/shot.png` and the open page's References section lists `shot.png`

#### Scenario: An ordinary link to another site is left alone
- **GIVEN** a vault holding `assets/shot.png` and a page open
- **WHEN** the user types `[site](https://example.com`
- **THEN** no picker is shown, and the text remains the literal Markdown the user typed

#### Scenario: A fragment destination offers no file
- **WHEN** the user types `[notes](#reading` in a page
- **THEN** no file is offered for it, because a fragment names a place in the document rather than a file

#### Scenario: Text matching no file shows nothing
- **GIVEN** a vault holding `assets/shot.png` and a page open
- **WHEN** the user types `[x](zzz`
- **THEN** no picker is shown

#### Scenario: Completion changes nothing but the page's text
- **GIVEN** an open page with unsaved edits, and a vault holding `assets/notes.md`
- **WHEN** the user completes a reference to `assets/notes.md`
- **THEN** no page is created for that file, no `#` reference resolves to it, the file's bytes are unchanged, and the open page, its save state, and the history trail are as they were
