## MODIFIED Requirements

### Requirement: The right panel's last section is a keyboard-shortcuts reference
The right meta panel SHALL hold the keyboard-shortcuts reference as its last collapsible section, after the page-metadata sections. The section SHALL be collapsed by default and its summary SHALL read "Keyboard shortcuts". While collapsed, the section's summary SHALL sit at the panel's bottom edge, below the page-metadata sections, whether those sections are shorter than the panel or long enough to make it scroll. Opening it SHALL expand the reference in place, growing upward from the panel's bottom edge: the panel SHALL continue to scroll as a single region, and the open list SHALL NOT introduce a second scrolling area or a height cap of its own. Opening it SHALL list the app's keyboard shortcuts: the editor's formatting and editing shortcuts (bold, italic, inline code, undo, redo, heading levels one through six, paragraph, ordered and bullet lists, blockquote, code block, indent and outdent, line break) and the app's search shortcut. The section SHALL list only shortcuts the app actually provides, and SHALL show each as a readable label with its key combination rendered as key tokens; heading levels one through six SHALL each be listed with their own entry showing that level's own key combination rather than a single key-range entry. The section SHALL be present and openable in every app state — with a vault open, while the index builds, on search-results surfaces, and on the brand empty state. The panel SHALL carry an accessible name that describes the whole panel, not only its link sections. Opening or closing the reference SHALL NOT change the open page, the search surface, or the open/closed state of the Backlinks and Forwardlinks sections. Because the reference is a disclosure rather than a modal surface, opening it SHALL NOT move keyboard focus, trap focus, or require a dismissal gesture; its summary SHALL be reachable and toggleable by keyboard like any other disclosure.

#### Scenario: The panel ends with the reference
- **WHEN** the shell renders with a vault open
- **THEN** the right panel's sections are Backlinks, then Forwardlinks, then the collapsed "Keyboard shortcuts" row, and no section follows it

#### Scenario: The collapsed reference sits at the panel's bottom
- **WHEN** the reference is collapsed and the page-metadata sections are shorter than the panel
- **THEN** the reference row sits at the panel's bottom edge rather than directly beneath the page-metadata sections

#### Scenario: The collapsed reference stays at the panel's bottom while the panel scrolls
- **GIVEN** the page-metadata sections are long enough to overflow the panel
- **WHEN** the user scrolls the panel
- **THEN** the collapsed reference row remains at the panel's bottom edge

#### Scenario: The open reference grows upward from the panel's bottom
- **WHEN** the user opens the reference while its row sits at the panel's bottom edge
- **THEN** the list expands upward from that edge, the panel remains the only scrolling region, and no scrolling area or height cap appears inside the reference

#### Scenario: The open reference stays fully reachable on a short window
- **GIVEN** the open reference is taller than the panel
- **WHEN** the user scrolls the panel
- **THEN** the whole list is reachable and no part of it is clipped or hidden behind the row

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
- **GIVEN** a page is open and the Backlinks and Forwardlinks sections are both open
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** the open page is unchanged, the search surface is unchanged, and Backlinks and Forwardlinks remain open

#### Scenario: The reference is a disclosure, not a modal surface
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** keyboard focus stays wherever the user left it, focus is not trapped, and no dismissal gesture is required to keep working

#### Scenario: The reference toggles by keyboard
- **WHEN** the user reaches the keyboard-shortcuts summary with the keyboard and activates it
- **THEN** the summary shows visible keyboard focus and the section opens and closes

## ADDED Requirements

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
