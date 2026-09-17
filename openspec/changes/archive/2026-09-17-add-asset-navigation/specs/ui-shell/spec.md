## RENAMED Requirements

- FROM: `### Requirement: Sidebar is an accordion of Journal and Pages sections with a navigation control row`
- TO: `### Requirement: Sidebar is an accordion of Journal, Pages, and Assets sections with a navigation control row`

## MODIFIED Requirements

### Requirement: Application renders the shell layout
Folio SHALL render a full-height shell: a header row above a four-pane workspace. The workspace SHALL consist of a fixed-width folder rail, a fixed-width left sidebar, a flexible center editor pane, and a fixed-width right meta panel. Pane dividers SHALL be hairline borders on flat surfaces, with no shadows or gradients. The shell itself SHALL NOT scroll, and no pane SHALL scroll the page: a pane whose content exceeds its height SHALL scroll within itself, and a pane MAY hold more than one scroll region — the sidebar's Pages and Assets sections each scroll within their own body (the sidebar requirement). The header SHALL mirror the workspace's columns so its brand, search, and slot stay aligned with the panes beneath them.

#### Scenario: Shell fills the viewport
- **WHEN** the app loads
- **THEN** the shell spans the full viewport height and the four panes are visible side by side

#### Scenario: Long content scrolls within panes, not the page
- **WHEN** content in any pane exceeds that pane's height
- **THEN** the overflowing pane scrolls within itself — the sidebar through the body of whichever section holds the long content — and the shell layout remains fixed

#### Scenario: Header columns stay aligned to the panes
- **WHEN** the shell renders at desktop width
- **THEN** the brand sits over the rail and sidebar columns, the search input over the center pane's column, and the slot over the meta panel's column

### Requirement: Sidebar is an accordion of Journal, Pages, and Assets sections with a navigation control row

The sidebar SHALL contain a navigation control row followed by exactly three collapsible sections — Journal, then Pages, then Assets — with no other sections, controls, or buttons between them. The control row SHALL hold the Back and Forward controls specified by page-history and a Today control, SHALL precede all three sections, and SHALL be a fixed band at the sidebar's top, so those controls remain in reach however long any listing grows. Every section's summary row SHALL be rendered in every app state — open or collapsed, and with or without a vault — and SHALL be all a collapsed section occupies. The Journal section SHALL size to its content and SHALL NOT scroll internally; the Pages and Assets sections SHALL share the sidebar's remaining height, each body scrolling within itself, and the Pages body SHALL keep a minimum height so a short window cannot collapse it to nothing. The Assets section's listing and behavior are specified by the vault-assets capability.

Activating Today SHALL open the current day's journal — `journals/YYYY-MM-DD.md` for the current local date — exactly as selecting a calendar day does: the file's content when it exists, otherwise a blank in-memory page that materializes on first save and creates nothing on open. Today SHALL be rendered in every app state, and SHALL be disabled while no vault is usable (no folder open, or the active folder's index still building), matching Back and Forward's treatment when they have nowhere to step. Today SHALL NOT be tied to the Journal section's open/closed state: collapsing Journal SHALL leave the control in the row. All three sections SHALL support independent open/close (one section's state does not affect the others) and expand/collapse without page reloads or JavaScript manipulation of document state. Journal and Pages SHALL be open by default; Assets SHALL be collapsed by default. There SHALL be no Tags section, no New Page button, and no History section.

#### Scenario: Sections open and close independently

- **WHEN** the user collapses the Pages section while Journal is open
- **THEN** Pages collapses and Journal remains open

#### Scenario: The Journal section leads the sections

- **WHEN** the shell renders
- **THEN** the sidebar's sections are Journal, then Pages, then Assets, with no section or control between them, and the navigation control row is the only element above Journal

#### Scenario: Every section summary is always rendered

- **WHEN** the user collapses Pages and Assets
- **THEN** both summaries remain in the document in order, each occupying one row, with Journal above them

#### Scenario: The controls stay in reach while the sidebar scrolls

- **GIVEN** a vault whose page list is longer than the sidebar can show
- **WHEN** the user scrolls the Pages listing to its end
- **THEN** the Back, Forward, and Today controls remain visible at the sidebar's top, and the Pages and Assets summaries stay in place

#### Scenario: A collapsed section leaves the others their height

- **WHEN** the user collapses the Assets section
- **THEN** the Pages body expands to use the space the Assets body gave up

#### Scenario: Today is unavailable without a usable vault

- **WHEN** no folder is open, or the active folder's index is still building
- **THEN** the Today control is rendered but disabled, and activating it does nothing

#### Scenario: Today survives collapsing the Journal section

- **WHEN** the user collapses the Journal section
- **THEN** the Today control stays in the navigation control row and still opens the current day's journal

#### Scenario: The sidebar has no History section

- **WHEN** the shell renders
- **THEN** the sidebar holds no History section, and Back and Forward are the only presentation of the session trail

