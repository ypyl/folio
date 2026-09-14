## REMOVED Requirements

### Requirement: A code block that ends a page keeps a block after it
**Reason**: Superseded by "A page always keeps an empty block at its end". The tail paragraph is no longer limited to a trailing code block or table, and the old requirement's "no empty paragraph after a paragraph" scenario is now false, so keeping both would state the invariant twice and contradict the new one.
**Migration**: None. The rule only broadens; no persisted state, file shape, or user action changes.

## ADDED Requirements

### Requirement: A page always keeps an empty block at its end
An open page SHALL always hold an empty paragraph after its last top-level block, whatever that block is (a paragraph, list, quote, heading, code block, or table), so a blank line to continue on is always visible at the end. The paragraph SHALL be maintained by the editor rather than authored: it is there whether the page was typed, pasted, or opened from a file, and it never accumulates — at most one is present, and it is appended only when the last block is not already an empty paragraph. Moving into it SHALL work the ways a user tries: `ArrowDown` from the block above it, and a click below that block. `Enter` inside a code block SHALL continue to add a code line, and `Mod-Enter` SHALL continue to exit the block.

#### Scenario: The empty block at the end of a page exists
- **GIVEN** an open page whose last block is not an empty paragraph
- **WHEN** the page renders
- **THEN** the document holds an empty paragraph after that block

#### Scenario: The end block follows any last block type
- **GIVEN** pages whose last block is, in turn, a paragraph, a list, a quote, and a heading
- **WHEN** each page renders
- **THEN** each shows an empty line after its last block

#### Scenario: Arrow down and click reach the end block
- **GIVEN** a page whose last block holds text, with the caret at the end of it
- **WHEN** the user presses `ArrowDown`, or clicks below the block, and types
- **THEN** the caret is in the empty paragraph after it and the typed text lands there, not in the block above

#### Scenario: Arrow down leaves a trailing code block
- **GIVEN** an open page whose last block is a code block, with the caret on the code block's last line
- **WHEN** the user presses `ArrowDown` and types
- **THEN** the caret is in the paragraph after the code block and the typed text lands there, not in the code

#### Scenario: Enter still adds a code line
- **GIVEN** the caret inside a code block that ends the page
- **WHEN** the user presses `Enter`
- **THEN** a new line is added inside the code block and no paragraph is inserted

#### Scenario: No empty paragraph accumulates
- **GIVEN** a page whose last block is already an empty paragraph
- **WHEN** the document changes
- **THEN** no second empty paragraph is appended

#### Scenario: An empty page shows one empty line
- **GIVEN** an open page with no content
- **WHEN** the page renders
- **THEN** the document holds exactly one empty paragraph and no second one is appended

## MODIFIED Requirements

### Requirement: Serialization never writes a trailing blank line
The Markdown a document serializes to SHALL end with a single newline and SHALL NOT end with blank lines, so the empty paragraph the editor maintains at the end of every page never reaches the vault: opening a page writes nothing, and editing it writes only the user's own text. Trimming SHALL be a property of every serialization the app performs — the change stream that drives autosave, the content the app reads for a draft, and the copy-as-markdown flavor — so no path disagrees about what the page holds.

#### Scenario: Opening a page that ends with a code block writes nothing
- **GIVEN** a vault file ending with a fenced code block
- **WHEN** the page is opened and left alone
- **THEN** the maintained paragraph does not mark the page dirty and the file is not rewritten

#### Scenario: Editing after the code block writes only the new text
- **GIVEN** the same page, with the caret moved into the paragraph after the code block
- **WHEN** the user types and the page saves
- **THEN** the file ends with the code fence, a blank line, and the typed paragraph, and carries no trailing blank line

#### Scenario: A hand-made trailing empty paragraph is not persisted
- **GIVEN** a page whose document ends with an empty paragraph
- **WHEN** the page saves
- **THEN** the file ends with the last non-empty block and a single newline

#### Scenario: Editing at the end of a page writes only the new text
- **GIVEN** an open page whose last block holds text, with the caret moved into the empty paragraph after it
- **WHEN** the user types and the page saves
- **THEN** the file ends with the last non-empty block and a single newline, and carries no trailing blank line
