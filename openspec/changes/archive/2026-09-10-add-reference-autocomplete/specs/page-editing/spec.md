## ADDED Requirements

### Requirement: Typing a reference offers existing matching pages
While the caret sits at the end of an in-progress reference token in the open page (`#` followed by word characters, or `#[[` followed by text), the editor SHALL offer a popup listing candidate pages whose names match the typed text. Candidates SHALL be existing pages only, listed in the app's page order (pinned pages first, then most recently modified), capped at a small fixed number of rows. A candidate matches when its name starts with the typed text, or when one of its words (delimited by space, `-`, or `_`) starts with it; matching SHALL be case-insensitive and SHALL NOT match a fragment inside a word. Journal pages SHALL be candidates like any other page. Each row SHALL show the page's name exactly as it exists on disk.

The popup SHALL NOT appear when the typed text is empty, when no candidate matches, when the reference being typed sits inside an inline code span or a fenced code block, or when the caret is not at the end of the token (for example inside an existing `#[[reading list]]`, or after a `/` that closes the word form).

#### Scenario: Typing a reference prefix lists matching pages
- **WHEN** the user types `#rea` in an open page and pages named `reading` and `reading list` exist
- **THEN** both appear as rows, and the page matching the typed prefix most recently (pinned first, then last modified) is the first row

#### Scenario: A word inside a name matches
- **WHEN** the user types `#[[list` and a page named `reading list` exists
- **THEN** `reading list` appears as a row

#### Scenario: Journal days are candidates
- **WHEN** the user types `#2026` and journal days under `journals/` exist for that year
- **THEN** those days appear as rows showing their date names (`2026-09-10`), with no journal-specific styling or section header

#### Scenario: Rows show the on-disk name
- **WHEN** the vault holds `Reading.md` and the user types `#read`
- **THEN** the row reads `Reading` and not `read`

#### Scenario: A name containing a space completes from either trigger
- **WHEN** the user types `#reading` and picks the page `reading list`
- **THEN** the in-progress token is replaced by `#[[reading list]]`

#### Scenario: A bare `#` opens nothing
- **WHEN** the user types `#` at the start of a line, before typing any name character
- **THEN** no popup appears, and typing a space next still produces a Markdown heading

#### Scenario: No matches means no popup
- **WHEN** the user types `#zzz` and no page name matches
- **THEN** no popup appears and the editor behaves as it does today

#### Scenario: Code is never completed
- **WHEN** the caret is inside an inline code span or a fenced code block and the text contains `#rea`
- **THEN** no popup appears

#### Scenario: A caret inside a token is not completed
- **WHEN** the caret sits inside `#[[reading list]]` rather than at its end, or after `#tag/`
- **THEN** no popup appears

### Requirement: The completion popup is keyboard-navigable
The first row SHALL be active as soon as the popup appears. `ArrowDown` and `ArrowUp` SHALL move the active row, wrapping at the ends. `Enter` and `Tab` SHALL accept the active row. `Escape` SHALL dismiss the popup. The popup SHALL claim only these unmodified keys, and only while it is visible; while the popup is not visible every keybinding SHALL behave exactly as it does without reference completion. Keys with a modifier (`Ctrl`, `Cmd`, `Alt`) and `Shift+Tab` SHALL NOT be claimed, so `Mod+Enter` keeps activating the reference at the caret. Accepting or dismissing SHALL keep that token text from reopening the popup until the text changes. The popup SHALL hide when the editor loses focus.

#### Scenario: Arrow keys move the active row
- **WHEN** three rows are shown and the user presses `ArrowDown` twice, then `ArrowUp` once
- **THEN** the active row is the second row, and pressing `ArrowUp` again wraps to the last

#### Scenario: Type and Enter accepts the first row
- **WHEN** the user types `#rea` and presses `Enter`
- **THEN** the best matching row is accepted and the paragraph is not split

#### Scenario: Tab accepts the active row
- **WHEN** the popup is visible and the user presses `Tab`
- **THEN** the active row is accepted and focus stays in the editor

#### Scenario: Escape dismisses without accepting
- **WHEN** the popup is visible and the user presses `Escape`
- **THEN** the popup closes, the typed text is unchanged, and the popup does not reopen while that same token text remains

#### Scenario: A dismissed token reopens after an edit
- **WHEN** the user dismisses the popup for `#rea` and then types another character
- **THEN** the popup may appear again for the new token text

#### Scenario: With the popup hidden, editor keys are unchanged
- **WHEN** no popup is visible and the user presses `Enter`, `Tab`, or `ArrowDown`
- **THEN** the paragraph is split, the list item is indented, or the caret moves, exactly as without this change

#### Scenario: Modified keys are never claimed
- **WHEN** the popup is visible and the user presses `Mod+Enter`
- **THEN** the reference at the caret is activated as before, and the popup does not accept a row

#### Scenario: Losing focus hides the popup
- **WHEN** the popup is visible and the user clicks the sidebar
- **THEN** the popup is hidden

### Requirement: Accepting a candidate writes the reference and saves it normally
Accepting a row SHALL replace the in-progress token with the complete reference token for the picked page, in the page's on-disk casing, keeping the form the user was typing (a `#[[` trigger inserts the bracketed form; a `#` trigger inserts `#name`, escalating to `#[[name]]` when the name is not a single word). The caret SHALL land immediately after the inserted token, with no trailing space added. The insertion SHALL be one edit that reaches the page's draft and the debounced save like any other edit, so it round-trips to Markdown and is undoable. Focus and the document selection SHALL remain in the editor.

#### Scenario: Picking a word name inserts the word form
- **WHEN** the user types `#read` and accepts the page `reading`
- **THEN** the page contains `#reading` and the caret sits after it

#### Scenario: A bracketed trigger keeps its brackets
- **WHEN** the user types `#[[read` and accepts the page `reading`
- **THEN** the page contains `#[[reading]]`

#### Scenario: The picked name uses its on-disk casing
- **WHEN** the user types `#read` and accepts the page `Reading`
- **THEN** the page contains `#Reading`

#### Scenario: The insertion saves and round-trips
- **WHEN** the user accepts a row and waits for the debounced save
- **THEN** the file on disk contains the reference token, reopening the page shows the same token, and a single undo reverts the insertion

#### Scenario: Focus stays in the editor
- **WHEN** the user accepts a row with `Enter`, or picks a row with the mouse
- **THEN** the editor keeps focus, the caret is after the inserted token, and the page is not navigated
