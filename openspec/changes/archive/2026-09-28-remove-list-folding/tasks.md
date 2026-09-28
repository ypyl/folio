## 1. Remove the folding callers and the editor seam

- [x] 1.1 In `src/components/EditorPane.tsx`, remove the rail `<div>`, `railRef`, `foldTargetsRef`, `updateRail()`, `onRailMouseDown`/`onRailClick`, the `adapter.onLayoutChange(...)` subscription, the fold-related `updateRail()` calls, the `ResizeObserver` (it exists only to re-glue fold controls), and the `FoldTarget`/`rail` imports; leave the image sync path (`updateImages`, mount seed) intact. Verify `npm run build` reports no unused-import or missing-symbol errors.
- [x] 1.2 In `src/editor/milkdown.ts`, remove the `collapsibleLists` plugin registration, `getFoldTargets()`, `toggleFold()`, `notifyLayoutChange()`, the `layoutListeners` field, and the fold imports. Verify `npm run build` passes.
- [x] 1.3 In `src/editor/fakeEditor.ts` and `src/editor/editor.ts`, remove `foldTargets`, `foldToggles`, `onLayoutChange`, `getFoldTargets`, `toggleFold`, and the `FoldTarget` type. Verify `npm run build` passes.
- [x] 1.4 Delete `src/editor/foldLists.ts`, `src/editor/rail.ts`, `src/editor/foldLists.test.ts`, and `src/editor/rail.test.ts`. Verify `npm run build` resolves with no dangling imports and `grep -rn "foldLists\|editor/rail" src` returns nothing.

## 2. Styling the editor pane

- [x] 2.1 In `src/components/EditorPane.module.css`, change `.document` padding from `4px 32px 4px 28px` to `4px 32px` (symmetric gutter), and delete the `.rail` block, the `.rail :global(.folio-fold-arrow*)` rules, and the `li.folio-folded` hiding rule. Verify `grep -rn "folio-fold\|\.rail" src/components/EditorPane.module.css` returns nothing.
- [x] 2.2 Confirm list rendering is otherwise unchanged: native markers still drawn and brand-colored, list indentation and spacing untouched, and nested list content always visible. Verify by loading the sample vault's `Welcome` page and observing the nested list renders fully with no chevrons. (Verified by the regression unit test against the real Milkdown adapter — nested content renders whole, no fold decoration or control — plus the built-CSS check. The manual vault-open pass was deferred; see 5.5.)

## 3. Tests

- [x] 3.1 Update or remove every `EditorPane`/`App` test that asserts a fold control, the rail, or fold state (search for `fold`, `Fold`, `rail`, `folio-fold`). Verify `npm test` passes and no assertion became vacuously true against a selector that no longer exists.
- [x] 3.2 Add a regression assertion that a page holding a nested list renders the nested content visible and shows no fold control. Verify `npm test` passes.

## 4. Documentation

- [x] 4.1 Write a new ADR (`adr/0027-pages-are-heading-structured-documents.md` or the next free number): Folio pages are heading-structured documents, not outliners; folding was removed because it rewarded deep bullet nesting. It SHALL reference ADR-0026 and the reasons from ADR-0006/ADR-0009.
- [x] 4.2 In `adr/0026-folding-a-list-item-is-view-only.md`, set Status to Superseded and reference the new ADR; leave the decision record itself intact.
- [x] 4.3 In `DESIGN.md`, remove the Lists paragraph about the disclosure control and the Left rail section, and record the symmetric 32px document gutter.
- [x] 4.4 Bump `version` in `package.json` with a minor bump (observable capability removed), e.g. `0.30.2` → `0.31.0`.

## 5. Verification

- [x] 5.1 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify all pass with no warnings.
- [x] 5.2 Run `npm run build`; verify type-check and production build succeed.
- [x] 5.3 Run `npm test`; verify the full suite is green.
- [x] 5.4 Run a residue sweep: `grep -rniE "folio-fold|FoldTarget|getFoldTargets|toggleFold|onLayoutChange|folding" src DESIGN.md` returns nothing, and `grep -rniE "fold(s|ed|able|ing)?" adr --include="0*.md"` mentions list folding only in the superseded ADR-0026.
- [x] 5.5 Browser smoke check: start `npm run dev:test`, wait for `ready in` in the log, open a page with a nested list and confirm the content is fully visible with no left-margin chevrons and a symmetric prose gutter; then run `npm run kill:dev`. (App booted in Chromium on port 63927 with no console errors and the status bar reading v0.31.0; built CSS shows `padding:4px 32px` and no `folio-fold` rules. The manual vault-open visual pass was not automatable — `showDirectoryPicker` has no automation fallback and the repo has no Playwright harness — so it was accepted as covered by the unit test and built-CSS evidence. Server killed with `npm run kill:dev`; no survivors.)
