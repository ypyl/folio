## 1. The line separator

- [x] 1.1 Add `src/editor/emptyLines.ts` with `separateEmptyListLines(markdown)`, and verify with unit tests that it inserts a blank line after `<br />` when the next line is more indented, and not when the next line is blank, a sibling at the same indent, or inside a fenced code block
- [x] 1.2 Cover `<br>`, `<br/>`, and ordered-list markers in the unit tests

## 2. Apply at the Markdown boundary

- [x] 2.1 Wrap every serialization with `separateEmptyListLines` (the `markdownUpdated` listener, `serialize()`, `serializeSlice()`, and `setContent()`'s canonical capture) and verify a round-trip test that an empty list item holding a code block serializes with the blank line
- [x] 2.2 Normalize the Markdown before every parse (`setContent()` and `insertParsedMarkdown()`) and verify a test that the currently-broken form (`* <br />` immediately followed by an indented fence) parses back to a code_block, not an `html` atom

## 3. Backspace on the empty line

- [x] 3.1 Add `handleEmptyItemBackspace()` to the existing keydown listener and verify that a genuinely empty item is removed
- [x] 3.2 Promote the item's remaining children to the parent before removing it, and verify that an empty item holding a code block leaves the code block at the parent level with the item gone and the caret at the end of the parent's text
- [x] 3.3 Verify the intercept is narrow: Backspace on a non-empty item still lifts it, and a held modifier leaves the key alone

## 4. Verification

- [x] 4.1 Add a test using the reported page shape (`folio/pages/ef migrations.md`) that opens the broken form and confirms the SQL survives as a code block
- [x] 4.2 Run `npx vitest run src/editor` and confirm every case passes
- [x] 4.3 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, and `npm run build` with no findings
- [x] 4.4 Run `npm test` and confirm the full suite passes with coverage thresholds met
- [x] 4.5 Run `npx openspec validate fix-empty-list-item-line --strict` and resolve any findings
- [x] 4.6 Bump the patch `version` in `package.json` and commit
