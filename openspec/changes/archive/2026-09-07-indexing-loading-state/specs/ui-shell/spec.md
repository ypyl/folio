## ADDED Requirements

### Requirement: Panes show loading placeholders while the index builds
While the active folder's index is being built — when a folder is first opened, when the user switches to another listed folder, and when a stored folder's permission is re-granted — the shell SHALL show loading placeholders in the panes whose content derives from the index, replacing the empty content those panes would otherwise show. The editor pane SHALL show placeholder body lines in place of its notes hint, the sidebar SHALL show placeholder rows in place of the Journal and Pages listings, and the meta panel SHALL show placeholder rows in its Backlinks and Forwardlinks sections in place of their placeholder copy. The loading state SHALL be announced to assistive technology as an in-progress status labeled "Indexing notes…", and the placeholder blocks themselves SHALL be purely decorative. The loading state SHALL end when the active folder's index resolves, at which point the panes SHALL render the folder's real content and all post-index behavior is unchanged: the today journal opens in the editor, the sidebar lists the folder's pages, and search enables. While no folder is active, the shell SHALL show the brand empty state, never loading placeholders.

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
- **THEN** assistive technology is informed of an in-progress status labeled "Indexing notes…", and the placeholder blocks themselves are not read as page or note content