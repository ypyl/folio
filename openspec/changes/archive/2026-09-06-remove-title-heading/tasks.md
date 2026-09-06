## 1. Pane change

- [x] 1.1 Remove the `<h1 className={styles.title}>` from `src/components/EditorPane.tsx` and the `.title` block from `src/components/EditorPane.module.css`; the pane then renders the `.document` wrapper with the editor surface only. Verify: `npx tsc -b` passes.

## 2. Test updates

- [x] 2.1 In `src/components/EditorPane.test.tsx`, replace the "renders the title heading" test with one asserting the editor is mounted and seeded with the initial content and no `heading` role is present. Verify: `npx vitest run src/components/EditorPane.test.tsx` passes.
- [x] 2.2 In `src/App.test.tsx`, replace the six `heading level 1` page-title assertions with: no title heading in the pane + the editor seeded with the open page's Markdown (via the fake-editor `setContents`). Cover the open-page, journal-entry, sidebar-switch, and last-known-vanish cases. Verify: `npx vitest run src/App.test.tsx` passes.

## 3. Gates

- [x] 3.1 Run full gates: `npm test` (all files, coverage ≥80), `npm run lint`, `npm run build`, `openspec validate --changes`. Verify: all green, no new warnings.
- [x] 3.2 Dev smoke: `npm run dev`, open pages from `sample/` — the pane shows only the file content, no title line above it; save and scroll behaviors from the recent fixes still hold. Verify: manual.