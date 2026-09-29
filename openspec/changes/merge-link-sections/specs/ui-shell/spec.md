## MODIFIED Requirements

### Requirement: Meta panel is an accordion of page metadata

The right meta panel SHALL contain the collapsible page sections Contents and Links, followed by the keyboard-shortcuts reference (the last-section requirement). Each section SHALL show placeholder copy while no page is open and no board is open; while a board is open it SHALL show the board's Referenced by section instead of the page sections (whiteboards capability). All page sections SHALL open and close independently. The Links section SHALL take the panel's remaining height, its body scrolling within itself when its rows do not fit, and SHALL keep a minimum height so a short window cannot collapse it to nothing; the Contents section SHALL instead size to its content up to a maximum height, scrolling within itself when its list is longer, so it never claims more height than it needs. The panel itself SHALL scroll only as a fallback, when even the Links section's floor does not fit. Every section summary SHALL be rendered in every app state, and a collapsed section SHALL occupy exactly its summary row.

When a page is open, each section SHALL list its rows instead of placeholder copy. Contents lists the page's headings (page-contents capability), each labelled with the heading's text and indented by level. Links lists the open page's links in one list: first the pages that reference the open page, most recently edited first, with the path ascending as the tiebreak when two referrers share a last-edited time; then the pages the open page references, in document order; then the assets it points at in their document order; then the boards it references in theirs (static-navigation, vault-assets, and whiteboards capabilities). Every row SHALL carry a badge before its label: a backlink page `in`, a forwardlink page `out`, an asset `a`, a board `b`. A section with no rows SHALL show empty-state copy. Contents and Links SHALL both be open by default. Rows SHALL use the sidebar's row styling and `aria-current` marking for the open page; page rows that target a page with no file on disk SHALL be visually dimmed to signal the page is not yet created, and remain clickable. Asset rows SHALL NOT be dimmed, because a row exists only for a file the vault holds. Clicking a page row navigates, and clicking an asset or board row opens the file or board it names (static-navigation and vault-assets requirements).

#### Scenario: Meta sections are independently collapsible

- **WHEN** the user collapses Links while Contents is open
- **THEN** Links collapses and Contents remains open

#### Scenario: Backlinks list the open page's referrers

- **GIVEN** `Topic.md` is open and referenced by `Ideas.md` and `Log.md`, and `Log.md` was edited more recently than `Ideas.md`
- **WHEN** the user looks at the Links section
- **THEN** it lists the `Log` row above the `Ideas` row, most recently edited first, each badged `in`

#### Scenario: Forwardlinks list the open page's targets

- **GIVEN** an open page whose content references `Roadmap` and the journal day `2026-09-06`, in that order
- **WHEN** the user looks at the Links section
- **THEN** it lists the `Roadmap` row above the `2026-09-06` row, in the order the references appear, each badged `out`, whether or not each target's file exists

#### Scenario: Forwardlinks sort page and asset rows together

- **GIVEN** an open page whose content references `Roadmap` and `assets/q3-report.pdf`
- **WHEN** the user looks at the panel
- **THEN** the Links list shows the `Roadmap` row above the `q3-report.pdf` row, the page references before the file references, each keeping the order its references appear in the page

#### Scenario: References lists the open page's files

- **GIVEN** an open page whose content embeds `assets/shot.png` and links `assets/q3-report.pdf`
- **WHEN** the user looks at the Links section
- **THEN** it lists the `shot.png` row above the `q3-report.pdf` row, in the order the references appear, each marked with an `a` badge, and no page row carries an `a` badge

#### Scenario: References is collapsed by default

- **WHEN** the shell renders with a page open
- **THEN** the Links section is open by default and shows the page's link rows, and Contents is open

#### Scenario: Empty sections show copy instead of rows

- **GIVEN** an open page that no page references and that references nothing
- **WHEN** the user looks at the Links section
- **THEN** the section shows empty-state copy ("No links yet."), not placeholder copy and no rows

#### Scenario: An open page with no files shows copy in References

- **GIVEN** an open page that references pages but no vault files
- **WHEN** the user opens the Links section
- **THEN** it lists its page rows and no file rows, with no empty-state copy

