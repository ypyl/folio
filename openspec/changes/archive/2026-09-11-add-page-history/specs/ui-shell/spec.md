## RENAMED Requirements

- FROM: `### Requirement: Sidebar is an accordion of Journal and Pages sections`
- TO: `### Requirement: Sidebar is an accordion of Journal, Pages, and History sections`

## MODIFIED Requirements

### Requirement: Sidebar is an accordion of Journal, Pages, and History sections

The sidebar SHALL contain exactly three collapsible sections — Journal, then Pages, then History — with no other sections, controls, or buttons above, between, or below them. All three sections SHALL support independent open/close (one section's state does not affect the others), open by default, and expand/collapse without page reloads or JavaScript manipulation of document state. The History section's contents and behavior are specified by the page-history capability. There SHALL be no Tags section and no New Page button.

#### Scenario: Sections open and close independently

- **WHEN** the user collapses the Pages section while Journal is open
- **THEN** Pages collapses and Journal remains open

#### Scenario: The Journal section leads the sidebar

- **WHEN** the shell renders
- **THEN** the first element of the sidebar is the Journal section, and no button or other control precedes the accordion

#### Scenario: The History section follows the Pages section

- **WHEN** the shell renders
- **THEN** the sidebar's sections are Journal, then Pages, then History, and no section or control follows History

### Requirement: Panes show loading placeholders while the index builds

While the active folder's index is being built — when a folder is first opened, when the user switches to another listed folder, and when a stored folder's permission is re-granted — the shell SHALL show loading placeholders in the panes whose content derives from the index, replacing the empty content those panes would otherwise show. The editor pane SHALL show placeholder body lines in place of its notes hint, the sidebar SHALL show placeholder rows in place of the Journal and Pages listings, and the meta panel SHALL show placeholder rows in its Backlinks and Forwardlinks sections in place of their placeholder copy. The History section SHALL NOT show placeholder rows: nothing can have been opened while the index builds, so it shows its empty state throughout. The loading state SHALL be announced to assistive technology as an in-progress status labeled "Indexing notes…" in the status bar, and the placeholder blocks themselves SHALL be purely decorative. The loading state SHALL end when the active folder's index resolves, at which point the panes SHALL render the folder's real content and all post-index behavior is unchanged: the today journal opens in the editor, the sidebar lists the folder's pages, and search enables. While no folder is active, the shell SHALL show the brand empty state, never loading placeholders.

#### Scenario: Opening a folder shows loading placeholders

- **WHEN** a folder whose index takes measurable time to build is opened
- **THEN** the editor pane, sidebar, and meta panel show loading placeholders instead of empty content, and they keep showing them until the index resolves

#### Scenario: The meta panel shows loading placeholders

- **WHEN** the active folder's index is building and no page is open
- **THEN** the Backlinks and Forwardlinks sections show placeholder rows instead of their placeholder copy

#### Scenario: The History section shows no placeholders

- **WHEN** the active folder's index is building
- **THEN** the Journal and Pages sections show placeholder rows, and the History section shows its empty state with no placeholder rows

#### Scenario: Switching folders re-enters the loading state

- **WHEN** the user activates a second listed folder while one is open
- **THEN** the panes show loading placeholders while the new folder's index builds, and the placeholder content is replaced by the new folder's pages once the index resolves

#### Scenario: Loading ends with real content

- **WHEN** the active folder's index resolves after its loading state was showing
- **THEN** the placeholders are gone, the editor opens the folder's today journal, the sidebar lists the folder's pages, and search is enabled

#### Scenario: No placeholders while no folder is active

- **WHEN** no folder is active, including after the user returns home via the brand
- **THEN** the shell shows the brand empty state and no loading placeholders

#### Scenario: Loading placeholders are announced, not read as content

- **WHEN** the panes are showing loading placeholders
- **THEN** the status bar shows an in-progress status labeled "Indexing notes…", and the placeholder blocks themselves are not read as page or note content
