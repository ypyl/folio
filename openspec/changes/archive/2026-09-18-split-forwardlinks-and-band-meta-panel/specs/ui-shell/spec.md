## MODIFIED Requirements

### Requirement: Application renders the shell layout
Folio SHALL render a full-height shell: a header row above a four-pane workspace. The workspace SHALL consist of a fixed-width folder rail, a fixed-width left sidebar, a flexible center editor pane, and a fixed-width right meta panel. Pane dividers SHALL be hairline borders on flat surfaces, with no shadows or gradients. The shell itself SHALL NOT scroll, and no pane SHALL scroll the page: a pane whose content exceeds its height SHALL scroll within itself, and a pane MAY hold more than one scroll region — the sidebar's Pages and Assets sections and the meta panel's Backlinks, Forwardlinks, and References sections each scroll within their own body (the sidebar and meta-panel requirements). The header SHALL mirror the workspace's columns so its brand, search, and slot stay aligned with the panes beneath them.

#### Scenario: Shell fills the viewport
- **WHEN** the app loads
- **THEN** the shell spans the full viewport height and the four panes are visible side by side

#### Scenario: Long content scrolls within panes, not the page
- **WHEN** content in a pane exceeds that pane's height
- **THEN** it scrolls inside the body of whichever section holds it — in the sidebar or in the meta panel — and the shell layout stays fixed

#### Scenario: Header columns stay aligned to the panes
- **WHEN** the shell renders at desktop width
- **THEN** the brand sits over the rail and sidebar columns, the search input over the center pane's column, and the slot over the meta panel's column

### Requirement: Meta panel is an accordion of page metadata
The right meta panel SHALL contain the collapsible page-metadata sections Backlinks, Forwardlinks, and References, followed by the keyboard-shortcuts reference (the last-section requirement). Each section SHALL show placeholder copy while no page is open, and all three SHALL open and close independently. The three link sections SHALL share the panel's remaining height, each body scrolling within itself when its rows do not fit, and each SHALL keep a minimum height so a short window cannot collapse it to nothing; the panel itself SHALL scroll only as a fallback, when even those floors do not fit. Every section summary SHALL be rendered in every app state, and a collapsed section SHALL occupy exactly its summary row.

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
- **WHEN** no page is open
- **THEN** all three sections show their placeholder copy

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

### Requirement: The right panel's last section is a keyboard-shortcuts reference
The right meta panel SHALL hold the keyboard-shortcuts reference as its last collapsible section, after the page-metadata sections. The section SHALL be collapsed by default and its summary SHALL read "Keyboard shortcuts". While collapsed, the section's summary SHALL sit at the panel's bottom edge, below the page-metadata sections, whatever their open/closed state. Opening it SHALL expand the reference in place, growing upward from the panel's bottom edge: the reference SHALL NOT introduce a scrolling area or a height cap of its own, and the panel SHALL gain no scroll region beyond the fallback the meta-panel requirement specifies. Opening it SHALL list the app's keyboard shortcuts: the editor's formatting and editing shortcuts (bold, italic, inline code, undo, redo, heading levels one through six, paragraph, ordered and bullet lists, blockquote, code block, indent and outdent, line break) and the app's search shortcut. The section SHALL list only shortcuts the app actually provides, and SHALL show each as a readable label with its key combination rendered as key tokens; heading levels one through six SHALL each be listed with their own entry showing that level's own key combination rather than a single key-range entry. The section SHALL be present and openable in every app state — with a vault open, while the index builds, on search-results surfaces, and on the brand empty state. The panel SHALL carry an accessible name that describes the whole panel, not only its link sections. Opening or closing the reference SHALL NOT change the open page, the search surface, or the open/closed state of the Backlinks, Forwardlinks, and References sections. Because the reference is a disclosure rather than a modal surface, opening it SHALL NOT move keyboard focus, trap focus, or require a dismissal gesture; its summary SHALL be reachable and toggleable by keyboard like any other disclosure.

#### Scenario: The panel ends with the reference
- **WHEN** the shell renders with a vault open
- **THEN** the right panel's sections are Backlinks, then Forwardlinks, then References, then the collapsed "Keyboard shortcuts" row, and no section follows it

