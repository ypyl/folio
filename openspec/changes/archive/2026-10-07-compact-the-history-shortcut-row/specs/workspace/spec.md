# Spec Delta

## MODIFIED Requirements

### Requirement: The right panel's last section lists the shortcuts the app binds

The right panel SHALL hold the keyboard-shortcuts reference as its last
collapsible section, collapsed by default and labelled "Keyboard shortcuts". Its
summary SHALL sit at the panel's bottom edge whether collapsed or open. Opening
it SHALL expand the reference upward from that edge and SHALL NOT introduce a
scrolling area or height cap of its own. It SHALL list only the shortcuts the
app actually binds — undo and redo in the editor, the chord that opens a
reference at the caret, the two history-trail chords on one shared row, and the
app's search shortcuts — and SHALL list no formatting or table chord, because
the page surface is edited as Markdown so no such action exists. Each row SHALL
show a readable label with its keys as key tokens. The section SHALL be present
and openable in every state, and opening it SHALL move no focus, trap no focus,
and require no dismissal. The panel SHALL carry an accessible name describing
the whole panel.

#### Scenario: The panel ends with the reference

- **WHEN** the shell renders with a folder open
- **THEN** the panel's sections are Contents, Links, then the collapsed
  "Keyboard shortcuts" row, and nothing follows it

#### Scenario: The collapsed reference sits at the panel's bottom

- **WHEN** the reference is collapsed
- **THEN** its row sits at the panel's bottom edge

#### Scenario: The open reference grows upward

- **WHEN** the user opens the reference while its row sits at the panel's bottom
- **THEN** the list expands upward from that edge and is the only part that grows

#### Scenario: The reference is reachable in every state

- **GIVEN** the app with no folder open
- **WHEN** the shell renders
- **THEN** the keyboard-shortcuts section is present and opens

#### Scenario: Opening the reference disturbs nothing

- **GIVEN** a page is open
- **WHEN** the user opens the reference
- **THEN** the open page and the spotlight are unchanged and focus stays where it
  was

#### Scenario: No formatting or table chord is listed

- **WHEN** the user reads the reference
- **THEN** no row names a formatting or table action

#### Scenario: The history chords are listed

- **WHEN** the user reads the reference
- **THEN** it lists one row labelled "Back / Forward" carrying both history
  chords, rather than a row for each

### Requirement: A shortcut row applies its key combination when activated

Every entry in the shortcuts reference SHALL be a control that applies its own
combination when activated, so a row listing more than one combination offers
one control per combination. Activating an editor row SHALL produce the same
result as pressing that combination in the editor; activating a search row SHALL
open the search spotlight, focused and selected; activating a history chord
SHALL step the trail in that chord's direction, exactly as the corresponding
Back or Forward control does. A control SHALL be named for both its own action
and its keys, so the two controls of a shared row keep distinct names. A control
SHALL be disabled when the surface it acts on is unavailable — controls acting
on the editor while no editor is open, the search controls while no folder is
open or the open folder is still loading, and each history chord while the trail
has nowhere to step in its direction — so one chord of a shared row can disable
while the other stays live; the reference SHALL remain listed in every state
whether or not a control is disabled. Activating a control SHALL leave focus
where the user can continue, and a combination the current context does not
claim SHALL leave the document unchanged.

#### Scenario: Each key combination is its own control

- **WHEN** the user opens the reference
- **THEN** a row listing two combinations offers two controls, each applying its
  own

#### Scenario: Unavailable rows are disabled but listed

- **GIVEN** no editor is open, or no folder is open
- **WHEN** the user opens the reference
- **THEN** the rows for the unavailable surface are dimmed and do nothing, while
  every row remains listed

#### Scenario: Activating a search row opens the spotlight

- **GIVEN** a folder is open and loaded
- **WHEN** the user activates the search row's control
- **THEN** the spotlight opens with focus in its input

#### Scenario: Activating a history row steps the trail

- **GIVEN** the user has opened Alpha and then Beta
- **WHEN** the user activates the shared row's Back control
- **THEN** Alpha opens and the row's Forward control becomes live

#### Scenario: A history row with nowhere to step is disabled

- **GIVEN** the user has opened Alpha and then Beta and stepped Back to Alpha
- **WHEN** the user opens the reference
- **THEN** the shared row's Back control is dimmed while its Forward control is
  live

#### Scenario: Focus returns to the editor

- **GIVEN** a page is open with the caret in it
- **WHEN** the user activates an editor row's control
- **THEN** the combination is applied and focus is in the editor

#### Scenario: A combination the context does not claim changes nothing

- **GIVEN** a page is open with the caret in an ordinary paragraph
- **WHEN** the user activates a row the context does not claim
- **THEN** the document is unchanged and no error is shown
