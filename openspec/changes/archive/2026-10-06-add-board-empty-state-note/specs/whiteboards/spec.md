# Spec Delta

## ADDED Requirements

### Requirement: A blank board shows a note naming its reference token

A board that holds no elements SHALL show a short note over its canvas. The note
SHALL name the board's `#!` reference token in one of the two reference forms,
so the user can write it in a page, and SHALL say that drawing saves the board.
For a board whose name has no `#!` token form, the note SHALL omit the token and
describe the reference without it. The note SHALL be presentational only: it
SHALL NOT block drawing or selection on the canvas, SHALL NOT be a dialog, SHALL
NOT trap focus, and SHALL require no dismissal. It SHALL disappear once the board
holds an element and SHALL NOT reappear for that open board. A board that holds
elements SHALL show no note. The note SHALL be styled from the app's design
tokens, like the rest of the board editor's chrome, and SHALL add no file and
change no board content.

#### Scenario: A new board shows the note

- **GIVEN** a vault with no board of that name
- **WHEN** the user activates a `#![[Architecture]]` reference and the blank
  board opens
- **THEN** the note is shown, names `#![[Architecture]]`, says drawing saves the
  board, and the vault holds no new file

#### Scenario: A board with elements shows no note

- **GIVEN** a saved board holding a drawing
- **WHEN** the board opens
- **THEN** no note is shown

#### Scenario: The note clears on the first element

- **GIVEN** a blank board showing the note
- **WHEN** the user draws an element
- **THEN** the note disappears and does not return while the board stays open

#### Scenario: The note does not block the canvas

- **GIVEN** a blank board showing the note
- **WHEN** the user draws on the canvas under the note
- **THEN** the element is created, because the note takes no pointer input

#### Scenario: A name with no token form still shows the note

- **GIVEN** a board whose name has no `#!` token form
- **WHEN** the blank board opens
- **THEN** the note is shown, describes the reference, and names no token
