## MODIFIED Requirements

### Requirement: A page with no file opens blank and materializes on first save
Navigating to a page that has no `.md` file on disk — through a links-pane row, a sidebar-like action, or a journal day — SHALL open a blank editable page that exists only in memory. Merely opening or viewing the page SHALL NOT create a file. The file SHALL be created on disk only when the user's edits are saved for the first time; reading the vault folder SHALL show no orphan files for pages merely viewed. Pages materialize under `pages/` (e.g., `pages/Missing.md`); journals materialize under `journals/`.

#### Scenario: Viewing a missing page creates nothing
- **GIVEN** a vault with no `pages/Missing.md`
- **WHEN** the user opens the blank `Missing` page without typing
- **THEN** the vault folder contains no `pages/Missing.md` and no other new file

#### Scenario: First save materializes the file
- **GIVEN** a blank unmaterialized page open for `Missing`
- **WHEN** the user types content and the save completes
- **THEN** `pages/Missing.md` exists in the vault folder containing exactly what was saved, and the page is no longer unmaterialized

#### Scenario: A save indicator distinguishes a brand-new page
- **GIVEN** a blank unmaterialized page is open
- **WHEN** it has unsaved content
- **THEN** the save indicator reads as a new page being created, not as a pending edit to an existing file
