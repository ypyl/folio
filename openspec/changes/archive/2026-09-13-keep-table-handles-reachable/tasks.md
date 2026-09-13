## 1. Room for a leading table

- [x] 1.1 Add the leading-table margin to `src/components/EditorPane.module.css`, next to `.ProseMirror > :first-child` (which it overrides), with the reason in the comment; verify in Chrome that a page whose first block is a table draws the column handle inside the pane and that pressing it selects the column and opens its group.
- [x] 1.2 Add the DOM-shape assertion to `src/editor/milkdown.test.ts` (design D3): a page whose content begins with a table has the table block as the editable root's first child, and a page whose content begins with a paragraph does not; verify `npx vitest run src/editor/milkdown.test.ts` passes.
- [x] 1.3 Verify in Chrome that nothing else moved: a page whose first block is a heading or paragraph starts at the pane's top padding with its first-block margin zeroed; a table that is not the page's first block sits where it did; the pane's padding is unchanged; and the leading table's line number sits on its first line.
- [x] 1.4 Verify the room is not content in Chrome: save a page whose content begins with a table and confirm the Markdown is the canonical table with nothing added, then reopen the page and confirm the handle is still reachable.
- [x] 1.5 Add the Tables-section note to `DESIGN.md`: why a table that begins a page keeps a top margin where every other first block has its margin zeroed; verify the section reads as one rule with its reason.

## 2. Gates

- [x] 2.1 Bump `version` in `package.json` by a patch increment (a fix to an unreachable control) and sync `package-lock.json`; verify the header badge shows it in the running app.
- [x] 2.2 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify the last command is clean.
- [x] 2.3 Run `npm test` and `npm run build`; verify both pass with the coverage thresholds held, and record the delta (one stylesheet rule).
- [x] 2.4 Sweep the dev server with `npm run kill:dev` and verify no `vite` process is left running.
