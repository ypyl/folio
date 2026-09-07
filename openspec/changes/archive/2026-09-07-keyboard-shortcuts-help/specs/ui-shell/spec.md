# ui-shell Delta

## MODIFIED Requirements

### Requirement: Header shows brand, content-width search, and an active-vault status slot
The header SHALL show the Folio brand at the left, a search input centered over and spanning the center pane's column, and in the right slot the active vault's status (the folder's name and its file count) next to a circular question-mark help button. The slot SHALL NOT open a picker, switch folders, or re-grant permission — adding, switching, or re-granting a folder happens on the folder rail. The help button is the slot's only action: activating it opens the keyboard-shortcuts reference. The search input's width SHALL match the content column it sits over (capped at a readable maximum), not a fixed narrow box, so the box and its dropdown align with the content beneath. Search behavior — the results dropdown, matching, keyboard, and edge states — is specified by the search capability.

#### Scenario: Search spans the content column
- **WHEN** the shell renders at desktop width
- **THEN** the search input is horizontally aligned with the center pane and spans that column's width, not a fixed-width box

#### Scenario: Search behavior lives with the search capability
- **WHEN** the user types into the search input
- **THEN** the input's behavior is the search capability's: a results dropdown, keyboard shortcuts, and empty states, none of which were present while the input was inert

#### Scenario: The slot shows status and performs no actions
- **WHEN** a vault is active
- **THEN** the header slot shows the folder's name and file count beside the question-mark help button, and the slot performs no other actions: it opens no picker, switches no folder, and re-grants no permission

#### Scenario: The help button shows without a vault
- **WHEN** no vault is active
- **THEN** the header slot still shows the question-mark help button, while the vault status text is absent

## ADDED Requirements

### Requirement: A question-mark button opens a keyboard-shortcuts reference
The header's question-mark button SHALL open a modal dialog over the shell that lists the app's keyboard shortcuts: the editor's formatting and editing shortcuts (bold, italic, inline code, undo, redo, heading levels, paragraph, ordered and bullet lists, blockquote, code block, indent and outdent, line break) and the app's search shortcut. The dialog SHALL list only shortcuts the app actually provides, and SHALL show each as a readable label with its key combination. The dialog SHALL close when the user presses Escape or activates a close control. Opening the dialog SHALL move keyboard focus into it; closing SHALL return focus to the question-mark button. The dialog SHALL be exposed to assistive technology as a dialog.

#### Scenario: The button opens the reference
- **WHEN** the user activates the question-mark help button
- **THEN** a modal dialog listing the app's keyboard shortcuts opens over the shell

#### Scenario: The reference lists only real shortcuts
- **WHEN** the shortcuts dialog is open
- **THEN** it lists the editor's formatting and editing shortcuts and the app's search shortcut, and lists no shortcut for capabilities that provide none (such as links)

#### Scenario: Escape closes and returns focus
- **WHEN** the shortcuts dialog is open and the user presses Escape
- **THEN** the dialog closes and keyboard focus returns to the question-mark button

#### Scenario: The dialog is accessible
- **WHEN** the shortcuts dialog is open
- **THEN** it is exposed to assistive technology as a dialog, and opening it moves keyboard focus into the dialog