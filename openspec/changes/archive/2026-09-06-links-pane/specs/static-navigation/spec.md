## REMOVED Requirements

### Requirement: Meta panel remains placeholder
**Reason**: Replaced by the real links pane: the index has exposed backlinks and per-page outgoing references since scan-parse-index, so the panel renders live link rows for the open page (this change).

**Migration**: The links-pane requirements below (this capability) and the accordion requirement in `ui-shell` take over; placeholder copy remains only while no page is open (ui-shell requirement).

## ADDED Requirements

### Requirement: Links pane rows navigate to pages
The meta panel's Backlinks and Forwardlinks rows SHALL navigate: clicking a row opens the page it names, exactly like clicking a sidebar row, with the same active-row marking. Backlinks rows SHALL list the pages that reference the open page; Forwardlinks rows SHALL list the pages the open page references. A row targeting a page with no file on disk SHALL still navigate, opening the page as a blank in-memory page (see the unmaterialized-pages requirement).

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

### Requirement: A page with no file opens blank and materializes on first save
Navigating to a page that has no `.md` file on disk — through a links-pane row, a sidebar-like action, or a journal day — SHALL open a blank editable page that exists only in memory. Merely opening or viewing the page SHALL NOT create a file. The file SHALL be created on disk only when the user's edits are saved for the first time; reading the vault folder SHALL show no orphan files for pages merely viewed.

#### Scenario: Viewing a missing page creates nothing
- **GIVEN** a vault with no `Missing.md`
- **WHEN** the user opens the blank `Missing` page without typing
- **THEN** the vault folder contains no `Missing.md` and no other new file

#### Scenario: First save materializes the file
- **GIVEN** a blank unmaterialized page open for `Missing`
- **WHEN** the user types content and the save completes
- **THEN** `Missing.md` exists in the vault folder containing exactly what was saved, and the page is no longer unmaterialized

#### Scenario: A save indicator distinguishes a brand-new page
- **GIVEN** a blank unmaterialized page is open
- **WHEN** it has unsaved content
- **THEN** the save indicator reads as a new page being created, not as a pending edit to an existing file