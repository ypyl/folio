## ADDED Requirements

### Requirement: A code block that ends a page keeps a block after it
An open page whose last top-level block is a code block SHALL hold an empty paragraph after it, so a block to continue in always exists. The paragraph SHALL be maintained by the editor rather than authored: it appears whether the code block was typed, pasted, or opened from a file, and it never appears after a block that is already a paragraph, so the document does not accumulate empty blocks. Moving into it SHALL work the ways a user tries: `ArrowDown` from the code block's last line, and a click below the code block. `Enter` inside the code block SHALL continue to add a code line, and `Mod-Enter` SHALL continue to exit the block.

#### Scenario: The block after a trailing code block exists
- **GIVEN** an open page whose markdown ends with a fenced code block
- **WHEN** the page renders
- **THEN** the document holds an empty paragraph after the code block

#### Scenario: Arrow down leaves a trailing code block
- **GIVEN** an open page whose last block is a code block, with the caret on the code block's last line
- **WHEN** the user presses `ArrowDown` and types
- **THEN** the caret is in the paragraph after the code block and the typed text lands there, not in the code

#### Scenario: Enter still adds a code line
- **GIVEN** the caret inside a code block that ends the page
- **WHEN** the user presses `Enter`
- **THEN** a new line is added inside the code block and no paragraph is inserted

#### Scenario: No empty paragraph accumulates after a paragraph
- **GIVEN** a page whose last block is a paragraph
- **WHEN** the document changes
- **THEN** no extra empty paragraph is appended

### Requirement: Serialization never writes a trailing blank line
The Markdown a document serializes to SHALL end with a single newline and SHALL NOT end with blank lines, so the empty paragraph the editor maintains after a trailing code block never reaches the vault: opening such a page writes nothing, and editing it writes only the user's own text. Trimming SHALL be a property of every serialization the app performs — the change stream that drives autosave, the content the app reads for a draft, and the copy-as-markdown flavor — so no path disagrees about what the page holds.

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
