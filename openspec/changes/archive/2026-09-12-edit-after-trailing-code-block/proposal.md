## Why

A page whose last block is a code block leaves the caret with nowhere to go. `Enter` inside the block adds a code line, which is what a code block is for; `ArrowDown` at the last code line does nothing, because leaving the block resolves to a text position after it and there is none; and clicking below the block is outside the content. So the gestures a user actually reaches for either do nothing or, worse, land the text in the code: measured in Chrome with the caret at the end of a trailing fenced block, `ArrowDown` then typing produced `const a = 1AFTER` inside the fence. `Mod-Enter` does exit the block and is listed in the shortcuts reference, but a user who does not know it has no way to continue their page and can silently corrupt code trying.

## What Changes

- The editor keeps an empty paragraph after a code block that ends the document, so there is always a block to move into and type in. `ArrowDown` from the last code line and a click below the block now land there.
- The file is unaffected: trailing blank lines are trimmed when a document is serialized, so the maintained paragraph never reaches the vault and opening such a page writes nothing.
- A page ending with a paragraph is unchanged, and so is everything else about code blocks: `Enter` still adds a code line, `Mod-Enter` still exits, `Backspace` at the start of a one-line block still turns it back into a paragraph.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: "A code block that ends a page keeps a block after it" — new requirement covering the paragraph the editor maintains after a trailing code block, and the moves it makes possible.
- `page-editing`: "Serialization never writes a trailing blank line" — new requirement covering what the canonical Markdown of a document ends with, so the maintained paragraph stays out of the file.

## Impact

- A new editor module holding the document-tail plugin and the trim helper, plus the adapter's wiring (one more plugin, and the serializer wrapped once so every path agrees).
- No dependency, no storage or index change, no ADR: the document model is unchanged, and the file stays the source of truth (ADR-0001) because the trim moves the serialized form *toward* the file's canonical shape, not away from it.
- Non-goals: no gap-cursor, no change to `Enter` inside a code block, no change to the shortcuts reference, no new control anywhere.

## Note on a visible side effect

A trailing empty paragraph the user created by hand is no longer persisted: it renders as nothing in Markdown, and the next save writes the file without the trailing blank line. A file that already ends with several blank lines is normalized to one on its next save.
