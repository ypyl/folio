## 1. Rail update

- [x] 1.1 Remove the stacking shift from `updateGutterDom` in `src/editor/gutter.ts` (the coincidence check and `ARROW_GAP`), so a number and an arrow are each written at their own line offset. Verify `gutter.test.ts` passes with the stacking case replaced by a same-line case.
- [x] 1.2 Update `src/components/EditorPane.module.css`: widen `.gutter` and `.document`'s left padding to 56px, put `.gutterNum` at 12px with `line-height: 1` in the left column (`right: 28px`), keep the arrow in the right column (`right: 2px`), and size the arrow's inline SVG. Verify the built stylesheet carries the new rail width, number size, and column offsets.
- [x] 1.3 Update `DESIGN.md` (Lists and Document line numbers) to describe the two columns and the 12px number, removing the number-under-arrow wording. Verify the sections read coherently.

## 2. Verification

- [x] 2.1 Update `src/editor/gutter.test.ts`: a first-level arrow and its block's number sit on the same line with the number in the left column, and a nested arrow sits on its own line with no number. Verify the tests pass.
- [x] 2.2 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npm run build`, and `npm test`; bump `version` in `package.json` (minor). Verify all commands succeed and the suite is green.
