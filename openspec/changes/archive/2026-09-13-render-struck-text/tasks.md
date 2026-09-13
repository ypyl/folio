## 1. Rename the decoration module

- [x] 1.1 `git mv src/editor/referenceBadges.ts src/editor/inlineDecorations.ts` and its test alongside it, update the three importers (`src/editor/milkdown.ts`, `src/components/shortcuts.test.ts`, the test file) and the exported names the module now covers (`createReferencePlugin` → `createInlineDecorationPlugin`, `referenceBadges` → `inlineDecorations`, `scanReferences` → `scanInline`), keeping the reference-specific exports as they are; verify `npx tsc -b` is clean and `npx vitest run src/editor/inlineDecorations.test.ts src/components/shortcuts.test.ts` passes with the rename only.

## 2. Decorate struck runs

- [x] 2.1 In the new module, add the struck-run match to the existing walk, pushing a `Decoration.inline` with the `strike` class for each run in the text node it already visits (design D1, D2); verify every existing reference test still passes unchanged.
- [x] 2.2 Add the decoration's rule to `src/components/EditorPane.module.css` beside the badge's, using Kami tokens only; verify the rule adds a line through the run and changes nothing else about the text.
- [x] 2.3 Extend the module's test with the run rules and the interaction: `~~a~~` and `~~a b~~` decorated, `~~~~`, `~~ spaced ~~`, `~single~`, `~~a~~b~~`, and `~~~~~` plain; inline code and fenced code skipped; a struck reference decorated by both schemes; and an edit inside a block re-decorating that block only (reuse the existing invalidation test's shape). Verify `npx vitest run src/editor/inlineDecorations.test.ts` passes.

## 3. Gates

- [x] 3.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; verify all three are clean.
- [x] 3.2 Run `npm test` and `npm run build`; verify both pass.

## 4. Browser verification

- [x] 4.1 With a real vault, verify the reported case: a page holding a nested bullet with `~~Responsible AI, Safety & Risk for Architects~~` renders the run crossed, and the saved file still contains the tildes unchanged.
- [x] 4.2 Verify the boundaries in the same session: a lone `~`, a space-padded pair, tilde runs inside inline and fenced code, and `~~#Inbox~~` (badge plus line, with the badge still opening its page).
- [x] 4.3 Verify the gesture path is untouched: typing inside the run keeps it decorated, saving and reopening the page still shows it crossed, and copying the run to the clipboard carries the literal tildes.
