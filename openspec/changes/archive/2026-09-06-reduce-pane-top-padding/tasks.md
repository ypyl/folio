## 1. CSS change

- [x] 1.1 In `src/components/EditorPane.module.css`, change `.document` padding from `40px 48px 64px` to `20px 48px 64px`. Verify: `npm run build` passes.

## 2. Gates

- [x] 2.1 Run full gates: `npm test` (all files, coverage ≥80), `npm run lint`, `npm run build`, `openspec validate --changes`. Verify: all green, no new warnings.
- [x] 2.2 Dev smoke: `npm run dev` (fresh server), open a page in `sample/` — the content starts closer to the pane's top edge; sides and bottom unchanged. Verify: manual.