### Requirement: Meta panel is an accordion of page metadata
The right meta panel SHALL contain the collapsible page-metadata sections Backlinks and Forwardlinks. Each section SHALL show placeholder copy while no page is open, and both SHALL open and close independently. When a page is open, each section SHALL list its rows instead of placeholder copy: Backlinks lists every page that references the open page, and Forwardlinks lists every page the open page references together with every asset it references (vault-assets capability), all alphabetically by row label. A section with no matching rows SHALL show empty-state copy. Rows SHALL use the sidebar's row styling and `aria-current` marking for the open page; page rows that target a page with no file on disk SHALL be visually dimmed to signal the page is not yet created, and remain clickable. Asset rows SHALL NOT be dimmed, because a row exists only for a file the vault holds. Clicking a page row navigates and clicking an asset row opens the file (static-navigation and vault-assets requirements).

#### Scenario: Meta sections are independently collapsible
- **WHEN** the user collapses Backlinks while Forwardlinks is open
- **THEN** Backlinks collapses and Forwardlinks remains open

#### Scenario: Backlinks list the open page's referrers
- **GIVEN** `Topic.md` is open and referenced by `Ideas.md` and `Log.md`
- **WHEN** the user looks at the Backlinks section
- **THEN** the section lists `Ideas` and `Log` rows, alphabetically

#### Scenario: Forwardlinks list the open page's targets
- **GIVEN** an open page whose content references `Roadmap` and the journal day `2026-09-06`
- **WHEN** the user looks at the Forwardlinks section
- **THEN** the section lists `Roadmap` and `2026-09-06` rows, alphabetically, whether or not each target's file exists

#### Scenario: Forwardlinks sort page and asset rows together
- **GIVEN** an open page whose content references `Roadmap` and `assets/q3-report.pdf`
- **WHEN** the user looks at the Forwardlinks section
- **THEN** the section lists the `q3-report.pdf` row then the `Roadmap` row, in one alphabetical order

#### Scenario: Empty sections show copy instead of rows
- **GIVEN** an open page that no page references
- **WHEN** the user looks at the Backlinks section
- **THEN** the section shows empty-state copy ("Nothing links here yet."), not placeholder copy and no rows

#### Scenario: Unmaterialized targets are dimmed but clickable
- **GIVEN** an open page whose content references `Missing`, and no `Missing.md` exists
- **WHEN** the user looks at the Forwardlinks section
- **THEN** the `Missing` row is rendered dimmed, still clickable, and still navigates

#### Scenario: Placeholders persist only before a page opens
- **WHEN** no page is open
- **THEN** both sections show their placeholder copy

### Requirement: Panes show loading placeholders while the active folder's index builds

While the active folder's index is being built — when a folder is first opened, when the user switches to another listed folder, and when a stored folder's permission is re-granted — the shell SHALL show loading placeholders in the panes whose content derives from the index, replacing the empty content those panes would otherwise show. The editor pane SHALL show placeholder body lines in place of its notes hint, the sidebar SHALL show placeholder blocks in place of the Journal calendar, the Pages listing, and the Assets listing, and the meta panel SHALL show placeholder rows in its Backlinks and Forwardlinks sections in place of their placeholder copy. The loading state SHALL be announced to assistive technology as an in-progress status labeled "Indexing notes…" in the status bar, and the placeholder blocks themselves SHALL be purely decorative. The loading state SHALL end when the active folder's index resolves, at which point the panes SHALL render the folder's real content and all post-index behavior is unchanged: the today journal opens in the editor, the sidebar lists the folder's pages and assets, and search enables. While no folder is active, the shell SHALL show the brand empty state, never loading placeholders.

#### Scenario: Opening a folder shows loading placeholders

- **WHEN** a folder whose index takes measurable time to build is opened
- **THEN** the editor pane, sidebar, and meta panel show loading placeholders instead of empty content, and they keep showing them until the index resolves

#### Scenario: The sidebar's listings show loading placeholders

- **WHEN** the active folder's index is building
- **THEN** the sidebar's Journal calendar, Pages listing, and Assets listing show placeholder blocks in place of their content and rows

#### Scenario: The meta panel shows loading placeholders

- **WHEN** the active folder's index is building and no page is open
- **THEN** the Backlinks and Forwardlinks sections show placeholder rows instead of their placeholder copy

#### Scenario: Switching folders re-enters the loading state

- **WHEN** the user activates a second listed folder while one is open
- **THEN** the panes show loading placeholders while the new folder's index builds, and the placeholder content is replaced by the new folder's pages once the index resolves

#### Scenario: Loading ends with real content

- **WHEN** the active folder's index resolves after its loading state was showing
- **THEN** the placeholders are gone, the editor opens the folder's today journal, the sidebar lists the folder's pages and assets, and search is enabled

#### Scenario: No placeholders while no folder is active

- **WHEN** no folder is active, including after the user returns home via the brand
- **THEN** the shell shows the brand empty state and no loading placeholders

#### Scenario: Loading placeholders are announced, not read as content

- **WHEN** the panes are showing loading placeholders
- **THEN** the status bar shows an in-progress status labeled "Indexing notes…", and the placeholder blocks themselves are not read as page or note content