#### Scenario: The collapsed reference sits at the panel's bottom
- **WHEN** the reference is collapsed and the link sections are shorter than the panel
- **THEN** the reference row sits at the panel's bottom edge rather than directly beneath the last link section

#### Scenario: The collapsed reference stays at the panel's bottom while the panel scrolls
- **GIVEN** the link sections are long enough to fill the panel, and the panel is short enough that even their floors do not fit
- **WHEN** the user scrolls the panel
- **THEN** the collapsed reference row remains at the panel's bottom edge

#### Scenario: The open reference grows upward from the panel's bottom
- **WHEN** the user opens the reference while its row sits at the panel's bottom edge
- **THEN** the list expands upward from that edge, no scrolling area or height cap appears inside the reference, and the reference is the only part of the panel that grows

#### Scenario: The open reference stays fully reachable on a short window
- **GIVEN** the open reference is taller than the panel
- **WHEN** the user scrolls the panel
- **THEN** the whole list is reachable, the panel's own scrollbar is the fallback that carries it, and no part of it is clipped or hidden behind the row

#### Scenario: The reference is collapsed by default
- **WHEN** the shell renders
- **THEN** the keyboard-shortcuts section is collapsed and the panel shows only its summary row

#### Scenario: The reference lists only real shortcuts
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** it lists the editor's formatting and editing shortcuts and the app's search shortcut, and lists no shortcut for capabilities that provide none (such as links)

#### Scenario: Heading levels are covered as a single range
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** heading levels one through six are covered as one contiguous range of key combinations, listed with one entry per level and each entry showing that level's own combination

#### Scenario: The reference is reachable in every app state
- **GIVEN** the app on the brand empty state with no vault open
- **WHEN** the shell renders
- **THEN** the right panel's keyboard-shortcuts section is present and opens

#### Scenario: Opening the reference disturbs nothing
- **GIVEN** a page is open and the Backlinks and Forwardlinks sections are open
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** the open page is unchanged, the search surface is unchanged, and Backlinks, Forwardlinks, and References keep their open/closed state

#### Scenario: The reference is a disclosure, not a modal surface
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** keyboard focus stays wherever the user left it, focus is not trapped, and no dismissal gesture is required to keep working

#### Scenario: The reference toggles by keyboard
- **WHEN** the user reaches the keyboard-shortcuts summary with the keyboard and activates it
- **THEN** the summary shows visible keyboard focus and the section opens and closes

### Requirement: Panes show loading placeholders while the active folder's index builds

While the active folder's index is being built — when a folder is first opened, when the user switches to another listed folder, and when a stored folder's permission is re-granted — the shell SHALL show loading placeholders in the panes whose content derives from the index, replacing the empty content those panes would otherwise show. The editor pane SHALL show placeholder body lines in place of its notes hint, the sidebar SHALL show placeholder blocks in place of the Journal calendar, the Pages listing, and the Assets listing, and the meta panel SHALL show placeholder rows in its Backlinks, Forwardlinks, and References sections in place of their placeholder copy. The loading state SHALL be announced to assistive technology as an in-progress status labeled "Indexing notes…" in the status bar, and the placeholder blocks themselves SHALL be purely decorative. The loading state SHALL end when the active folder's index resolves, at which point the panes SHALL render the folder's real content and all post-index behavior is unchanged: the today journal opens in the editor, the sidebar lists the folder's pages and assets, and search enables. While no folder is active, the shell SHALL show the brand empty state, never loading placeholders.

#### Scenario: Opening a folder shows loading placeholders

- **WHEN** a folder whose index takes measurable time to build is opened
- **THEN** the editor pane, sidebar, and meta panel show loading placeholders instead of empty content, and they keep showing them until the index resolves

#### Scenario: The sidebar's listings show loading placeholders

- **WHEN** the active folder's index is building
- **THEN** the sidebar's Journal calendar, Pages listing, and Assets listing show placeholder blocks in place of their content and rows

#### Scenario: The meta panel shows loading placeholders

- **WHEN** the active folder's index is building and no page is open
- **THEN** the Backlinks, Forwardlinks, and References sections show placeholder rows instead of their placeholder copy

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
