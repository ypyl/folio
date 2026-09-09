# static-navigation Specification

## Purpose

Let a user navigate Folio's notes: the sidebar lists the open vault's pages and journal entries, and selecting one renders it in the editor pane.

## Requirements

### Requirement: Sidebar lists pages and journal entries from the open vault
When a vault folder is open, the sidebar SHALL list that vault's pages in the Pages section as selectable rows, and SHALL render the open vault's journal entries in the Journal section as a calendar. The rows and calendar SHALL come from the active folder's index, not from sample data. Both sections SHALL retain independent open/close behavior. Within the Pages section, pinned pages (see pinned-pages) SHALL be listed first in pin order — most recently pinned first — followed by the remaining pages in descending order of last-modified time (see vault-index); pages with equal last-modified time SHALL be ordered by path for a stable listing.

#### Scenario: Pages section lists vault pages
- **WHEN** a vault folder is open
- **THEN** the Pages section shows a row for each page in that folder's index

#### Scenario: Journal section lists vault journal entries
- **WHEN** a vault folder is open
- **THEN** the Journal section shows the journal calendar, and the days that have a journal entry in that folder's index are marked in the grid

#### Scenario: Pinned pages lead the Pages section
- **GIVEN** a vault where `Vision.md` is pinned and `Ideas.md`, `Log.md` are unpinned, and `Ideas.md` was edited most recently
- **WHEN** the Pages section renders
- **THEN** `Vision.md` is the first row (pinned, with its star), then `Ideas.md` (edited most recently), then `Log.md`

#### Scenario: Unpinning moves a page into edit order
- **GIVEN** pinned `Vision.md` and unpinned pages `Ideas.md`, `Log.md`
- **WHEN** `Vision.md` is unpinned and `Ideas.md` was edited most recently
- **THEN** the Pages section shows `Ideas.md`, `Log.md`, `Vision.md` in that order, all unpinned
### Requirement: Selecting a row opens the page in the editor pane
Selecting a page row or a calendar day SHALL replace the editor pane's content with that page or day's rendered content, and SHALL mark the selected item as the active item in the sidebar. A calendar day without a file on disk SHALL still open, as a blank in-memory page whose file materializes on first save (see the unmaterialized-pages requirement).

#### Scenario: Clicking a page row swaps the editor content
- **WHEN** the user clicks a page row in the sidebar
- **THEN** the editor pane shows that page's title and content, and the clicked row is marked active

#### Scenario: Clicking a journal entry opens it like a page
- **WHEN** the user clicks a calendar day in the Journal section
- **THEN** the editor pane shows that day's page (its file's content, or a blank page when the day has no file), and the active marking moves to that day

#### Scenario: Selecting a different row replaces the current one
- **WHEN** the user clicks a second row while one is already open
- **THEN** the editor pane shows the second row's content and only the second row is marked active
### Requirement: App loads to today's journal when a vault is open
On load with a vault folder open and its index ready, the app SHALL open that folder's today journal note — `journals/YYYY-MM-DD.md` for the current local date — in the editor pane, and the sidebar SHALL mark that day as the active item. A day without a file on disk SHALL open as a blank in-memory page; merely opening SHALL NOT create a file, and the file SHALL materialize on the first save (see the unmaterialized-pages requirement). When no folder is open, the editor pane SHALL show the brand empty state instead.

#### Scenario: Loads to today's journal with a vault open
- **GIVEN** a vault folder is open and its index is ready
- **WHEN** the app loads
- **THEN** the editor pane shows today's journal note — its file's content when a file exists, or a blank page when none does — and today's cell in the journal calendar is marked active

#### Scenario: Opening today's note creates nothing
- **GIVEN** a vault folder is open and no journal file exists for today
- **WHEN** the app loads and the user does not type
- **THEN** the vault folder contains no new file and the editor pane shows a blank page for today

#### Scenario: Loading with no folder keeps the empty state
- **WHEN** the app loads with no vault folder open
- **THEN** the editor pane shows the brand empty state and no sidebar item is marked active

### Requirement: No-folder state invites opening a folder
When no vault folder is open, the sidebar SHALL render its Journal and Pages sections empty, and the editor pane SHALL show an empty state inviting the user to open a folder.

#### Scenario: Before any folder is opened
- **WHEN** the app loads and no folder has been opened or granted
- **THEN** the Journal and Pages sections show no rows and the editor pane says "Open a folder to begin."

#### Scenario: Folder permission is not currently granted
- **WHEN** the user has stored folders but none is currently active or writable
- **THEN** the sidebar shows no rows and the editor pane shows the open-a-folder empty state

### Requirement: Open page renders title and content
When a page is open, the editor pane SHALL show the page's content in an editable WYSIWYG Markdown surface: ATX headings, paragraphs, and page references in Folio's two forms — `#word` and `#[[Page]]` — appear as plain editable text, not as chips. The pane SHALL NOT render the page title (its filename stem) as a heading; whatever title-like heading the user sees comes from the file's own content. References SHALL NOT navigate or respond to clicks. Plain `[[Page]]` wikilinks are not a reference form and SHALL render as literal editable text.

#### Scenario: Page renders title and markdown body
- **WHEN** a page is open in the editor pane
- **THEN** the pane shows only the editable WYSIWYG body containing the page's Markdown, with no title heading rendered by the pane itself

#### Scenario: Reference chips are inert
- **WHEN** the open page's body contains `#word` or `#[[Page]]`
- **THEN** it appears as plain editable text that neither navigates nor responds to clicks, and no chip is rendered

#### Scenario: Plain wikilink renders as text
- **WHEN** the open page's body contains a plain `[[Page]]` wikilink
- **THEN** it appears as literal text, not as a chip

### Requirement: The editor surface fills the pane's width
The editor pane SHALL let the editor surface use the pane's full width: the content column SHALL NOT be capped to a fixed measure, only padded at the pane's edges. The pane itself continues to take all available space in the workspace layout.

#### Scenario: A wide window fills the editor surface
- **WHEN** the window is wider than the editor pane's old fixed measure
- **THEN** the editor surface spans the full width of the pane, bounded only by the pane's edge padding

### Requirement: The pane uses compact top padding above the content
The pane's content column SHALL start near the pane's top edge: its top padding SHALL be half the side padding, so the editor surface is not pushed down by space once reserved for a title heading.

#### Scenario: An open page starts near the pane's top
- **WHEN** a page is open in the editor pane
- **THEN** the editable content begins at the compact top padding, and the side and bottom padding remain unchanged

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
