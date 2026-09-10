## ADDED Requirements

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
