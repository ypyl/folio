# Tasks

## 1. The rail's tour control

- [x] 1.1 Add an optional `onTour?: () => void` prop to `FolderRail` (`src/components/FolderRail.tsx`) and render a 40x40 `?` control as the rail's last control, named for the action it performs. Extend `src/components/FolderRail.test.tsx`: the control renders and fires `onTour` when the prop is given, the control is absent when it is omitted, and it is the rail's last control in DOM order. Verify `npm run test:unit` passes.
- [x] 1.2 Style the control in `src/components/FolderRail.module.css` from the design tokens only (ivory fill, hairline border, brand tint on hover, visible keyboard focus) and hold it to the rail's bottom edge with the meta panel footer's recipe (`margin-top: auto`, `position: sticky`, `bottom: 0`, `flex-shrink: 0`, on the rail's `--ivory` fill). Verify `npm run fmt` and `npx oxlint --deny-warnings --format=agent` pass.
- [x] 1.3 Pass `onTour` from `src/App.tsx` only when the window is not compact, and add an `src/App.integration.test.tsx` case (with `matchMedia` stubbed to the compact breakpoint) asserting the rail shows no tour control on compact and does show it on a wide viewport. Verify `npm run test:integration` passes.

## 2. The tour overlay and its steps

- [x] 2.1 Add `src/tour/steps.ts` with the five steps design.md's Steps table fixes — folder rail / "Your folders", sidebar / "Journal and Files", editor area / "Your page", right panel / "Outline and links", status bar / "Getting around" — each carrying its target name, title, and explanation, written to read correctly with no folder and no page open. Verify `npx tsc -b` passes.
- [x] 2.2 Implement `src/components/Tour.tsx`: return `null` while closed; while open render the scrim, the `role="dialog"` card named for the tour, and the current step's title and body; advance, go back, and skip/close; end on Escape; move focus into the card on open and on each step; contain Tab within the card; restore the previously focused element on close. Extend a new `src/components/Tour.test.tsx` to cover each of those and verify `npm run test:unit` passes.
- [x] 2.3 Resolve each step's region with a `data-tour` attribute lookup, render a transparent cut-out positioned from the target's `getBoundingClientRect`, re-measure on step change, `resize`, and capture-phase `scroll` only while open, and center the card with no cut-out when the target is absent. Extend `src/components/Tour.test.tsx`: a missing target still shows the step's explanation, opening attaches the listeners and closing removes them (spy on `addEventListener`/`removeEventListener`). Verify `npm run test:unit` passes.
- [x] 2.4 Style the overlay and card in `src/components/Tour.module.css` from the design tokens only, reusing the search spotlight's scrim wash, ivory card, and whisper shadow, and the two button variants; gate any transition on `prefers-reduced-motion`. Verify `npm run fmt` and `npx oxlint --deny-warnings --format=agent` pass.

## 3. Wiring the shell and the search chord

- [x] 3.1 Add the target hooks the steps resolve: `data-tour="editor"` on the editor pane's `<main>` (`src/components/EditorPane.tsx`) and `data-tour="status"` on the status bar's `<footer>` (`src/components/StatusBar.tsx`); the rail, sidebar, and meta panel already carry the `#folder-rail`, `#sidebar-pane`, and `#meta-panel` ids. Add an `src/App.integration.test.tsx` case asserting all five selectors resolve to a rendered element, and that the editor hook is absent while the results view owns the main slot. Verify `npm run test:integration` passes.
- [x] 3.2 Render `Tour` from `src/App.tsx` with `tourOpen` state, open it from the rail's `onTour`, and close it when the search spotlight opens (the `Ctrl/Cmd+K` / `Ctrl/Cmd+P` chord listener lives on `document`). Add `src/App.integration.test.tsx` cases: the rail's control opens the tour, and the search chord closes the tour and opens the spotlight. Verify `npm run test:integration` passes.
- [x] 3.3 Add a Playwright check to `tests/e2e/workspace.spec.ts`: open the tour from the rail's control, step forward and back, assert the cut-out tracks the highlighted region in a real browser, end the tour, and assert focus returns to the control. Verify `npm run test:e2e` passes (browser checks start a fresh server via `npm run dev:test` and sweep it with `npm run kill:dev`).

## 4. Integration checks

- [x] 4.1 Run `npx tsc -b`, `npm run test:unit`, `npm run test:integration`, and `npm run build`, and verify all pass together.
- [x] 4.2 Browser-check the tour with a real dev server (`npm run dev:test`, confirm the log says `ready in`, then `npm run kill:dev`): open the tour on the no-folder state and with a page open, confirm each step's card reads sensibly and the spotlight tracks the rail, sidebar, editor, panel, and status bar, and confirm the rail's control stays at the bottom with an overflowing folder list.
- [x] 4.3 Bump `version` in `package.json` (minor, a new user-facing surface) and run `npx oxlint --deny-warnings --format=agent`, `npm run test:unit`, `npm run test:integration`, and `npm run build`, all green.
