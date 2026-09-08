## REMOVED Requirements

### Requirement: The editor pane shows the open page's file path
**Reason**: Relocated — the file-path breadcrumb moves out of the editor pane into the app-level status bar so it is consistently visible outside the pane's scroll region and across all app states.
**Migration**: The status bar shows the open page's file path with the same content and non-interactive behavior; see the ADDED requirement "The status bar shows the open page's file path" and the ui-shell status-bar requirement.

### Requirement: The pane reports save state
**Reason**: Relocated — save-state reporting moves from the pane-bound floating indicator to the app-level status bar.
**Migration**: The status bar reports the open page's save state; see the ADDED requirement "The status bar reports the open page's save state" and the ui-shell status-bar requirement.

## ADDED Requirements

### Requirement: The status bar shows the open page's file path
An open page SHALL have its file path displayed in the status bar, rendered as a breadcrumb of non-interactive segments — `notes / Deep / 2026.md` — with the `.md` extension kept on the final segment. The breadcrumb SHALL be purely informational: its segments SHALL NOT be links, SHALL NOT navigate, and SHALL NOT copy anything. It SHALL display the page's path regardless of whether the file exists yet (a not-yet-created page shows the path its first save will create), and SHALL NOT indicate the file's existence, save state, or staleness. An empty page SHALL show the same breadcrumb. The breadcrumb SHALL appear only when a page is open; without a page — on empty, indexing, or search-results surfaces — the path group SHALL be empty.

#### Scenario: The file behind the title is shown in the status bar
- **GIVEN** the vault contains `notes/Deep/2026.md` whose content begins with a heading that differs from the file name
- **WHEN** the user opens that page
- **THEN** the status bar shows the breadcrumb `notes / Deep / 2026.md`

#### Scenario: A journal day shows its real file
- **WHEN** the user opens the journal day `journals/2026-09-08.md` from the calendar
- **THEN** the status bar shows `journals / 2026-09-08.md`, with the file name segment intact

#### Scenario: A root-level file shows a single segment
- **WHEN** the user opens a page at the vault root such as `todo.md`
- **THEN** the status bar shows the single segment `todo.md`

#### Scenario: A page with no file yet shows its would-be path
- **WHEN** the user opens a page that has no file on disk yet (for example, a day from the journal calendar that has never been written)
- **THEN** the status bar shows the path that page will be saved under

#### Scenario: The path group is empty without a page
- **WHEN** no page is open, the folder is still indexing, or the main area shows search results
- **THEN** the status bar's path group shows no breadcrumb

### Requirement: The status bar reports the open page's save state
The app SHALL surface the open page's save state in the status bar: no save status while the page is clean, "Unsaved changes" while the page has edits not yet saved, "Saving…" while a save is in flight, and "Save failed" when the latest save failed. The status SHALL remain visible at all times: the bar sits outside the pane's scroll region, so the save status never scrolls with the document.

#### Scenario: The save lifecycle shows through
- **WHEN** the user types, then pauses, and the save succeeds
- **THEN** the status bar shows "Unsaved changes", then "Saving…", then clears

#### Scenario: The save status never scrolls away
- **WHEN** the user scrolls a long open page while a save is in flight
- **THEN** the "Saving…" status stays visible in the status bar rather than scrolling with the document