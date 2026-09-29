## RENAMED Requirements

- FROM: `### Requirement: A page's files are listed in the Forwardlinks Files group`
- TO: `### Requirement: A page's files are listed in the Forwardlinks list`

## MODIFIED Requirements

### Requirement: A page's files are listed in the Forwardlinks list

When a page is open, the Forwardlinks list SHALL include one row per asset the page references, after its page rows, labelled with the file's name, marked with an `a` badge before its label, and listed in the order the references appear in the page, and never dimmed or marked as the open page. Asset rows SHALL be the only file rows besides boards; a page's assets SHALL NOT appear among the Forwardlinks page rows, which list page references only. Board references share this list (whiteboards capability). Activating an asset row SHALL open the file (see "Activating an asset opens the file and changes nothing else"). While the index builds, the list SHALL show the shell's loading placeholders, and when the open page references nothing the list SHALL show empty-state copy.

#### Scenario: A page's files appear in the References section

- **GIVEN** an open page whose content is `[Q3 report](assets/q3-report.pdf) and #Roadmap`
- **WHEN** the user looks at the Forwardlinks section
- **THEN** it lists a `q3-report.pdf` row marked with an `a` badge, and no page row carries a badge

#### Scenario: A page's files are not page rows

- **GIVEN** an open page whose content is `[Q3 report](assets/q3-report.pdf) and #Roadmap`
- **WHEN** the user looks at the Forwardlinks page rows
- **THEN** they list only the `Roadmap` row, unbadged

#### Scenario: An asset row opens instead of navigating

- **GIVEN** an open page whose Forwardlinks list includes the asset row `q3-report.pdf`
- **WHEN** the user activates that row
- **THEN** the file opens, and the editor keeps showing the same page with the same active marking

#### Scenario: A page with no assets shows copy

- **GIVEN** an open page that references pages but no vault files
- **WHEN** the user opens the Forwardlinks section
- **THEN** it lists its page rows and no asset rows, with no empty-state copy

### Requirement: Activating an asset opens the file and changes nothing else

Activating an asset row — in the Files section's asset rows or in a page's Forwardlinks file rows — SHALL open the file at that path exactly as a vault link opens (ADR-0021): a type the browser displays SHALL be shown in a new window, and every other type SHALL be downloaded for the operating system's registered application. The path SHALL be used as the file's literal name, without percent-decoding. The vault file SHALL NOT be written, the page's Markdown SHALL NOT be changed, and no app state SHALL change: the open page stays open, the sidebar's active marking does not move, the history trail gains no entry, and nothing on the search surface changes. A path the vault cannot read — a file deleted since the index was built — SHALL open nothing and leave the app as it is.

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
