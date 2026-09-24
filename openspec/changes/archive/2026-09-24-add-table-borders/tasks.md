## 1. Styling

- [x] 1.1 In `src/components/EditorPane.module.css`, give `th`/`td` a `1px solid var(--border)` border on all sides, change the padding to `6px 10px`, and give `th` a `--warm-sand` background; remove the empty-cell `:has(> p > br:only-child)` inset-shadow rule; verify `npm run build` succeeds.
- [x] 1.2 Update the table comments in that file to describe the grid rather than the editorial style.
- [x] 1.3 Rewrite `DESIGN.md`'s Tables section: a full `--border` grid and frame, a `--warm-sand` header fill, symmetric padding, the empty-cell floor, and the existing top margin and caret strip.

## 2. Verification

- [x] 2.1 Run `npx vitest run` and confirm the suite passes (the table behavior tests are unchanged).
- [x] 2.2 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`, and confirm no lint or format issues remain.
- [x] 2.3 Check the rendering in a browser against a vault with a table and confirm the grid, frame, and header read as a table; sweep dev servers with `npm run kill:dev`.
- [x] 2.4 Bump `version` in `package.json` (minor, a user-facing rendering change).
