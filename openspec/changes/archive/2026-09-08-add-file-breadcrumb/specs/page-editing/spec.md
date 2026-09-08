## ADDED Requirements

### Requirement: The editor pane shows the open page's file path
An open page SHALL display its file path in the editor pane, above the document's content, rendered as a breadcrumb of non-interactive segments — `notes / Deep / 2026.md` — with the `.md` extension kept on the final segment. The breadcrumb SHALL be purely informational: its segments SHALL NOT be links, SHALL NOT navigate, and SHALL NOT copy anything. The breadcrumb SHALL remain visible at the top of the pane while the document scrolls. It SHALL display the page's path regardless of whether the file exists yet (a not-yet-created page shows the path its first save will create), and SHALL NOT indicate the file's existence, save state, or staleness. An empty page SHALL show the same breadcrumb. The breadcrumb SHALL appear only when a page is open; no breadcrumb SHALL be shown on empty, loading, or search-results surfaces.

#### Scenario: The file behind the title is shown
- **GIVEN** the vault contains `notes/Deep/2026.md` whose content begins with a heading that differs from the file name
- **WHEN** the user opens that page
- **THEN** the editor pane shows the breadcrumb `notes / Deep / 2026.md` above the document

#### Scenario: A journal day shows its real file
- **WHEN** the user opens the journal day `journals/2026-09-08.md` from the calendar
- **THEN** the breadcrumb shows `journals / 2026-09-08.md`, with the file name segment intact

#### Scenario: A root-level file shows a single segment
- **WHEN** the user opens a page at the vault root such as `todo.md`
- **THEN** the breadcrumb shows the single segment `todo.md`

#### Scenario: The breadcrumb stays while the document scrolls
- **WHEN** the user scrolls down a long open page
- **THEN** the breadcrumb remains visible at the top of the pane above the scrolled document

#### Scenario: A page with no file yet shows its would-be path
- **WHEN** the user opens a page that has no file on disk yet (for example, a day from the journal calendar that has never been written)
- **THEN** the breadcrumb shows the path that page will be saved under

#### Scenario: No breadcrumb without an open page
- **WHEN** no page is open, the folder is still indexing, or the main area shows search results
- **THEN** no breadcrumb is rendered