## 1. Adapter fix

- [x] 1.1 Add a private `destroyed` flag to `MilkdownAdapter`: `destroy()` sets it and awaits any created editor; `mount()` checks it after `create()` resolves and, if set, awaits `editor.destroy()` and returns without wiring listeners, `latest`, or `this.editor`. Verify: `npx tsc -b` passes and existing editor tests stay green.

## 2. Regression tests

- [x] 2.1 Add a test rendering `EditorPane` with the real `MilkdownAdapter` under `StrictMode` (same shape as the reproduction) that asserts exactly one `.milkdown` root and that the editor is seeded with the page's content. Verify: the test fails on the pre-fix adapter (reproducing two roots) and passes after the 1.1 fix.
- [x] 2.2 Add a rapid-switch teardown test: a deferred `create()` that resolves after `destroy()` verifies the pending editor is torn down and no `.milkdown` root remains. Verify: passes with the fixed adapter.

## 3. Gates

- [x] 3.1 Run full gates: `npm test` (all files, coverage ≥80), `npm run lint`, `npm run build`, `openspec validate --changes`. Verify: all green, no new warnings.
- [ ] 3.2 Dev smoke: `npm run dev`, open `sample/` vault, verify a page renders exactly one editor (no empty slot) and rapid page switching stays single-editor. Verify: manual, matches the html structure.