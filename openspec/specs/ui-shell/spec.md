# ui-shell Specification

## Purpose

The application shell: the Kami-styled header and three-pane layout that hosts all Folio features — sidebar accordion, editor area, and meta panel — plus the transient empty state shown before a vault is opened.

## Requirements

### Requirement: Application renders the shell layout
Folio SHALL render a full-height shell: a header row above a workspace of four panes plus two full-height collapse strips. The workspace SHALL consist of a fixed-width folder rail, a collapse strip, a left sidebar, a flexible center editor pane, a right meta panel, and a collapse strip, in that order from left to right. The folder rail SHALL be fixed-width and SHALL NOT be collapsible. The left sidebar and the right meta panel SHALL each be collapsible (the side-pane collapse requirement); while expanded they SHALL be fixed-width, and while collapsed they SHALL occupy no width, leaving their collapse strip in place. Pane dividers SHALL be hairline borders on flat surfaces, with no shadows or gradients. The shell itself SHALL NOT scroll, and no pane SHALL scroll the page: a pane whose content exceeds its height SHALL scroll within itself, and a pane MAY hold more than one scroll region — the sidebar's Pages and Assets sections and the meta panel's Backlinks, Forwardlinks, and References sections each scroll within their own body (the sidebar and meta-panel requirements). The header SHALL mirror the workspace's columns so its brand, search, and slot stay aligned with the panes beneath them, including while either side pane is collapsed.

#### Scenario: Shell fills the viewport
- **WHEN** the app loads
- **THEN** the shell spans the full viewport height, the four panes are visible side by side, and each collapse strip spans the workspace's full height

#### Scenario: Long content scrolls within panes, not the page
- **WHEN** content in a pane exceeds that pane's height
- **THEN** it scrolls inside the body of whichever section holds it — in the sidebar or in the meta panel — and the shell layout stays fixed

#### Scenario: Header columns stay aligned to the panes
- **WHEN** the shell renders at desktop width
- **THEN** the brand sits over the rail and sidebar columns, the search input over the center pane's column, and the slot over the meta panel's column

#### Scenario: The rail is never collapsed away
- **WHEN** either side pane is collapsed
- **THEN** the folder rail keeps its width and its contents stay in place

### Requirement: Side panes collapse to a thin full-height strip
The left sidebar and the right meta panel SHALL each be collapsible and expandable through a thin, vertical, full-height control strip on that pane's outer edge: the left strip SHALL sit between the folder rail and the left sidebar, and the right strip SHALL sit at the workspace's right edge beside the meta panel. Each strip SHALL be a button spanning the workspace's full height and SHALL show an arrow that points toward the pane's own outer edge while the pane is expanded and toward the editor pane while the pane is collapsed. Both panes SHALL start expanded on every load, and the collapsed/expanded state SHALL be session-only — held in memory, reset by a reload, and never written to the vault or any other storage. Collapsing a pane SHALL remove exactly that pane's width, which the flexible center editor pane SHALL take up, and SHALL leave the other panes, the header, the open page, the search surface, and the editor content unchanged. A collapsed pane's content SHALL not be rendered as visible or focusable. Each strip SHALL carry an accessible name naming the pane it controls and SHALL expose its expanded/collapsed state to assistive technology. Toggling SHALL be possible with a keyboard from the strip button, SHALL cause no navigation, and SHALL NOT require a reload.

#### Scenario: Both panes start expanded
- **WHEN** the app loads
- **THEN** the left sidebar and right meta panel are expanded and each strip's arrow points toward its pane's outer edge

#### Scenario: Collapsing the left sidebar gives the width to the editor
- **GIVEN** the left sidebar is expanded
- **WHEN** the user activates the left strip
- **THEN** the sidebar collapses to no width, the editor pane grows by the sidebar's width, and the strip remains in place with its arrow pointing toward the editor

#### Scenario: Collapsing the right meta panel gives the width to the editor
- **GIVEN** the meta panel is expanded
- **WHEN** the user activates the right strip
- **THEN** the meta panel collapses to no width, the editor pane grows by the panel's width, and the strip remains in place with its arrow pointing toward the editor

