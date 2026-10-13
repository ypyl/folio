# Tasks

## 1. Dismiss the frames with Escape

- [x] 1.1 Add the `Escape` handler in `App`: a `document` keydown listener that clears `matchHighlight` only when `event.defaultPrevented` is false and no claiming surface is open (`searchOpen`, `tourOpen`, `importView`, `slides`, `mode === 'results'`); verify with an App test that pressing `Escape` clears the frames and that a frame's slot is nulled.
- [x] 1.2 Add tests for the gates and the lifetime in `src/App.integration.test.tsx`: `Escape` with the spotlight open closes the spotlight and leaves the frames; `Escape` with the results view open closes the view and leaves the frames; a cleared page is unmarked after leaving and returning; a later locate frames it again. Verify the new cases pass and the existing frame tests still pass.
- [x] 1.3 Update the Search match paragraph in `DESIGN.md` to name `Escape` as the way the frames end, and verify the sentence matches the implemented gating.

## 2. Integration checks

- [x] 2.1 Run `npx oxlint --fix` then `npm run fmt`, and verify neither reports a remaining issue.
- [x] 2.2 Run `npx oxlint --deny-warnings --format=agent` and verify it passes clean.
- [x] 2.3 Run the full test suite (`npm test`) and `npm run build`, and verify both pass.
- [x] 2.4 Browser check: added a Playwright case to `tests/e2e/editing.spec.ts` (real Chromium, real CodeMirror frames) that frames every matching block, dismisses the spotlight with `Escape` and leaves the frames, then clears them with `Escape`; ran `npm run test:e2e` and verified all cases pass. Playwright starts and stops its own dev server, so no server survives the run.
