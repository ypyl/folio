## 1. Fix

- [x] 1.1 In `src/components/EditorPane.tsx`, change the scroll-to-top effect's dependency from `[page]` to `[page?.path]`, so saves and index rebuilds of the same page no longer reset the pane's scroll. Verify: `npx tsc -b` passes and existing tests stay green.

## 2. Regression test

- [x] 2.1 Add a test in `src/components/EditorPane.test.tsx` (fake-editor harness): render a page, set `pane.scrollTop` to a nonzero value, re-render with a new page object of the same path (simulating the post-save index rebuild), and assert `scrollTop` is preserved; then re-render with a different path and assert `scrollTop === 0`. Verify: the test fails on the pre-fix dep (scrollTop reset on same-path re-render) and passes after 1.1.

## 3. Gates

- [x] 3.1 Run full gates: `npm test` (all files, coverage ≥80), `npm run lint`, `npm run build`, `openspec validate --changes`. Verify: all green, no new warnings.
- [x] 3.2 Dev smoke: `npm run dev`, open a page, scroll far down, make an edit and wait for the save — the pane must stay put; switching pages must reset scroll to the top. Verify: manual.