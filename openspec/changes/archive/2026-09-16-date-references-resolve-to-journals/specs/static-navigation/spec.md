## MODIFIED Requirements

### Requirement: Links pane rows navigate to pages
The meta panel's Backlinks and Forwardlinks rows SHALL navigate: clicking a row opens the page it names, exactly like clicking a sidebar row, with the same active-row marking. Backlinks rows SHALL list the pages that reference the open page; Forwardlinks rows SHALL list the pages the open page references. A row targeting a page with no file on disk SHALL still navigate, opening the page as a blank in-memory page (see the unmaterialized-pages requirement). A row whose reference name is a valid calendar date SHALL open the journal day for that date, under `journals/`, whether or not that file exists.

#### Scenario: Clicking a backlink row opens the referring page
- **GIVEN** a page `Topic.md` that is referenced by `Ideas.md`
- **WHEN** the user opens `Topic.md` and clicks the `Ideas` row in Backlinks
- **THEN** the editor pane opens `Ideas.md` and the Links pane shows `Ideas`'s own links

#### Scenario: Clicking a forwardlink row opens the target page
- **GIVEN** an open page whose content references `Roadmap` and `Roadmap.md` exists
- **WHEN** the user clicks the `Roadmap` row in Forwardlinks
- **THEN** the editor pane opens `Roadmap.md` and the active row marking moves to it

#### Scenario: A forwardlink to a missing page still opens it
- **GIVEN** an open page whose content references `Missing`, and no `Missing.md` exists
- **WHEN** the user clicks the `Missing` row in Forwardlinks
- **THEN** the editor pane shows a blank page for `Missing`, no file is created on disk, and the active row marking moves to it

#### Scenario: A forwardlink to a date opens the journal day
- **GIVEN** an open page whose content references `#[[2026-09-16]]`, and no journal file exists for that day
- **WHEN** the user clicks the `2026-09-16` row in Forwardlinks
- **THEN** the editor pane shows the blank journal day for 2026-09-16, the journal calendar marks that day as open, and no file is created on disk
