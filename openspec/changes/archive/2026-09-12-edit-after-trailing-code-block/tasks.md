## 1. Document-tail module

- [x] 1.1 Add `src/editor/documentTail.ts` exporting a `$prose` plugin whose `appendTransaction` appends an empty paragraph when the document's last child is a code block (and nothing otherwise), plus `trimTrailingBlankLines` implementing design D2; verify with unit cases for the trim (a trailing blank line, several of them, none, and an interior blank line left alone) via `npx vitest run src/editor/documentTail.test.ts`.
- [x] 1.2 Verify the plugin terminates and does not stack: a document already ending in a paragraph gets no extra node, and a document ending in a code block gets exactly one.

## 2. Adapter wiring

- [x] 2.1 In `src/editor/milkdown.ts`, use the plugin in the editor's chain and wrap `serializerCtx` once so every serialization is trimmed (design D2, D3); verify `npx tsc -b` is clean and the existing editor suite still passes.
- [x] 2.2 In `src/editor/milkdown.test.ts`, add cases against the real editor: seeding a page that ends with a fenced code block leaves an empty paragraph after it and reports no change (the seed echo stays suppressed); the same page's `getContent()` is the seeded text with no trailing blank line; a page ending with a paragraph gains no extra block; and typing inside the code block still adds code lines without removing the maintained paragraph.
- [x] 2.3 Verify the copy path is unaffected: the copy-as-markdown flavor for a selection ending in a code block carries no trailing blank line (`npx vitest run src/editor/milkdown.test.ts`).

## 3. Gates

- [x] 3.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; verify all three are clean.
- [x] 3.2 Run `npm test` and `npm run build`; verify both pass.

## 4. Browser verification

- [x] 4.1 With an OPFS folder open as the vault and a page whose markdown ends with a fenced code block: verify the document holds a paragraph after the block, that `ArrowDown` from the last code line plus typing lands in that paragraph (not in the code), that clicking below the code block lands there too, and that the gutter numbers for the page are unchanged.
- [x] 4.2 Verify the file: opening the page shows no dirty state and leaves the file byte-identical; typing in the paragraph after the code block writes exactly the fence, a blank line, and the typed text, with no trailing blank line. Then verify `Enter` inside the code block still adds a code line and `Mod-Enter` still exits the block.
