## 1. Layout foundation

- [x] 1.1 Add a `--strip-w: 16px` token and the `--sidebar-cur` / `--panel-cur` collapse variables to `src/index.css`, and change the `.workspace` and `.header` column lists to `rail strip sidebar editor panel strip`. Verify: `npm run build` succeeds and the shell still renders four panes at the documented widths.
- [x] 1.2 Add the `left-collapsed` / `right-collapsed` overrides (`--sidebar-cur: 0px` / `--panel-cur: 0px`) in `src/index.css`. Verify: toggling the class on `.app-shell` in devtools zeroes exactly one column and the editor grows.

## 2. Collapse control

- [x] 2.1 Create `src/components/PaneCollapseToggle.tsx` and `PaneCollapseToggle.module.css`: a full-height `<button>` with an inline `aria-hidden` chevron, `aria-expanded`, `aria-controls`, and an `aria-label` naming the pane and action, styled from Kami tokens only. Verify: the component's own test asserts the label, `aria-expanded`, and arrow direction for both sides and both states.
- [x] 2.2 Render one strip on each side in `App.tsx` (left between the rail and the sidebar, right after the meta panel), wired to the new state. Verify: `App.test.tsx` finds both strips by their accessible names.

## 3. Collapsing the panes

- [x] 3.1 Add a `collapsed?: boolean` prop to `Sidebar` and `MetaPanel`, folding a `collapsed` class into each root `className` with `display: none`. Verify: a test collapses each pane, asserts its content leaves the document, and re-expands it to find the same accordion section still open (state preserved).
- [x] 3.2 Give each pane a stable `id` and point its strip's `aria-controls` at it. Verify: `getByRole('button', { name: ... })` reports `aria-controls` naming the pane element.
- [x] 3.3 Add an `App.test.tsx` case: collapse the left sidebar, assert the header still renders and the search input is present, and expand again. Verify: the test passes.

## 4. Verification

- [x] 4.1 Run `npx oxlint --fix`, `npm run fmt`, `npm run test`, and `npm run build`; resolve anything they report. Verify: all four exit clean.
- [x] 4.2 Browser-check in a real Chromium window: start with `npm run dev:test`, confirm the log says `ready in`, open a folder, collapse and expand each pane, check the header stays aligned and no stale server remains (`npm run kill:dev`). Verify: screenshots show the three layout states and no leftover node process.
- [x] 4.3 Run `npx oxlint --deny-warnings --format=agent` and confirm zero warnings before finishing.