#### Scenario: The two panes collapse independently
- **WHEN** the user collapses the left sidebar while the meta panel is expanded
- **THEN** the sidebar collapses and the meta panel stays expanded

#### Scenario: The strips do not move between states
- **WHEN** the user collapses and expands either pane
- **THEN** each strip keeps the same position in the workspace it had before the toggle

#### Scenario: The header mirrors the collapse
- **GIVEN** the left sidebar is collapsed
- **WHEN** the shell renders
- **THEN** the header no longer reserves the sidebar's column and the search input stays centered over the editor pane's current column

#### Scenario: The collapse state resets on reload
- **GIVEN** the user has collapsed the left sidebar
- **WHEN** the app is reloaded
- **THEN** both panes are expanded again and no storage holds the previous state

#### Scenario: Collapsing changes nothing but the layout
- **GIVEN** a page is open with unsaved edits
- **WHEN** the user collapses the meta panel
- **THEN** the open page, the editor's content, and the search query are unchanged

#### Scenario: A collapsed pane leaves the tab order
- **GIVEN** the meta panel is collapsed
- **WHEN** the user moves focus with the keyboard
- **THEN** no control inside the collapsed panel receives focus

#### Scenario: The strip announces what it controls
- **WHEN** the user focuses a strip
- **THEN** it reports an accessible name naming its pane and exposes whether that pane is expanded or collapsed

### Requirement: UI draws exclusively from Kami tokens
All shell colors, surfaces, borders, and spacing SHALL use the Kami tokens defined in `DESIGN.md` — warm parchment surfaces, ink-blue as the only chromatic accent, warm grays only, 4px spacing base, 8px screen radius. Pure white, cool grays, and any second chromatic color SHALL NOT appear.

#### Scenario: No banned values in shipped styles
- **WHEN** the shipped stylesheet is inspected
- **THEN** no banned values are present (pure white as a surface, cool-blue grays, non-Kami chromatic colors) and every surface color referenced exists in the Kami token set

#### Scenario: Surfaces are flat
- **WHEN** the shell renders
- **THEN** panes and sections have no drop shadows or gradients; borders are 1px hairline `--border` values

