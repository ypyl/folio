## MODIFIED Requirements

### Requirement: Links pane rows navigate to pages

The meta panel's Links page rows SHALL navigate: clicking a page row opens the page it names, exactly like clicking a sidebar row, with the same active-row marking. A backlink row — a page that references the open page — and a forwardlink row — a page the open page references — both navigate. The panel's file rows, the page's referenced files listed by the vault-assets and whiteboards capabilities, are badged by kind in the same Links list, not among its page rows. A row targeting a page with no file on disk SHALL still navigate, opening the page as a blank in-memory page (see the unmaterialized-pages requirement). A row whose reference name is a valid calendar date SHALL open the journal day for that date, under `journals/`, whether or not that file exists. An asset or board row is not a page row: it opens the file or board it names and navigates nowhere.

#### Scenario: Clicking a backlink row opens the referring page

- **GIVEN** a page `Topic.md` that is referenced by `Ideas.md`
- **WHEN** the user opens `Topic.md` and clicks the `Ideas` row in Links
- **THEN** the editor pane opens `Ideas.md` and the meta panel shows `Ideas`'s own links

#### Scenario: Clicking a forwardlink row opens the target page

- **GIVEN** an open page whose content references `Roadmap` and `Roadmap.md` exists
- **WHEN** the user clicks the `Roadmap` row in Links
- **THEN** the editor pane opens `Roadmap.md` and the active row marking moves to it

#### Scenario: A page's file rows are not forwardlink rows

- **GIVEN** an open page whose content is `[Q3 report](assets/q3-report.pdf) and #Roadmap`
- **WHEN** the user looks at the panel
- **THEN** the Links list shows the `Roadmap` row badged `out` and the `q3-report.pdf` row badged `a`, and only the `Roadmap` row is a page row

#### Scenario: A forwardlink to a missing page still opens it

- **GIVEN** an open page whose content references `Missing`, and no `Missing.md` exists
- **WHEN** the user clicks the `Missing` row in Links
- **THEN** the editor pane shows a blank page for `Missing`, no file is created on disk, and the active row marking moves to it

#### Scenario: A forwardlink to a date opens the journal day

- **GIVEN** an open page whose content references `#[[2026-09-16]]`, and no journal file exists for that day
- **WHEN** the user clicks the `2026-09-16` row in Links
- **THEN** the editor pane shows the blank journal day for 2026-09-16, the journal calendar marks that day as open, and no file is created on disk

#### Scenario: An asset row opens without navigating

- **GIVEN** an open page whose Links list includes the asset row `q3-report.pdf`
- **WHEN** the user clicks that row
- **THEN** the file opens, the editor keeps showing the same page, and the active row marking does not move
