## RENAMED Requirements

- FROM: `### Requirement: References are plain editable text`
- TO: `### Requirement: References render as clickable badges`

## MODIFIED Requirements

### Requirement: References render as clickable badges
In the editor, references in Folio's two forms — `#word` and `#[[Page]]` — SHALL render as visible badges: a chip-styled inline mark (chip background, brand-colored text, pointer cursor) covering the reference's literal text, visually distinct from surrounding prose. The text SHALL remain ordinary editable text: the badge is presentational, introduces no node of its own, and editing it edits the underlying Markdown directly. The badge's appearance SHALL NOT depend on the caret or focus — a reference SHALL look the same whether or not its block is being edited, and moving the caret SHALL NOT repaint it. No badge SHALL render for a reference token inside an inline code span or a fenced code block. Plain `[[Page]]` wikilinks SHALL render as literal editable text with no badge.

#### Scenario: A reference renders as a visible badge
- **WHEN** the editor body contains `#Inbox` or `#[[reading list]]`
- **THEN** the token renders as a badge over its literal text, visibly distinct from the surrounding prose

#### Scenario: Badges do not follow the caret
- **WHEN** the user places the caret in the block containing a reference, or moves focus in and out of the editor
- **THEN** the reference still renders as a badge and the surrounding text neither moves nor repaints

#### Scenario: A reference is editable text
- **WHEN** the editor body contains `#ideas` or `#[[reading list]]`, and the user selects or arrows into the reference and edits its characters
- **THEN** it renders as a badge over ordinary editable text — no non-editable node is introduced — and editing changes the underlying Markdown and updates the badge to cover the new text

#### Scenario: Code is never badged
- **WHEN** the editor body contains an inline code span `` `#word` `` or a fenced code block containing `#word`
- **THEN** no badge is rendered inside the code

#### Scenario: A plain wikilink stays literal
- **WHEN** the editor body contains `[[Inbox]]`
- **THEN** it appears as literal editable text with no badge

## ADDED Requirements

### Requirement: Opening a reference from the editor
The editor SHALL open a reference's target page when the user plain-clicks the reference's badge, or presses Mod+Enter (Cmd/Ctrl+Enter) with the caret inside a reference. Opening SHALL resolve the reference's name to a page exactly as the links panel does: the existing page when one matches, otherwise a blank page that materializes on first save. Activating a reference to the page already open SHALL NOT navigate. The keyboard shortcut SHALL be listed in the app's keyboard-shortcuts reference.

#### Scenario: Clicking a badge opens the page
- **WHEN** the user clicks the badge of a reference whose target page exists
- **THEN** that page opens in the editor pane

#### Scenario: Clicking a reference to a missing page opens a blank page
- **WHEN** the user clicks the badge of a reference whose target has no file on disk
- **THEN** a blank page for that target opens and is written on first save

#### Scenario: The keyboard opens the reference at the caret
- **WHEN** the caret sits inside a reference and the user presses Mod+Enter
- **THEN** the target page opens

#### Scenario: A self-reference does not navigate
- **WHEN** the open page contains a reference to its own title and the user activates it
- **THEN** the app stays on the open page
