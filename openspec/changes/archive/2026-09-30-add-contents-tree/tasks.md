## 1. Tree derivation

- [x] 1.1 Add `ContentNode` (`ContentEntry` plus `children`) and `buildContentTree(entries)` to `src/vault/contents.ts`: a heading parents the run of deeper headings before the next heading at its level or lower. Verify with unit tests in `src/vault/contents.test.ts` covering a nested run, siblings closing a run, a skipped level (`#` then `###`), multiple roots, and a single heading.

## 2. Panel rendering and collapse state

- [x] 2.1 In `ContentList` (`src/components/MetaPanel.tsx`), derive the tree from `contents` with `useMemo` and render it as nested lists, keeping the level-based inline `paddingLeft` on each row. Give every heading with a subtree an `aria-expanded` disclosure button (accessible name "Collapse <text>" / "Expand <text>"), a same-width `aria-hidden` spacer for leaves, and keep the label button calling `onLocate`. Verify tests assert nesting/toggle (a subtree's rows hidden and restored), that a leaf has no disclosure, and that activating a label calls `onLocate`.
- [x] 2.2 Hold the collapse state in `MetaPanel` as a set of collapsed `block` indices scoped to the open page, resetting when `activePath` changes (adjust-state-during-render per design D2). Verify a test collapses a subtree, re-renders with a different `activePath`, and sees every heading expanded.
- [x] 2.3 Add the chevron, spacer, and nested-list styles to `src/components/MetaPanel.module.css`, reusing the accordion summary's border-rotate chevron and resetting nested `ul` margin/padding/list-style so indentation stays level-based. Verify the styles are present and lint/format pass.

## 3. Verify and finish

- [x] 3.1 Start the app (`npm run dev:test`), open a vault with a multi-level page, and confirm in the browser that headings nest, a subtree collapses and expands, activating a label still locates the heading, switching pages expands everything, and no `.folio/` entry is written; sweep the server with `npm run kill:dev`.
- [x] 3.2 Run `npm run test` and `npm run build`; both pass.
- [x] 3.3 Run `npx oxlint --fix`, then `npm run fmt`, and confirm clean with `npx oxlint --deny-warnings --format=agent`; bump `version` in `package.json` as part of the commit (MINOR).
