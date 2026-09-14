## 1. Editor tail invariant

- [x] 1.1 In `src/editor/documentTail.ts`, replace the `CLOSED_TAIL` condition with "the last child is not an empty paragraph" and delete the now-unused set and its comments; update the file's header comment and `trimTrailingBlankLines` comment to describe the always-present tail. Verify `npx vitest run src/editor/documentTail.test.ts` passes.
- [x] 1.2 Extend `src/editor/documentTail.test.ts` with cases for a last block that is a paragraph, a list, a quote, and a heading, each gaining an empty paragraph after it; verify the tests fail before 1.1 and pass after.
- [x] 1.3 Add cases that the tail never accumulates (a document already ending in an empty paragraph gains no second one), and that an empty document holds exactly one empty paragraph. Verify with `npx vitest run src/editor/documentTail.test.ts`.
- [x] 1.4 Keep the existing code-block and table cases passing (the general rule subsumes them) and confirm `ArrowDown` out of a trailing code block still lands in the tail paragraph via the existing editor tests.

## 2. Serialization stays canonical

- [x] 2.1 Confirm every serialization path trims the tail: assert that a document ending with the maintained paragraph serializes to a single trailing newline through the change stream, `getContent()`, and the copy-as-markdown flavor. Verify `npx vitest run src/editor/milkdown.test.ts` passes.
- [x] 2.2 Remove the redundant `ensureTrailingNewline` helper from `src/vault/index.ts` (added in 0.6.1; `trimTrailingBlankLines` already guarantees the single newline) and restore the plain-content expectations it introduced in `src/vault/useIndex.test.ts` and `src/App.test.tsx`. Verify `npx vitest run src/vault/index.test.ts src/vault/useIndex.test.ts` passes.

## 3. Integration behavior

- [x] 3.1 Verify the line-number gutter is unchanged when the tail paragraph is present: the trailing line shows no number and every real block keeps its number. Verify with `npx vitest run src/editor/gutter.test.ts`.
- [x] 3.2 Verify opening a page whose last block holds text does not mark it dirty and writes nothing (the maintained tail is part of the baseline). Verify with the dirty-state/autosave tests in `src/App.test.tsx`.
- [x] 3.3 Verify undo: one undo reverses one user edit while the tail is re-derived, so the empty line is still present afterwards. Verify with an editor or App-level test that exercises undo after typing.

## 4. Browser check

- [x] 4.1 With `npm run dev:test` (confirm the log says `ready in`, note the port), open a page and a journal in Chromium and check: a blank line shows after a trailing paragraph, list, and quote; `ArrowDown` and a click below the last block land the caret on it; after typing and the autosave settles the file on disk still ends with a single `\n` and no blank line. Run `npm run kill:dev` afterwards.

## 5. Finish

- [x] 5.1 Bump `version` in `package.json` (minor: a new user-facing behavior).
- [x] 5.2 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, and `npm test`; verify all pass and the working tree is clean apart from the intended changes.
