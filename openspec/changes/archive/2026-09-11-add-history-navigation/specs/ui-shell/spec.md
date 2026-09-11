## ADDED Requirements

### Requirement: Sidebar is an accordion of Journal and Pages sections with a navigation control row

The sidebar SHALL contain a navigation control row followed by exactly two collapsible sections — Journal, then Pages — with no other sections, controls, or buttons between or below them. The control row SHALL hold the Back and Forward controls specified by page-history, SHALL precede both sections, and SHALL stay in place while the sidebar scrolls, so those controls remain reachable however long the page list grows. Both sections SHALL support independent open/close (one section's state does not affect the other), open by default, and expand/collapse without page reloads or JavaScript manipulation of document state. There SHALL be no Tags section, no New Page button, and no History section.

#### Scenario: Sections open and close independently

- **WHEN** the user collapses the Pages section while Journal is open
- **THEN** Pages collapses and Journal remains open

#### Scenario: The Journal section leads the sections

- **WHEN** the shell renders
- **THEN** the sidebar's sections are Journal, then Pages, with no section or control between them, and the navigation control row is the only element above Journal

#### Scenario: The controls stay in reach while the sidebar scrolls

- **GIVEN** a vault whose page list is long enough to make the sidebar scroll
- **WHEN** the user scrolls the sidebar to the end of the list
- **THEN** the Back and Forward controls remain visible at the sidebar's top

#### Scenario: The sidebar has no History section

- **WHEN** the shell renders
- **THEN** the sidebar holds no History section, and Back and Forward are the only presentation of the session trail

### Requirement: Panes show loading placeholders while the active folder's index builds

While the active folder's index is being built — when a folder is first opened, when the user switches to another listed folder, and when a stored folder's permission is re-granted — the shell SHALL show loading placeholders in the panes whose content derives from the index, replacing the empty content those panes would otherwise show. The editor pane SHALL show placeholder body lines in place of its notes hint, the sidebar SHALL show placeholder rows in place of the Journal and Pages listings, and the meta panel SHALL show placeholder rows in its Backlinks and Forwardlinks sections in place of their placeholder copy. The loading state SHALL be announced to assistive technology as an in-progress status labeled "Indexing notes…" in the status bar, and the placeholder blocks themselves SHALL be purely decorative. The loading state SHALL end when the active folder's index resolves, at which point the panes SHALL render the folder's real content and all post-index behavior is unchanged: the today journal opens in the editor, the sidebar lists the folder's pages, and search enables. While no folder is active, the shell SHALL show the brand empty state, never loading placeholders.

#### Scenario: Opening a folder shows loading placeholders

- **WHEN** a folder whose index takes measurable time to build is opened
- **THEN** the editor pane, sidebar, and meta panel show loading placeholders instead of empty content, and they keep showing them until the index resolves

#### Scenario: The meta panel shows loading placeholders

- **WHEN** the active folder's index is building and no page is open
- **THEN** the Backlinks and Forwardlinks sections show placeholder rows instead of their placeholder copy

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

## REMOVED Requirements

### Requirement: Sidebar is an accordion of Journal, Pages, and History sections

**Reason**: Replaced. The History section is removed (it could not be reached at vault scale, and the list that buried it was the sidebar's dominant rendering cost), and a navigation control row is added above the sections so the trail stays in reach. The scenario that required the Journal section to lead the sidebar with no control before it is retired with this requirement, because a control row now precedes it.

**Migration**: Nothing to migrate. Journal, Pages, and every interaction they carry behave exactly as before; the sidebar simply gains a control row above them and loses the History section.

### Requirement: Panes show loading placeholders while the index builds

**Reason**: Replaced by "Panes show loading placeholders while the active folder's index builds". That declaration is the same requirement without its History clause: the clause ("The History section SHALL NOT show placeholder rows") and its scenario described a section this change removes, and a requirement can only shed a scenario by being re-declared.

**Migration**: Nothing to migrate. Every other loading placeholder, its copy, its sizing, and the "Indexing notes…" status are unchanged.
