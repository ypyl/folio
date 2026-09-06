## 1. CSS change

- [x] 1.1 Remove `max-width: 720px;` from the `.document` rule in `src/components/EditorPane.module.css`, keeping its padding. Verify: `npm run build` passes and the pane still lays out (no layout regressions in other panes).

## 2. Gates

- [x] 2.1 Run full gates: `npm test` (all files, coverage ≥80), `npm run lint`, `npm run build`, `openspec validate --changes`. Verify: all green, no new warnings.
- [x] 2.2 Dev smoke: `npm run dev`, open a page in `sample/` and widen the window — the editor surface spans the full pane, text stays off the edges via the padding. Verify: manual.