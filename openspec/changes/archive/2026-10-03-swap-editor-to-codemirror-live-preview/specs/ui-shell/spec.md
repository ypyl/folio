# Spec Delta

## ADDED Requirements

### Requirement: The right panel's last section lists the shortcuts the app binds

The right meta panel SHALL hold the keyboard-shortcuts reference as its last collapsible section, after the page-metadata sections. The section SHALL be collapsed by default and its summary SHALL read "Keyboard shortcuts". While collapsed, the section's summary SHALL sit at the panel's bottom edge, below the page-metadata sections, whatever their open/closed state. Opening it SHALL expand the reference in place, growing upward from the panel's bottom edge: the reference SHALL NOT introduce a scrolling area or a height cap of its own, and the panel SHALL gain no scroll region beyond the fallback the meta-panel requirement specifies.

Opening it SHALL list the shortcuts the app actually binds: undo and redo in the editor, the chord that opens the reference at the caret, and the app's search shortcuts, one row per bound combination. It SHALL list no formatting chord and no table chord — not bold, italic, inline code, a heading level, a paragraph, a list, a blockquote, a code block, indent or outdent, a line break, an inserted table, a table row or column, a column alignment, a cell move, or a table exit — because the page surface shows its Markdown and is edited as text, so no such action exists for a chord to apply. Each row SHALL show a readable label with its key combination rendered as key tokens.

The section SHALL be present and openable in every app state — with a vault open, while the index builds, on search-results surfaces, and on the brand empty state. The panel SHALL carry an accessible name that describes the whole panel, not only its link section. Opening or closing the reference SHALL NOT change the open page, the search spotlight, or the open/closed state of the Contents and Links sections. Because the reference is a disclosure rather than a modal surface, opening it SHALL NOT move keyboard focus, trap focus, or require a dismissal gesture; its summary SHALL be reachable and toggleable by keyboard like any other disclosure.

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

#### Scenario: The reference lists only real shortcuts
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** it lists undo, redo, the reference chord, and the app's search shortcuts, and lists no shortcut for an action the app does not provide

#### Scenario: No formatting or table chord is listed
- **WHEN** the user reads the reference
- **THEN** no row names bold, italic, inline code, a heading level, a paragraph, a list, a blockquote, a code block, indent or outdent, a line break, or any table action, so the panel advertises no chord nothing claims

### Requirement: A shortcut row applies its key combination when activated

Every entry in the keyboard-shortcuts reference SHALL be a control that applies its key combination when activated, because every row the reference now holds is a combination the app binds. A row's label SHALL remain text; each key combination SHALL be its own control, so a row listing more than one combination offers one control per combination. Activating an editor row SHALL produce the same result as pressing that combination in the editor. Activating a search row SHALL open the search spotlight with its input focused and its text selected. A control SHALL carry an accessible name that states both the action and the key combination. A row SHALL be disabled — visibly dimmed and not activatable — when the surface it acts on is unavailable: rows that act on the editor while no editor is open, and the search row while no vault folder is open or the active folder's index is still building. Rows SHALL remain listed in every app state whether or not they are disabled. Activating an editor row SHALL leave keyboard focus in the editor, and activating a search row SHALL leave focus in the spotlight's search input, so the user can continue typing or searching without a further gesture. A combination the current context does not claim SHALL leave the document unchanged, silently. Activating a row SHALL be distinct from opening the reference: opening and closing the section itself SHALL continue to change nothing.

#### Scenario: Each key combination is its own control
- **WHEN** the user opens the reference
- **THEN** a row listing two combinations offers two separate controls, each applying its own combination

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


## REMOVED Requirements

### Requirement: The right panel's last section is a keyboard-shortcuts reference
**Reason**: Replaced by "The right panel's last section lists the shortcuts the app binds". Its subject was an enumeration of formatting actions that the Markdown-source surface does not have.
**Migration**: None. The section, its placement, and its disclosure behavior are unchanged.

### Requirement: Activating a shortcut row applies its key combination
**Reason**: Replaced by "A shortcut row applies its key combination when activated": the formatting-toggle and non-bound-row clauses describe rows that no longer exist, and every row that remains is a control.
**Migration**: None.

### Requirement: The keyboard-shortcuts reference covers leaving a code block
**Reason**: A code block is a fenced range in the text now, with no surface of its own to enter or leave, so `Mod-Enter` and `Backspace` have no such meaning and no row describes them.
**Migration**: None.

### Requirement: The keyboard-shortcuts reference covers formatting a JSON code block
**Reason**: The JSON reformat action went with the embedded code block surface.
**Migration**: None.

### Requirement: The keyboard-shortcuts reference covers table editing
**Reason**: A table renders at rest and is edited as its Markdown, so there is no insert, row, column, alignment, cell-navigation, or exit action to bind.
**Migration**: None.