#### Scenario: Unmaterialized targets are dimmed but clickable

- **GIVEN** an open page whose content references `Missing`, and no `Missing.md` exists
- **WHEN** the user looks at the Links section
- **THEN** the `Missing` row is rendered dimmed with its `out` badge, still clickable, and still navigates

#### Scenario: An asset row is never dimmed

- **GIVEN** an open page whose Links list includes the asset row `q3-report.pdf`
- **WHEN** the user looks at that row
- **THEN** it renders undimmed and opens the file when activated

#### Scenario: Placeholders persist only before a page opens

- **WHEN** no page is open and no board is open
- **THEN** the Contents and Links sections show their placeholder copy

#### Scenario: A board replaces the page sections with Referenced by

- **GIVEN** a board is open
- **WHEN** the user looks at the meta panel
- **THEN** the panel shows the board's Referenced by section rather than the Contents and Links rows

#### Scenario: A long section scrolls inside itself

- **GIVEN** an open page with more links than the panel can show
- **WHEN** the user scrolls the Links listing to its end
- **THEN** only the Links body scrolls, the panel itself does not scroll, and the Contents and Links summaries stay where they were

#### Scenario: The sections share the panel's height

- **WHEN** the user opens the Links section
- **THEN** Contents sizes to its content and Links takes the panel's remaining height, scrolling within its own body, and no listing is pushed out of reach

#### Scenario: A collapsed section is one row

- **WHEN** the user collapses Links
- **THEN** Links occupies exactly its summary row and the height it gave up goes to the panel

#### Scenario: A short window cannot collapse a listing

- **GIVEN** a window too short to fit the Links section at its minimum height
- **WHEN** the panel lays out
- **THEN** the Links section keeps its minimum height and the panel itself scrolls, rather than the section being clipped to nothing

#### Scenario: Rows are badged by direction and file kind

- **GIVEN** an open page referenced by `Log` and referencing `Roadmap`, `assets/shot.png`, and `boards/migration.excalidraw`
- **WHEN** the user looks at the Links section
- **THEN** the rows read `in Log`, `out Roadmap`, `a shot.png`, and `b migration.excalidraw`, in that order

### Requirement: Panes show loading placeholders while the active folder's index builds

While the active folder's index is being built — when a folder is first opened, when the user switches to another listed folder, and when a stored folder's permission is re-granted — the shell SHALL show loading placeholders in the panes whose content derives from the index, replacing the empty content those panes would otherwise show. The editor pane SHALL show placeholder body lines in place of its notes hint, the sidebar SHALL show placeholder blocks in place of the Journal calendar and the Files listing, and the meta panel SHALL show placeholder rows in its Contents and Links sections in place of their placeholder copy. The loading state SHALL be announced to assistive technology as an in-progress status labeled "Indexing notes…" in the status bar, and the placeholder blocks themselves SHALL be purely decorative. The loading state SHALL end when the active folder's index resolves, at which point the panes SHALL render the folder's real content and all post-index behavior is unchanged: the today journal opens in the editor, the sidebar lists the folder's pages, boards, and assets, and search enables. While no folder is active, the shell SHALL show the brand empty state, never loading placeholders.

#### Scenario: Opening a folder shows loading placeholders

- **WHEN** a folder whose index takes measurable time to build is opened
- **THEN** the editor pane, sidebar, and meta panel show loading placeholders instead of empty content, and they keep showing them until the index resolves

#### Scenario: The sidebar's listings show loading placeholders

- **WHEN** the active folder's index is building
- **THEN** the sidebar's Journal calendar and Files listing show placeholder blocks in place of their content and rows

#### Scenario: The meta panel shows loading placeholders

- **WHEN** the active folder's index is building and no page is open
- **THEN** the Contents and Links sections show placeholder rows instead of their placeholder copy

#### Scenario: Switching folders re-enters the loading state

- **WHEN** the user activates a second listed folder while one is open
- **THEN** the panes show loading placeholders while the new folder's index builds, and the placeholder content is replaced by the new folder's pages once the index resolves

#### Scenario: Loading ends with real content

