## ADDED Requirements

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