### Requirement: The brand returns to the empty state
The Folio brand (the mark and title in the header's top-left) SHALL act as a home control: activating it SHALL make no folder active and show the empty state, leaving every listed folder on the rail. It SHALL work whether or not a folder is currently active, SHALL NOT close or forget any folder, and SHALL be a no-op when the empty state is already showing.

#### Scenario: Activating the brand returns home
- **GIVEN** an active folder with an open page
- **WHEN** the user activates the brand
- **THEN** no folder is active, the empty state shows, and the open page is no longer shown

#### Scenario: Activating the brand forgets nothing
- **GIVEN** one or more folders listed on the rail
- **WHEN** the user activates the brand
- **THEN** every listed folder remains listed and none is closed

#### Scenario: Activating the brand from the empty state is a no-op
- **GIVEN** the empty state is showing with no active folder
- **WHEN** the user activates the brand
- **THEN** the empty state remains showing and no folder becomes active

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

### Requirement: The keyboard-shortcuts reference covers leaving a code block
The keyboard-shortcuts reference SHALL cover leaving and removing a code block in addition to creating one: `Mod-Enter` (Cmd/Ctrl+Enter) to exit the block, and `Backspace` at the start of a one-line code block to turn it back into a paragraph. Each SHALL be listed as a readable label plus its key combination rendered as key tokens, matching the existing rows. Each label SHALL name the action, and a row's label and its key combination SHALL sit on one line at the panel's default width. The reference SHALL list each row only when the app actually provides that behavior. When the same chord means different things in different contexts, the reference SHALL list the chord under each action rather than hiding one.

#### Scenario: The reference lists how to leave a code block
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** it shows an "Exit code block" row with the `Mod-Enter` chord

#### Scenario: The reference lists how to turn a code block back into a paragraph
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** it shows a "Cancel code block" row with the `Backspace` key

#### Scenario: A context-dependent chord is listed under each action
- **WHEN** two different actions use the same chord in different contexts
- **THEN** the reference lists that chord under both actions

#### Scenario: Each row fits on one line
- **WHEN** the reference is open at the panel's default width
- **THEN** every row shows its label and its key tokens on a single line

### Requirement: The keyboard-shortcuts reference covers table editing

The keyboard-shortcuts reference SHALL cover editing a table: `Mod-Alt-t` (Cmd/Ctrl+Alt+T) to insert a table, `Mod-Alt-Enter` (Cmd/Ctrl+Alt+Enter) to add a row below the caret's row, `Mod-Alt-Shift-Enter` (Cmd/Ctrl+Alt+Shift+Enter) to add a column to the right of the caret's column, `Tab` and `Shift-Tab` to move to the next and previous cell, and `Enter` to leave the table. It SHALL also cover the operations that exist on a table's row and column handles: `Mod-Alt-l`, `Mod-Alt-m`, and `Mod-Alt-r` (Cmd/Ctrl+Alt+L, M, R) to align the caret's column to the left, the center, and the right, `Mod-Alt-d` (Cmd/Ctrl+Alt+D) to delete the caret's row, and `Mod-Alt-Shift-d` (Cmd/Ctrl+Alt+Shift+D) to delete the caret's column. Each SHALL be listed as a readable label plus its key combination rendered as key tokens, matching the existing rows, and each label SHALL name the action. Every one of these rows SHALL be a control that applies its combination, as the reference's other editor rows are, and activating it SHALL do to the open page exactly what pressing the combination does, including acting on the caret's row or column. Where a chord means different things in different contexts, the reference SHALL list the chord under each action rather than hiding one, so `Tab`, `Shift-Tab`, and `Enter` appear both for their text behavior and for their behavior inside a table. A row SHALL be listed only because the app provides that behavior.

#### Scenario: The reference lists how to create and extend a table

- **WHEN** the user opens the keyboard-shortcuts section of a vault with a page open
- **THEN** it lists inserting a table, adding a table row, adding a table column, aligning a column to the left, the center, and the right, deleting a row, deleting a column, moving to the next cell, moving to the previous cell, and leaving a table, each with its key combination rendered as key tokens and each row on one line

#### Scenario: A chord with two meanings is listed twice

- **WHEN** the user reads the reference's list
- **THEN** `Tab` and `Shift-Tab` appear both as moving between list-item levels and as moving between table cells, and `Enter` appears as leaving a table

#### Scenario: Applying the insert-table control creates a table

- **GIVEN** an open page with the caret in the editor
- **WHEN** the user activates the insert-table row's key combination
- **THEN** the page gains a table at the caret, exactly as pressing the combination would produce, and the page's saved Markdown holds a pipe table

### Requirement: Empty state is a transient brand screen
When no folder is active, the center pane SHALL show a brand screen: the FolioMark as a purely decorative element (`aria-hidden`) with a short tagline. Where the browser provides no local-folder picker, the screen SHALL state the browser requirement in place of the open-folder tagline — naming a Chromium-based browser (Chrome, Edge, or Brave) — because the open-folder instruction cannot be carried out there. This empty state SHALL be reachable at startup when no folder is stored, by activating the brand while folders are listed, and by closing the active folder. The screen SHALL contain no button that promises an action the app cannot perform; returning to a folder is done from the rail.

#### Scenario: Brand screen before a vault opens
- **WHEN** the app starts with no vault open
- **THEN** the center pane shows the FolioMark and a tagline, and no open-folder button or other interactive control is present

#### Scenario: Brand screen shows while folders are listed
- **GIVEN** one or more folders listed on the rail
- **WHEN** the user activates the brand to return home
- **THEN** the center pane shows the brand screen and every listed folder remains on the rail

#### Scenario: Brand screen names the browser requirement
- **GIVEN** a browser whose runtime provides no local-folder picker
- **WHEN** the app starts with no vault open
- **THEN** the center pane shows the FolioMark with the browser requirement naming a Chromium-based browser, and the open-folder tagline is not shown

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

### Requirement: All interactive elements show visible keyboard focus
Every interactive element in the shell SHALL show a visible focus indicator using the Kami focus treatment when focused via keyboard.

#### Scenario: Focus is visible and on-palette
- **WHEN** the user tabs through the shell's interactive elements
- **THEN** each element in focus shows a visible brand-colored focus outline

### Requirement: A folder rail lists opened folders and switches between them
The shell SHALL render a narrow folder rail as the leading workspace column. Where the browser provides the platform's local-folder picker, the rail SHALL show an add control; where it does not, the rail SHALL show no add control and the app SHALL NOT invoke the picker, with the brand screen stating the browser requirement instead (see the empty-state requirement). The rail SHALL show one entry per opened folder; the entry for the active folder SHALL be visually distinct. Activating a rail entry SHALL make that folder the active one, and when its stored permission is pending it SHALL request permission for that stored folder instead of opening the picker. Opening the same folder twice through the picker SHALL NOT add a second entry. Switching folders SHALL reset the open page to the newly active folder's today journal note — a blank in-memory page when no file exists yet, materializing on first save. The rail SHALL render no folder entries until stored folders have been resolved.

#### Scenario: The add control opens the picker and lists the folder
- **WHEN** the user activates the add control and picks a folder
- **THEN** the picker opens, an entry for the folder appears on the rail, and the folder becomes active

#### Scenario: Clicking a rail entry switches the active folder
- **WHEN** the user activates a rail entry that is not the active folder
- **THEN** that folder becomes the active one and the open page becomes that folder's today journal note

#### Scenario: The active entry is visually distinct
- **WHEN** multiple folders are listed
- **THEN** the active folder's entry is visually distinct from the others

#### Scenario: A pending-permission folder re-grants without the picker
- **WHEN** the user activates a listed folder whose stored permission is pending
- **THEN** the app requests permission for that stored folder and no picker is shown

#### Scenario: Re-picking an opened folder does not duplicate it
- **WHEN** the user picks a folder that is already listed
- **THEN** no duplicate entry appears and the existing entry becomes active

#### Scenario: No entries render while stored folders resolve
- **WHEN** the app is resolving stored folders at startup
- **THEN** the rail renders no folder entries

#### Scenario: No add control where the browser cannot open folders
- **GIVEN** a browser whose runtime provides no local-folder picker
- **WHEN** the shell renders
- **THEN** the rail shows no add control and the app offers no other control that opens the picker, while the rail keeps its column in the workspace

### Requirement: The folder rail scrolls vertically only
The folder rail SHALL never render a horizontal scrollbar: content wider than the rail's column is clipped at the rail's box edges, never scrollable sideways.

#### Scenario: The rail shows no horizontal scrollbar even with a fixed-width add control
- **GIVEN** an open vault with its folder rail rendered
- **WHEN** the rail's add control and folder entries are laid out
- **THEN** no horizontal scrollbar appears in the rail, and vertical scrolling of the entry list is unchanged

### Requirement: A folder rail entry can be closed
Every folder rail entry SHALL carry a close control that removes that entry from the rail and forgets its folder. The close control SHALL be a distinct surface from the entry's switch action: activating it SHALL NOT activate the entry or switch folders. Closing a non-active entry SHALL leave the active folder, its open page, and the workspace unchanged. Closing the active entry SHALL return the app to the empty state with no active folder, while any other listed folders remain on the rail. Closing an entry SHALL leave all other entries listed. Closing a folder SHALL NOT delete or modify its files on disk.

#### Scenario: A close control closes an entry without switching
- **GIVEN** two granted folders listed on the rail with the first active
- **WHEN** the user activates the close control of the second entry
- **THEN** the second entry is no longer listed, the first folder stays active, and the open page is unchanged

#### Scenario: Closing the active entry returns to the empty state
- **GIVEN** the active folder entry at the top of the rail with two other folders listed below it
- **WHEN** the user closes the active entry
- **THEN** the entry is removed, no folder is active, the empty state shows, and the two other folders remain listed

#### Scenario: The close control never triggers a switch
- **WHEN** the user activates an entry's close control while that entry is not the active folder
- **THEN** the entry is removed and the active folder does not change

#### Scenario: Closing a folder leaves the other entries listed
- **GIVEN** three granted folders listed on the rail
- **WHEN** the user closes one of them
- **THEN** the closed folder's entry is gone and the other two entries remain listed

#### Scenario: Closing does not touch the folder on disk
- **GIVEN** a listed folder whose Markdown files exist on disk
- **WHEN** the user closes that folder
- **THEN** the app forgets only its reference and every file in the folder remains on disk unchanged

### Requirement: Journal section shows the journal calendar
When a vault folder is open, the Journal section body SHALL render a month calendar grid for the vault's journal days. The grid SHALL be Sunday-first with one cell per day, and days that have a journal file in the open vault's index SHALL be marked with a background fill. The first and last weeks' cells that fall outside the displayed month SHALL render dimmed but remain clickable as days. The grid SHALL initially display the month of the currently open day (or the current month when no day is open), SHALL provide previous/next month controls that move the displayed month without opening a day, and opening any day SHALL re-anchor the grid to that day's month. The control opening the current day's journal lives in the sidebar's navigation control row, not in this section; opening the current day re-anchors the grid to that day's month like opening any other day. When no vault folder is open, the Journal section SHALL NOT render the calendar, keeping the section empty.

#### Scenario: Journal calendar marks days with entries
- **GIVEN** an open vault whose index contains `journals/2026-09-06.md`
- **WHEN** the Journal section displays September 2026
- **THEN** the 6th day cell is filled, and empty days are not filled

#### Scenario: Out-of-month days are dimmed but clickable
- **GIVEN** the calendar displays September 2026 where the 1st is a Tuesday
- **WHEN** the section renders
- **THEN** the leading cells (Aug 30, 31) and trailing cells (Oct 1–4) render with the dimmed styling and behave as clickable days

#### Scenario: The grid follows the open day
- **GIVEN** `journals/2026-08-14.md` is open
- **WHEN** the Journal section renders or the open day changes
- **THEN** the grid displays August 2026

#### Scenario: Today opens the current day's journal
- **GIVEN** another page is open and the calendar displays a month other than the current one
- **WHEN** the user activates the Today control in the sidebar's navigation control row
- **THEN** the editor pane opens the current day's journal, no file is created by the activation itself, and the grid displays the current day's month

#### Scenario: Today re-anchors the grid even when today is already open
- **GIVEN** the current day's journal is already open and the calendar has been browsed to another month
- **WHEN** the user activates the Today control
- **THEN** the grid displays the current day's month

#### Scenario: Month controls browse without opening a day
- **GIVEN** the calendar displays September 2026 with `journals/2026-09-06.md` open
- **WHEN** the user clicks the previous-month control
- **THEN** the grid displays August 2026, the editor pane keeps its open day, and clicking a day in the visited month opens that day and re-anchors the grid

#### Scenario: No calendar without a vault
- **WHEN** no vault folder is open
- **THEN** the Journal section shows no calendar grid

### Requirement: The shell shows an app-level status bar

The shell SHALL render a thin status bar as a full-width row below the workspace, present in every app state — with a vault open, while the index builds, on search-results surfaces, on an open board, and on the brand empty state. The bar SHALL hold the pin control in its leading column and three groups: the open document's file path as a breadcrumb (left, immediately after the leading column) — a page's, a journal day's, or a board's — a status group holding the save-state text and the indexing label (immediately after the breadcrumb), and the active vault's name and file count (right side). Beside the vault's file count, at the bar's trailing edge, the bar SHALL show the running application version as `v<version>`, where `<version>` is the `version` field of `package.json`; the version SHALL be non-interactive text, SHALL render in every app state, and SHALL NOT be a control or gate any behavior. A group SHALL be empty when its content has no source: no page and no board open leaves the path group empty; a page or board with nothing to report leaves the status group empty; no active folder leaves the vault group empty. The bar SHALL sit outside all pane scroll regions — its content never scrolls, and the panes scroll independently beneath it — and SHALL use Kami tokens (stone 12px text, hairline top border, flat surfaces). The bar SHALL hold no action other than the pin control: it opens no picker, switches no folder, re-grants no permission, and navigates nowhere.

#### Scenario: The bar frames every app state

- **GIVEN** the app on the brand empty state with no vault open
- **WHEN** the shell renders
- **THEN** the status bar is present with the three groups empty and no content beyond the pin control and the running version

#### Scenario: An open page fills the path group

- **WHEN** the user opens a page
- **THEN** the status bar's path group shows the page's file-path breadcrumb

#### Scenario: An open board fills the path group

- **WHEN** the user opens a board
- **THEN** the status bar's path group shows the board's file-path breadcrumb and the status group reflects the board's save state

#### Scenario: The indexing label shows in the bar

- **WHEN** the active folder's index is building
- **THEN** the status bar shows the "Indexing notes…" status in the center group

#### Scenario: The bar shows the running version beside the file count

- **WHEN** the shell renders, in any app state
- **THEN** the status bar shows `v<version>` at its trailing edge, beside the vault's name and file count, and the badge is not an interactive control

#### Scenario: The bar performs no actions

- **WHEN** the user activates the breadcrumb segments, the status text, or the vault name in the status bar
- **THEN** nothing happens: no navigation, no picker, no folder switch, no permission re-grant

#### Scenario: The bar stays put while panes scroll

- **WHEN** the user scrolls a pane beneath the status bar
- **THEN** the bar and its content remain fixed at the shell's bottom

### Requirement: The status bar's leading column matches the folder rail
The status bar SHALL open with a leading column holding the pin control, one folder-rail column wide and starting at the bar's leading edge, so the column is the rail's column continued downward at the same horizontal position. That column's right edge SHALL carry a vertical hairline in the bar's border colour, drawn at the same x as the rail's right border, so the rail's border reads as continuing into the status bar; this hairline SHALL be the bar's only vertical separator, so no second hairline sits between the breadcrumb and the status group. The pin control SHALL keep its existing size, glyph, label, disabled rules, and states, centred in the column. The bar's remaining content SHALL keep its existing order and spacing after the column: the breadcrumb, then the status group, then the vault group.

#### Scenario: The pin's column lines up with the rail
- **GIVEN** the shell rendered at desktop width
- **WHEN** the status bar lays out
- **THEN** the pin's column is one rail column wide and starts at the bar's leading edge, and its right edge carries the hairline at the same x as the rail's right border, so the two read as one vertical line

#### Scenario: The rest of the bar keeps its layout
- **WHEN** the status bar renders with a page open, with no page open, and while the index builds
- **THEN** the only vertical line in the bar is the leading column's right edge, the breadcrumb, the status group, and the vault group keep their order and spacing after it, and the pin control keeps its 24px star box, star glyph, accessible name, `aria-pressed` value, and title in its enabled and disabled states

### Requirement: Activating a shortcut row applies its key combination
Every entry in the keyboard-shortcuts reference whose key combination the app binds as a keyboard shortcut SHALL be a control that applies that combination to the editor when activated. A row's label SHALL remain text; each key combination SHALL be its own control, so a row listing more than one combination offers one control per combination. Activating a control SHALL produce the same result as pressing that combination in the editor, including its toggling behaviour: applying a formatting combination to text that already carries that formatting SHALL remove it, and applying it again SHALL restore it. An entry whose key combination is not bound as a keyboard shortcut — the paste shortcut's shift modifier, which is read from the paste gesture rather than bound on keydown — SHALL remain a plain, non-interactive row rather than a control. A control SHALL carry an accessible name that states both the action and the key combination. A row SHALL be disabled — visibly dimmed and not activatable — when the surface it acts on is unavailable: rows that act on the editor while no editor is open, and the search row while no vault folder is open. Rows SHALL remain listed in every app state whether or not they are disabled. Activating an editor row SHALL leave keyboard focus in the editor, and activating the search row SHALL leave focus in the search input, so the user can continue typing or searching without a further gesture. A combination the current context does not claim SHALL leave the document unchanged, silently. Activating a row SHALL be distinct from opening the reference: opening and closing the section itself SHALL continue to change nothing.

#### Scenario: Clicking a formatting key removes the formatting
- **GIVEN** a run of bold text in the open page, selected
- **WHEN** the user activates the bold row's key control
- **THEN** the selection is no longer bold, and the page's saved Markdown no longer carries the emphasis markers for that run

#### Scenario: Applying the same key again restores the formatting
- **GIVEN** a run of text made plain by activating the bold row's key control
- **WHEN** the user activates that control again
- **THEN** the run is bold again and the saved Markdown carries the emphasis markers again

#### Scenario: Each key combination is its own control
- **WHEN** the user opens the reference
- **THEN** a row listing two combinations offers two separate controls, each applying its own combination

#### Scenario: A non-bound shortcut stays a plain row
- **WHEN** the user opens the reference
- **THEN** the paste-as-plain-text row shows its label and key tokens but offers no control

#### Scenario: Rows are dimmed when their surface is unavailable
- **GIVEN** no editor is open, or no vault folder is open
- **WHEN** the user opens the reference
- **THEN** the rows for the unavailable surface are shown dimmed and do not react to activation, while every row remains listed

#### Scenario: Focus returns to the editor
- **GIVEN** a page is open with the caret in it
- **WHEN** the user activates an editor row's key control
- **THEN** the combination is applied and keyboard focus is in the editor

#### Scenario: A combination the context does not claim changes nothing
- **GIVEN** a page is open with the caret in an ordinary paragraph
- **WHEN** the user activates the indent row's key control
- **THEN** the document is unchanged and no error is reported

#### Scenario: Activating a row is not opening the reference
- **GIVEN** a page is open and the reference is closed
- **WHEN** the user opens the reference
- **THEN** the open page and the search surface are unchanged, and only activating a control changes anything

### Requirement: A scroll region reserves its scrollbar's gutter
Every scroll region the app owns SHALL reserve the width its scrollbar occupies whether or not the region is currently overflowing, so that a region's content keeps the same width before and after it begins to overflow and does not reflow when a scrollbar appears or disappears. The reserved width SHALL be the width the platform's own scrollbar would occupy, and the reservation SHALL be made for the region's vertical axis only.

The regions this applies to SHALL be the editor pane, the sidebar's Pages, Boards, and Assets bodies, the meta panel's Backlinks, Forwardlinks, and References bodies, and the search results list.

Every such region's bar SHALL be the app's own thumb, drawn in the lane the region reserves: thin, rounded, inset in the lane, painted in the app's muted ink, shown for as long as the region can scroll and absent while it cannot. The thumb SHALL NOT cover any of the region's content, SHALL NOT be gated on the pointer or on the region's scrolling, SHALL NOT fade or slide in or out, and SHALL NOT change the lane's width.

On a platform that ignores the app's scrollbar styling and draws its own bar floating over the content, the platform's bar SHALL remain and no lane SHALL be reserved, so the app SHALL NOT introduce a dead strip next to the content on such a platform.

A region that scrolls only as a fallback, while another region holds its content, SHALL NOT reserve a lane and SHALL NOT carry the app's thumb: the sidebar pane and the meta panel, whose accordion bodies own the scrolling and whose own bar can appear only on a window too short for the sections' minimum heights. A region whose content is sized to its own fixed extent SHALL likewise reserve nothing, because a lane would shrink what it was sized for: the folder rail, whose controls are a fixed size in a fixed-width column, and an overlay popup such as a code block's language list, whose width is content-sized. Such a region keeps whatever bar the platform gives it.

#### Scenario: A page growing past the pane does not move its text
- **GIVEN** an open page whose content is shorter than the editor pane
- **WHEN** the content grows past the pane's height so that a scrollbar appears
- **THEN** the document keeps the width it had before, its text does not reflow, and only the scrolling changes

#### Scenario: The reservation is present before anything overflows
- **GIVEN** an open page whose content fits the pane, and a region whose content fits its band
- **WHEN** each is inspected while it has nothing to scroll
- **THEN** each already holds the space its scrollbar would occupy, so adding content to either one cannot move the other content in that region

#### Scenario: A listing crossing its band's height does not shift
- **GIVEN** the sidebar's Pages body holding fewer rows than its band can show
- **WHEN** more pages arrive and the body begins to scroll
- **THEN** the rows keep their width and position, and no other band's height changes

#### Scenario: The bar is the app's own thumb in the reserved lane
- **GIVEN** a region that overflows its lane's height
- **WHEN** the region is inspected with the pointer anywhere, over it or away from it
- **THEN** the app's thumb is shown inside the reserved lane, over none of the region's content, and the content's width is unchanged by its appearance
- **WHEN** the region has nothing to scroll
- **THEN** no thumb is shown, and the lane still reserves the width its scrollbar would occupy

#### Scenario: The scrollbar stays the platform's own
- **GIVEN** a platform that ignores the app's scrollbar styling and draws its own bar
- **WHEN** a region of the app overflows
- **THEN** the platform's bar is the one that scrolls it, not restyled, not replaced by an element the app renders over the content

#### Scenario: No dead strip where scrollbars already float
- **GIVEN** a platform that draws scrollbars over the content rather than in a gutter
- **WHEN** a region of the app overflows
- **THEN** the region's content keeps its full width and no gutter is reserved beside it

#### Scenario: The side panes reserve no lane
- **WHEN** the shell renders with both panes expanded
- **THEN** the sidebar pane and the meta panel hold no reserved lane beside their bands, so each band keeps the full width the pane's padding leaves it, while the accordion bodies inside them still reserve their own lanes

#### Scenario: The panes keep the platform's own bar
- **WHEN** a window is too short for the sections' minimum heights and the sidebar pane or the meta panel overflows
- **THEN** the pane scrolls with the bar the platform gives it, and the app draws no thumb in it

#### Scenario: The folder rail keeps its control size
- **GIVEN** more open folders than the rail can show, so that the rail scrolls
- **THEN** the rail's avatars keep their full size and are not clipped, because the rail reserves no gutter and carries no app thumb

#### Scenario: An overlay popup keeps its content-sized width
- **GIVEN** a code block whose language list is open
- **WHEN** the list is long enough to scroll
- **THEN** the popup's width is unchanged by the scrolling, because it reserves no gutter and carries no app thumb

### Requirement: Header shows the brand and the search box

The header SHALL show the Folio brand at the left and a search input centered over and spanning the center pane's column. The header SHALL NOT show the running version: the version moved to the meta panel's bottom-right corner (the requirement below). The header's right slot SHALL be empty: the vault's name and file count live in the status bar. The slot SHALL hold no controls and SHALL NOT open a picker, switch folders, or re-grant permission — adding, switching, or re-granting a folder happens on the folder rail. The search input's width SHALL match the content column it sits over (capped at a readable maximum), not a fixed narrow box, so the box and its dropdown align with the content beneath. Search behavior — the results dropdown, matching, keyboard, and edge states — is specified by the search capability.

#### Scenario: Search spans the content column

- **WHEN** the shell renders at desktop width
- **THEN** the search input is horizontally aligned with the center pane and spans that column's width, not a fixed-width box

#### Scenario: Search behavior lives with the search capability

- **WHEN** the user types into the search input
- **THEN** the input's behavior is the search capability's: a results dropdown, keyboard shortcuts, and empty states, none of which were present while the input was inert

#### Scenario: The slot shows status and performs no actions

- **WHEN** a vault is active
- **THEN** the header slot shows no controls — the vault's name and file count appear in the status bar instead — and the slot performs no other actions: it opens no picker, switches no folder, and re-grants no permission

#### Scenario: The header carries no version badge

- **WHEN** the header renders, in any app state
- **THEN** it shows the brand and the search box and no version badge