- **WHEN** the active folder's index resolves after its loading state was showing
- **THEN** the placeholders are gone, the editor opens the folder's today journal, the sidebar lists the folder's pages, boards, and assets, and search is enabled

#### Scenario: No placeholders while no folder is active

- **WHEN** no folder is active, including after the user returns home via the brand
- **THEN** the shell shows the brand empty state and no loading placeholders

#### Scenario: Loading placeholders are announced, not read as content

- **WHEN** the active folder's index is building
- **THEN** the status bar announces the in-progress status "Indexing notes…" and the placeholder blocks are not exposed as page content

### Requirement: A scroll region reserves its scrollbar's gutter

Every scroll region the app owns SHALL reserve the width its scrollbar occupies whether or not the region is currently overflowing, so that a region's content keeps the same width before and after it begins to overflow and does not reflow when a scrollbar appears or disappears. The reserved width SHALL be the width the platform's own scrollbar would occupy, and the reservation SHALL be made for the region's vertical axis only.

The regions this applies to SHALL be the editor pane, the sidebar's Files body, the meta panel's Contents and Links bodies, and the search results list.

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

- **GIVEN** the sidebar's Files body holding fewer rows than its band can show
- **WHEN** more files arrive and the body begins to scroll
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

### Requirement: Application renders the shell with a foldable left navigation

Folio SHALL render a full-height shell: a workspace of the left-navigation unit, a flexible center editor pane, and a right meta panel, with two full-height collapse strips and the app-level status bar as a full-width row below the workspace (the status-bar requirement). The workspace SHALL consist of a collapse strip, a fixed-width folder rail, a left sidebar, a flexible center editor pane, a right meta panel, and a collapse strip, in that order from left to right. The folder rail and the left sidebar SHALL fold together as one collapsible left-navigation unit (the side-pane collapse requirement); while expanded each SHALL be fixed-width, and while folded each SHALL occupy no width, leaving their collapse strip in place. The right meta panel SHALL be independently collapsible (the side-pane collapse requirement); while expanded it SHALL be fixed-width, and while collapsed it SHALL occupy no width, leaving its collapse strip in place. Pane dividers SHALL be hairline borders on flat surfaces, with no shadows or gradients. The shell itself SHALL NOT scroll, and no pane SHALL scroll the page: a pane whose content exceeds its height SHALL scroll within itself, and a pane MAY hold more than one scroll region — the sidebar's Files section and the meta panel's Contents and Links sections each scroll within their own body (the sidebar and meta-panel requirements). The shell SHALL render no header band above the workspace: the panes start at the shell's top edge, and no standing row of chrome sits above them.

#### Scenario: Shell fills the viewport

- **WHEN** the app loads
- **THEN** the shell spans the full viewport height, the panes start at the shell's top edge with no band above them, and each collapse strip spans the workspace's full height

#### Scenario: Long content scrolls within panes, not the page

- **WHEN** content in a pane exceeds that pane's height
- **THEN** it scrolls inside the body of whichever section holds it — in the sidebar or in the meta panel — and the shell layout stays fixed

#### Scenario: Folding the left navigation removes the rail and the sidebar

- **WHEN** the left navigation is folded
- **THEN** the folder rail and the left sidebar each occupy no width, the editor takes both widths, and the collapse strip remains in place

#### Scenario: No header band above the workspace

- **WHEN** the shell renders in any app state
- **THEN** the workspace's panes start at the shell's top edge and no element occupies a standing row above them

### Requirement: The right panel's last section is a keyboard-shortcuts reference

