## RENAMED Requirements

- FROM: `### Requirement: Sidebar is an accordion of Journal, Pages, Boards, and Assets sections`
- TO: `### Requirement: Sidebar is an accordion of Journal and Files sections`

## MODIFIED Requirements

### Requirement: Sidebar is an accordion of Journal and Files sections

The sidebar SHALL contain exactly two collapsible sections — Journal, then Files — with no other sections, controls, or buttons between them and no navigation control row above them, so Journal is the sidebar's first band. Every section's summary row SHALL be rendered in every app state — open or collapsed, and with or without a vault — and SHALL be all a collapsed section occupies. The Journal section SHALL size to its content and SHALL NOT scroll internally; the Files section SHALL take the sidebar's remaining height, its body scrolling within itself, and SHALL keep a minimum height so a short window cannot collapse it to nothing. The Files listing and the rows it holds are specified by the static-navigation capability, with the board rows further specified by the whiteboards capability and the asset rows by the vault-assets capability. Both sections SHALL support independent open/close (one section's state does not affect the other) and expand/collapse without page reloads or JavaScript manipulation of document state. Journal and Files SHALL both be open by default. There SHALL be no Tags section, no New Page button, no History section, and no Back, Forward, or Today control in the sidebar.

#### Scenario: Sections open and close independently

- **WHEN** the user collapses the Files section while Journal is open
- **THEN** Files collapses and Journal remains open

#### Scenario: Journal leads the sidebar

- **WHEN** the shell renders
- **THEN** the sidebar's first band is the Journal section, followed by Files, with no control row and no section between them

#### Scenario: Every section summary is always rendered

- **WHEN** the user collapses the Files section
- **THEN** both summaries remain in the document in order, Journal's above Files', each occupying one row

#### Scenario: A collapsed section leaves the others their height

- **WHEN** the user collapses the Journal section
- **THEN** the Files section expands to use the space the Journal band gave up

#### Scenario: The sidebar holds no navigation controls

- **WHEN** the shell renders in any app state
- **THEN** the sidebar contains no Back, Forward, or Today control, and those controls appear only in the status bar

#### Scenario: The sidebar has no History section

- **WHEN** the shell renders
- **THEN** the sidebar holds no History section, and Back and Forward are the only presentation of the session trail

### Requirement: Panes show loading placeholders while the active folder's index builds

While the active folder's index is being built — when a folder is first opened, when the user switches to another listed folder, and when a stored folder's permission is re-granted — the shell SHALL show loading placeholders in the panes whose content derives from the index, replacing the empty content those panes would otherwise show. The editor pane SHALL show placeholder body lines in place of its notes hint, the sidebar SHALL show placeholder blocks in place of the Journal calendar and the Files listing, and the meta panel SHALL show placeholder rows in its Contents, Backlinks, and Forwardlinks sections in place of their placeholder copy. The loading state SHALL be announced to assistive technology as an in-progress status labeled "Indexing notes…" in the status bar, and the placeholder blocks themselves SHALL be purely decorative. The loading state SHALL end when the active folder's index resolves, at which point the panes SHALL render the folder's real content and all post-index behavior is unchanged: the today journal opens in the editor, the sidebar lists the folder's pages, boards, and assets, and search enables. While no folder is active, the shell SHALL show the brand empty state, never loading placeholders.

#### Scenario: Opening a folder shows loading placeholders

- **WHEN** a folder whose index takes measurable time to build is opened
- **THEN** the editor pane, sidebar, and meta panel show loading placeholders instead of empty content, and they keep showing them until the index resolves

#### Scenario: The sidebar's listings show loading placeholders

- **WHEN** the active folder's index is building
- **THEN** the sidebar's Journal calendar and Files listing show placeholder blocks in place of their content and rows

#### Scenario: The meta panel shows loading placeholders

- **WHEN** the active folder's index is building and no page is open
- **THEN** the Contents, Backlinks, and Forwardlinks sections show placeholder rows instead of their placeholder copy

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

The regions this applies to SHALL be the editor pane, the sidebar's Files body, the meta panel's Contents, Backlinks, and Forwardlinks bodies, and the search results list.

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

Folio SHALL render a full-height shell: a workspace of the left-navigation unit, a flexible center editor pane, and a right meta panel, with two full-height collapse strips and the app-level status bar as a full-width row below the workspace (the status-bar requirement). The workspace SHALL consist of a collapse strip, a fixed-width folder rail, a left sidebar, a flexible center editor pane, a right meta panel, and a collapse strip, in that order from left to right. The folder rail and the left sidebar SHALL fold together as one collapsible left-navigation unit (the side-pane collapse requirement); while expanded each SHALL be fixed-width, and while folded each SHALL occupy no width, leaving their collapse strip in place. The right meta panel SHALL be independently collapsible (the side-pane collapse requirement); while expanded it SHALL be fixed-width, and while collapsed it SHALL occupy no width, leaving its collapse strip in place. Pane dividers SHALL be hairline borders on flat surfaces, with no shadows or gradients. The shell itself SHALL NOT scroll, and no pane SHALL scroll the page: a pane whose content exceeds its height SHALL scroll within itself, and a pane MAY hold more than one scroll region — the sidebar's Files section and the meta panel's Contents, Backlinks, and Forwardlinks sections each scroll within their own body (the sidebar and meta-panel requirements). The shell SHALL render no header band above the workspace: the panes start at the shell's top edge, and no standing row of chrome sits above them.

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
