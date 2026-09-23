## MODIFIED Requirements

### Requirement: The brand returns to the empty state
The Folio brand (the mark and title at the top of the folder rail) SHALL act as a home control: activating it SHALL make no folder active and show the empty state, leaving every listed folder on the rail. It SHALL work whether or not a folder is currently active, SHALL NOT close or forget any folder, and SHALL be a no-op when the empty state is already showing.

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

### Requirement: The right panel's last section is a keyboard-shortcuts reference
The right meta panel SHALL hold the keyboard-shortcuts reference as its last collapsible section, after the page-metadata sections. The section SHALL be collapsed by default and its summary SHALL read "Keyboard shortcuts". While collapsed, the section's summary SHALL sit at the panel's bottom edge, below the page-metadata sections, whatever their open/closed state. Opening it SHALL expand the reference in place, growing upward from the panel's bottom edge: the reference SHALL NOT introduce a scrolling area or a height cap of its own, and the panel SHALL gain no scroll region beyond the fallback the meta-panel requirement specifies. Opening it SHALL list the app's keyboard shortcuts: the editor's formatting and editing shortcuts (bold, italic, inline code, undo, redo, heading levels one through six, paragraph, ordered and bullet lists, blockquote, code block, indent and outdent, line break) and the app's search shortcuts, one row per bound combination. The section SHALL list only shortcuts the app actually provides, and SHALL show each as a readable label with its key combination rendered as key tokens; heading levels one through six SHALL each be listed with their own entry showing that level's own key combination rather than a single key-range entry. The section SHALL be present and openable in every app state — with a vault open, while the index builds, on search-results surfaces, and on the brand empty state. The panel SHALL carry an accessible name that describes the whole panel, not only its link sections. Opening or closing the reference SHALL NOT change the open page, the search spotlight, or the open/closed state of the Backlinks, Forwardlinks, and References sections. Because the reference is a disclosure rather than a modal surface, opening it SHALL NOT move keyboard focus, trap focus, or require a dismissal gesture; its summary SHALL be reachable and toggleable by keyboard like any other disclosure.

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
- **THEN** it lists the editor's formatting and editing shortcuts and the app's search shortcuts, and lists no shortcut for capabilities that provide none (such as links)

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
- **THEN** the open page is unchanged, the search spotlight is unchanged, and Backlinks, Forwardlinks, and References keep their open/closed state

#### Scenario: The reference is a disclosure, not a modal surface
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** keyboard focus stays wherever the user left it, focus is not trapped, and no dismissal gesture is required to keep working

#### Scenario: The reference toggles by keyboard
- **WHEN** the user reaches the keyboard-shortcuts summary with the keyboard and activates it
- **THEN** the summary shows visible keyboard focus and the section opens and closes

### Requirement: Activating a shortcut row applies its key combination
Every entry in the keyboard-shortcuts reference whose key combination the app binds as a keyboard shortcut SHALL be a control that applies that combination when activated. A row's label SHALL remain text; each key combination SHALL be its own control, so a row listing more than one combination offers one control per combination. Activating an editor row SHALL produce the same result as pressing that combination in the editor, including its toggling behaviour: applying a formatting combination to text that already carries that formatting SHALL remove it, and applying it again SHALL restore it. Activating a search row SHALL open the search spotlight with its input focused and its text selected. An entry whose key combination is not bound as a keyboard shortcut — the paste shortcut's shift modifier, which is read from the paste gesture rather than bound on keydown — SHALL remain a plain, non-interactive row rather than a control. A control SHALL carry an accessible name that states both the action and the key combination. A row SHALL be disabled — visibly dimmed and not activatable — when the surface it acts on is unavailable: rows that act on the editor while no editor is open, and the search row while no vault folder is open or the active folder's index is still building. Rows SHALL remain listed in every app state whether or not they are disabled. Activating an editor row SHALL leave keyboard focus in the editor, and activating a search row SHALL leave focus in the spotlight's search input, so the user can continue typing or searching without a further gesture. A combination the current context does not claim SHALL leave the document unchanged, silently. Activating a row SHALL be distinct from opening the reference: opening and closing the section itself SHALL continue to change nothing.

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

#### Scenario: Activating a search row opens the spotlight
- **GIVEN** a vault folder is open and its index has resolved
- **WHEN** the user activates the search row's key control
- **THEN** the search spotlight opens and focus is in its search input

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
- **THEN** the open page and the search spotlight are unchanged, and only activating a control changes anything

## ADDED Requirements

### Requirement: Application renders the workspace shell
Folio SHALL render a full-height shell: a workspace of four panes plus two full-height collapse strips, with the app-level status bar as a full-width row below the workspace (the status-bar requirement). The workspace SHALL consist of a fixed-width folder rail, a collapse strip, a left sidebar, a flexible center editor pane, a right meta panel, and a collapse strip, in that order from left to right. The folder rail SHALL be fixed-width and SHALL NOT be collapsible. The left sidebar and the right meta panel SHALL each be collapsible (the side-pane collapse requirement); while expanded they SHALL be fixed-width, and while collapsed they SHALL occupy no width, leaving their collapse strip in place. Pane dividers SHALL be hairline borders on flat surfaces, with no shadows or gradients. The shell itself SHALL NOT scroll, and no pane SHALL scroll the page: a pane whose content exceeds its height SHALL scroll within itself, and a pane MAY hold more than one scroll region — the sidebar's Pages and Assets sections and the meta panel's Backlinks, Forwardlinks, and References sections each scroll within their own body (the sidebar and meta-panel requirements). The shell SHALL render no header band above the workspace: the panes start at the shell's top edge, and no standing row of chrome sits above them.

