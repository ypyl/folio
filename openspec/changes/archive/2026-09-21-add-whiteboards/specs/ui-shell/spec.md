## MODIFIED Requirements

### Requirement: Sidebar is an accordion of Journal, Pages, and Assets sections with a navigation control row

The sidebar SHALL contain a navigation control row followed by exactly four collapsible sections — Journal, then Pages, then Boards, then Assets — with no other sections, controls, or buttons between them. The control row SHALL hold the Back and Forward controls specified by page-history and a Today control, SHALL precede all four sections, and SHALL be a fixed band at the sidebar's top, so those controls remain in reach however long any listing grows. Every section's summary row SHALL be rendered in every app state — open or collapsed, and with or without a vault — and SHALL be all a collapsed section occupies. The Journal section SHALL size to its content and SHALL NOT scroll internally; the Pages, Boards, and Assets sections SHALL share the sidebar's remaining height, each body scrolling within itself, and the Pages body SHALL keep a minimum height so a short window cannot collapse it to nothing. The Boards section's listing and behavior are specified by the whiteboards capability, and the Assets section's by the vault-assets capability.

Activating Today SHALL open the current day's journal — `journals/YYYY-MM-DD.md` for the current local date — exactly as selecting a calendar day does: the file's content when it exists, otherwise a blank in-memory page that materializes on first save and creates nothing on open. Today SHALL be rendered in every app state, and SHALL be disabled while no vault is usable (no folder open, or the active folder's index still building), matching Back and Forward's treatment when they have nowhere to step. Today SHALL NOT be tied to the Journal section's open/closed state: collapsing Journal SHALL leave the control in the row. All four sections SHALL support independent open/close (one section's state does not affect the others) and expand/collapse without page reloads or JavaScript manipulation of document state. Journal and Pages SHALL be open by default; Boards and Assets SHALL be collapsed by default. There SHALL be no Tags section, no New Page button, and no History section.

#### Scenario: Sections open and close independently

- **WHEN** the user collapses the Pages section while Journal is open
- **THEN** Pages collapses and Journal remains open

#### Scenario: The Journal section leads the sections

- **WHEN** the shell renders
- **THEN** the sidebar's sections are Journal, then Pages, then Boards, then Assets, with no section or control between them, and the navigation control row is the only element above Journal

#### Scenario: Every section summary is always rendered

- **WHEN** the user collapses Boards and Assets
- **THEN** both summaries remain in the document in order, each occupying one row, with Journal above them

#### Scenario: The controls stay in reach while the sidebar scrolls

- **GIVEN** a vault whose page list is longer than the sidebar can show
- **WHEN** the user scrolls the Pages listing to its end
- **THEN** the Back, Forward, and Today controls remain visible at the sidebar's top, and the Pages, Boards, and Assets summaries stay in place

#### Scenario: A collapsed section leaves the others their height

- **WHEN** the user collapses the Assets section
- **THEN** the sections above it expand to use the space the Assets body gave up

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

The right meta panel SHALL contain the collapsible page-metadata sections Backlinks, Forwardlinks, and References, followed by the keyboard-shortcuts reference (the last-section requirement). Each section SHALL show placeholder copy while no page is open and no board is open; while a board is open it SHALL show the board's Referenced by section instead of the page-metadata sections (whiteboards capability). All three page section SHALL open and close independently. The three link sections SHALL share the panel's remaining height, each body scrolling within itself when its rows do not fit, and each SHALL keep a minimum height so a short window cannot collapse it to nothing; the panel itself SHALL scroll only as a fallback, when even those floors do not fit. Every section summary SHALL be rendered in every app state, and a collapsed section SHALL occupy exactly its summary row.

When a page is open, each section SHALL list its rows instead of placeholder copy: Backlinks lists every page that references the open page, Forwardlinks lists every page the open page references, and References lists every asset the open page references (vault-assets capability), each alphabetically by row label. A section with no matching rows SHALL show empty-state copy. Backlinks and Forwardlinks SHALL be open by default; References SHALL be collapsed by default. Rows SHALL use the sidebar's row styling and `aria-current` marking for the open page; page rows that target a page with no file on disk SHALL be visually dimmed to signal the page is not yet created, and remain clickable. Asset rows SHALL NOT be dimmed, because a row exists only for a file the vault holds. Clicking a page row navigates and clicking an asset row opens the file (static-navigation and vault-assets requirements).

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
- **WHEN** the user looks at the panel
- **THEN** Forwardlinks lists the `Roadmap` row and no asset row, References lists the `q3-report.pdf` row, and each section is ordered by its own row labels

