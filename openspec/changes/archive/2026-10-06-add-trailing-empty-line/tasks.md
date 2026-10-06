# Tasks

## 1. The terminal-empty-line normalization

- [x] 1.1 Add `src/vault/trailing.ts` exporting `withTrailingBlankLine(text)`: strip trailing newlines, append `\n\n`, and return `\n` when nothing but newlines remain. Add `src/vault/trailing.test.ts` covering no trailing newline, one newline, several trailing blank lines, empty, whitespace-only, and idempotence, and verify `npm run test:unit` passes.
- [x] 1.2 Normalize in `upsertPage` (`src/vault/index.ts`) so the text written to `storage.write` and the text stored on the page in the index are both `withTrailingBlankLine(content)`; add a case asserting the written bytes and the indexed content for a page saved without a trailing newline, and verify `npm run test:unit` passes.
- [x] 1.3 Normalize the editor seed in `src/App.tsx` (`initialContent`) and add an `src/App.integration.test.tsx` case: opening a page whose file lacks the trailing empty line shows the empty line and leaves the file unchanged; an edit then saves a file ending in exactly one empty line; an empty page saves as a single empty line. Verify `npm run test:integration` passes.

## 2. Style and integration checks

- [x] 2.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`, and verify all pass.
- [x] 2.2 Run `npx tsc -b`, `npm run test:unit`, `npm run test:integration`, and `npm run build`, and verify all pass together.
- [x] 2.3 Bump `version` in `package.json` (minor, new user-facing behavior) and run `npx oxlint --deny-warnings --format=agent`, `npm run test:unit`, and `npm run test:integration`, all green.