#### Scenario: Shell fills the viewport
- **WHEN** the app loads
- **THEN** the shell spans the full viewport height, the four panes start at the shell's top edge with no band above them, and each collapse strip spans the workspace's full height

#### Scenario: Long content scrolls within panes, not the page
- **WHEN** content in a pane exceeds that pane's height
- **THEN** it scrolls inside the body of whichever section holds it — in the sidebar or in the meta panel — and the shell layout stays fixed

#### Scenario: The rail is never collapsed away
- **WHEN** either side pane is collapsed
- **THEN** the folder rail keeps its width and its contents stay in place

#### Scenario: No header band above the workspace
- **WHEN** the shell renders in any app state
- **THEN** the workspace's panes start at the shell's top edge and no element occupies a standing row above them

### Requirement: The side panes collapse to thin full-height strips
The left sidebar and the right meta panel SHALL each be collapsible and expandable through a thin, vertical, full-height control strip on that pane's outer edge: the left strip SHALL sit between the folder rail and the left sidebar, and the right strip SHALL sit at the workspace's right edge beside the meta panel. Each strip SHALL be a button spanning the workspace's full height and SHALL show an arrow that points toward the pane's own outer edge while the pane is expanded and toward the editor pane while the pane is collapsed. Both panes SHALL start expanded on every load, and the collapsed/expanded state SHALL be session-only — held in memory, reset by a reload, and never written to the vault or any other storage. Collapsing a pane SHALL remove exactly that pane's width, which the flexible center editor pane SHALL take up, and SHALL leave the other panes, the open page, the search spotlight's open/closed state, and the editor content unchanged. A collapsed pane's content SHALL not be rendered as visible or focusable. Each strip SHALL carry an accessible name naming the pane it controls and SHALL expose its expanded/collapsed state to assistive technology. Toggling SHALL be possible with a keyboard from the strip button, SHALL cause no navigation, and SHALL NOT require a reload.

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

#### Scenario: The collapse state resets on reload
- **GIVEN** the user has collapsed the left sidebar
- **WHEN** the app is reloaded
- **THEN** both panes are expanded again and no storage holds the previous state

#### Scenario: Collapsing changes nothing but the layout
- **GIVEN** a page is open with unsaved edits and the search spotlight is closed
- **WHEN** the user collapses the meta panel
- **THEN** the open page, the editor's content, and the search spotlight's open/closed state are unchanged

#### Scenario: A collapsed pane leaves the tab order
- **GIVEN** the meta panel is collapsed
- **WHEN** the user moves focus with the keyboard
- **THEN** no control inside the collapsed panel receives focus

#### Scenario: The strip announces what it controls
- **WHEN** the user focuses a strip
- **THEN** it reports an accessible name naming its pane and exposes whether that pane is expanded or collapsed

### Requirement: The folder rail hosts the brand home control and the search trigger
The folder rail SHALL lead with the Folio brand as its first control and the search trigger directly below it, above the add control and the folder entries. The brand SHALL keep the home behavior the brand requirement specifies. The search trigger SHALL be a control with an accessible name that opens the search spotlight (the search capability); it SHALL be present in every app state and SHALL be disabled — visibly dimmed and not activatable — while no vault folder is open or the active folder's index is still building, matching the search capability's rule that search does not open without a usable vault. Activating it while usable SHALL open the spotlight with its input focused. Both controls SHALL use Kami tokens and SHALL occupy a fixed size in the rail's fixed-width column, so the rail keeps its vertical-only scrolling rule and gains no horizontal scrollbar.

#### Scenario: The brand leads the rail
- **WHEN** the shell renders with folders listed
- **THEN** the Folio brand is the rail's first control, above the search trigger, the add control, and the folder entries

#### Scenario: The search trigger opens the spotlight
- **GIVEN** a vault folder is open and its index has resolved
- **WHEN** the user activates the rail's search trigger
- **THEN** the search spotlight opens with its search input focused

#### Scenario: The search trigger is disabled without a usable vault
- **WHEN** no folder is open, or the active folder's index is still building
- **THEN** the rail's search trigger is rendered disabled and activating it does nothing

#### Scenario: The rail keeps its control size and its vertical-only scrolling
- **GIVEN** more open folders than the rail can show, so that the rail scrolls
- **WHEN** the brand, the search trigger, and the folder entries lay out
- **THEN** each control keeps its full size, the rail scrolls vertically only, and no horizontal scrollbar appears

## REMOVED Requirements

### Requirement: Application renders the shell layout
**Reason**: The requirement described a header row above the workspace, with the header mirroring the workspace's columns. The header is removed, so the layout is a workspace plus the status bar, and the header-alignment rule has no subject.
**Migration**: The workspace now starts at the shell's top edge. Column alignment that mattered moves to the folder rail, whose fixed controls sit in the rail's fixed-width column (the folder-rail requirement), and to the status bar's leading column, which already lines up with the rail.

### Requirement: Side panes collapse to a thin full-height strip
**Reason**: The requirement listed "the header" among what a collapse leaves unchanged and carried a scenario asserting that the header mirrors the collapse. With no header, both are void.
**Migration**: Collapsing a pane now leaves the other panes, the open page, the search spotlight, and the editor content unchanged; the replaced requirement states this.

### Requirement: Header shows the brand and the search box
**Reason**: The header was a standing band that existed to host the brand and an always-visible search input. Search moves to a keyboard-summoned spotlight and the brand moves to the folder rail, so the band no longer earns its height in a writing app.
**Migration**: Reach search from anywhere with `Ctrl/Cmd+P` or `Ctrl/Cmd+K`, or from the folder rail's search trigger; the spotlight holds the input and the dropdown. Activate the Folio brand at the top of the folder rail to return to the empty state. The vault's name, file count, and the running version stay in the status bar, and no other header content changes hands.