#### Scenario: References lists the open page's files
- **GIVEN** an open page whose content embeds `assets/shot.png` and links `assets/q3-report.pdf`
- **WHEN** the user looks at the References section
- **THEN** it lists `q3-report.pdf` and `shot.png` rows, alphabetically, and no page row

#### Scenario: References is collapsed by default
- **WHEN** the shell renders with a page open
- **THEN** the References section shows only its summary row, and Backlinks and Forwardlinks are open

#### Scenario: Empty sections show copy instead of rows
- **GIVEN** an open page that no page references
- **WHEN** the user looks at the Backlinks section
- **THEN** the section shows empty-state copy ("Nothing links here yet."), not placeholder copy and no rows

#### Scenario: An open page with no files shows copy in References
- **GIVEN** an open page that references pages but no vault files
- **WHEN** the user opens the References section
- **THEN** it shows an empty-state message rather than rows

#### Scenario: Unmaterialized targets are dimmed but clickable
- **GIVEN** an open page whose content references `Missing`, and no `Missing.md` exists
- **WHEN** the user looks at the Forwardlinks section
- **THEN** the `Missing` row is rendered dimmed, still clickable, and still navigates

#### Scenario: An asset row is never dimmed
- **GIVEN** an open page whose References section lists `q3-report.pdf`
- **WHEN** the user looks at that row
- **THEN** it renders undimmed and opens the file when activated

#### Scenario: Placeholders persist only before a page opens
- **WHEN** no page is open and no board is open
- **THEN** all three sections show their placeholder copy

#### Scenario: A board replaces the page sections with Referenced by
- **GIVEN** a board is open
- **WHEN** the user looks at the meta panel
- **THEN** the panel shows the board's Referenced by section rather than the Backlinks, Forwardlinks, and References rows

#### Scenario: A long section scrolls inside itself
- **GIVEN** an open page with more backlinks than the panel can show
- **WHEN** the user scrolls the Backlinks listing to its end
- **THEN** only the Backlinks body scrolls, the panel itself does not scroll, and the Backlinks, Forwardlinks, and References summaries stay where they were

#### Scenario: The sections share the panel's height
- **WHEN** the user opens the References section
- **THEN** the three link sections divide the panel's remaining height, each scrolling within its own body, and no listing is pushed out of reach

#### Scenario: A collapsed section is one row
- **WHEN** the user collapses Forwardlinks
- **THEN** Forwardlinks occupies exactly its summary row and the height it gave up goes to the sections that remain open

#### Scenario: A short window cannot collapse a listing
- **GIVEN** a window too short to fit the three link sections at their minimum heights
- **WHEN** the panel lays out
- **THEN** each section keeps its minimum height and the panel itself scrolls, rather than a section being clipped to nothing

### Requirement: The shell shows an app-level status bar

The shell SHALL render a thin status bar as a full-width row below the workspace, present in every app state — with a vault open, while the index builds, on search-results surfaces, on an open board, and on the brand empty state. The bar SHALL hold the pin control in its leading column and three groups: the open document's file path as a breadcrumb (left, immediately after the leading column) — a page's, a journal day's, or a board's — a status group holding the save-state text and the indexing label (immediately after the breadcrumb), and the active vault's name and file count (right side). A group SHALL be empty when its content has no source: no page and no board open leaves the path group empty; a page or board with nothing to report leaves the status group empty; no active folder leaves the vault group empty. The bar SHALL sit outside all pane scroll regions — its content never scrolls, and the panes scroll independently beneath it — and SHALL use Kami tokens (stone 12px text, hairline top border, flat surfaces). The bar SHALL hold no action other than the pin control: it opens no picker, switches no folder, re-grants no permission, and navigates nowhere.

#### Scenario: The bar frames every app state
- **GIVEN** the app on the brand empty state with no vault open
- **WHEN** the shell renders
- **THEN** the status bar is present with all three groups empty and no content beyond the pin control

#### Scenario: An open page fills the path group
- **WHEN** the user opens a page
- **THEN** the status bar's path group shows the page's file-path breadcrumb

#### Scenario: An open board fills the path group
- **WHEN** the user opens a board
- **THEN** the status bar's path group shows the board's file-path breadcrumb and the status group reflects the board's save state

#### Scenario: The indexing label shows in the bar
- **WHEN** the active folder's index is building
- **THEN** the status bar shows the "Indexing notes…" status in the center group

#### Scenario: The bar performs no actions
- **WHEN** the user activates the breadcrumb segments, the status text, or the vault name in the status bar
- **THEN** nothing happens: no navigation, no picker, no folder switch, no permission re-grant

#### Scenario: The bar stays put while panes scroll
- **WHEN** the user scrolls a pane beneath the status bar
- **THEN** the bar and its content remain fixed at the shell's bottom