The right meta panel SHALL hold the keyboard-shortcuts reference as its last collapsible section, after the page-metadata sections. The section SHALL be collapsed by default and its summary SHALL read "Keyboard shortcuts". While collapsed, the section's summary SHALL sit at the panel's bottom edge, below the page-metadata sections, whatever their open/closed state. Opening it SHALL expand the reference in place, growing upward from the panel's bottom edge: the reference SHALL NOT introduce a scrolling area or a height cap of its own, and the panel SHALL gain no scroll region beyond the fallback the meta-panel requirement specifies. Opening it SHALL list the app's keyboard shortcuts: the editor's formatting and editing shortcuts (bold, italic, inline code, undo, redo, heading levels one through six, paragraph, ordered and bullet lists, blockquote, code block, indent and outdent, line break) and the app's search shortcuts, one row per bound combination. The section SHALL list only shortcuts the app actually provides, and SHALL show each as a readable label with its key combination rendered as key tokens; heading levels one through six SHALL each be listed with their own entry showing that level's own key combination rather than a single key-range entry. The section SHALL be present and openable in every app state — with a vault open, while the index builds, on search-results surfaces, and on the brand empty state. The panel SHALL carry an accessible name that describes the whole panel, not only its link section. Opening or closing the reference SHALL NOT change the open page, the search spotlight, or the open/closed state of the Contents and Links sections. Because the reference is a disclosure rather than a modal surface, opening it SHALL NOT move keyboard focus, trap focus, or require a dismissal gesture; its summary SHALL be reachable and toggleable by keyboard like any other disclosure.

#### Scenario: The panel ends with the reference

- **WHEN** the shell renders with a vault open
- **THEN** the right panel's sections are Contents, then Links, then the collapsed "Keyboard shortcuts" row, and no section follows it

#### Scenario: The collapsed reference sits at the panel's bottom

- **WHEN** the reference is collapsed and the Links section is shorter than the panel
- **THEN** the reference row sits at the panel's bottom edge rather than directly beneath the Links section

#### Scenario: The collapsed reference stays at the panel's bottom while the panel scrolls

- **GIVEN** the Links section is long enough to fill the panel, and the panel is short enough that even its floor does not fit
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
- **THEN** it lists the editor's formatting and editing shortcuts and the app's search shortcuts, and lists no shortcut for capabilities that provide none (such as links)

#### Scenario: Heading levels are covered as a single range

- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** heading levels one through six are covered as one contiguous range of key combinations, listed with one entry per level and each entry showing that level's own combination

#### Scenario: The reference is reachable in every app state

- **GIVEN** the app on the brand empty state with no vault open
- **WHEN** the shell renders
- **THEN** the right panel's keyboard-shortcuts section is present and opens

#### Scenario: Opening the reference disturbs nothing

- **GIVEN** a page is open and the Links section is open
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** the open page is unchanged, the search spotlight is unchanged, and the Contents and Links sections keep their open/closed state

#### Scenario: The reference is a disclosure, not a modal surface

- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** keyboard focus stays wherever the user left it, focus is not trapped, and no dismissal gesture is required to keep working

#### Scenario: The reference toggles by keyboard

- **WHEN** the user reaches the keyboard-shortcuts summary with the keyboard and activates it
- **THEN** the summary shows visible keyboard focus and the section opens and closes

### Requirement: Collapsed link sections sit at the panel's bottom

The meta panel's Links section SHALL occupy the space between the Contents section and the keyboard-shortcuts row, and SHALL take the panel's remaining height. When it is collapsed, its summary row SHALL sit at the panel's bottom edge, directly above the keyboard-shortcuts row, rather than directly beneath the Contents section with the free space falling below it. While it is open it SHALL keep taking the panel's remaining height. This SHALL NOT change the section's open/closed state, the panel's fallback scrolling, or the rule that a collapsed section occupies exactly its summary row.

#### Scenario: Both link sections collapsed sit at the bottom

- **GIVEN** an open page with the Links section collapsed
- **WHEN** the user looks at the meta panel
- **THEN** its summary row sits at the panel's bottom edge, directly above the keyboard-shortcuts row, with the free space left above it beneath the Contents section

#### Scenario: A collapsed section sits at the bottom while another is open

- **GIVEN** an open page with the Links section open
- **WHEN** the user looks at the meta panel
- **THEN** Links takes the panel's remaining height and its rows sit directly above the keyboard-shortcuts row

#### Scenario: A short window still scrolls as before

- **GIVEN** a window too short for the open Links section's minimum height
- **WHEN** the panel lays out
- **THEN** the Links section keeps its minimum height, the panel itself scrolls, and no summary row is pushed out of reach
