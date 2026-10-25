# Tasks

## 1. The checkbox in the editor

- [x] 1.1 In `src/editor/codemirror.ts`, add a `TaskCheckboxWidget` (a native `<input type="checkbox">`, `contentEditable="false"`, `eq()` on the checked state alone, `ignoreEvent()` true) and render it over `TaskMarker` inside the existing viewport-scoped pass, with an atomic range over the same span. Verify: a page holding `- [ ] a` and `- [x] b` renders two boxes in `src/editor/codemirror.integration.test.ts`.
- [x] 1.2 Give the widget its own press handling: resolve the offset with `view.posAtDOM(box)`, guard that the three characters are still a marker, write the opposite marker in one transaction, and keep the selection where it was. Verify: a press in the integration suite flips the text and leaves the caret alone.
- [x] 1.3 Style the box in `src/components/EditorPane.module.css` (`14px`, `accent-color: var(--brand)`, baseline alignment, no chip) and record the rule in `DESIGN.md` under Lists. Verify: the box reads on the parchment surface in the browser check, and `DESIGN.md` states the rule.

## 2. Behaviour the spec names

- [x] 2.1 Cover the spec's scenarios in `src/editor/codemirror.integration.test.ts`: both states, `[X]`, the document keeping its characters after a toggle and a save, undo restoring the marker, a nested item, and the three non-task forms (`[ ]` in prose, `- [x]no-space`, `[ ]` in a fence). Verify: the suite passes.
- [x] 2.2 Check that a press does not navigate or move the caret, and that a rendered task line keeps the checkbox beside the caret. Verify: the same suite.

## 3. Docs and version

- [x] 3.1 Write `adr/0033-a-task-marker-is-a-checkbox.md` and add its row to `adr/README.md`. Verify: the table's numbering and status match the file.
- [x] 3.2 Mention task items in `README.md` if it lists what the editor renders, and bump `version` in `package.json` (minor). Verify: `git diff` shows the bump.

## 4. Integration verification

- [x] 4.1 Run the unit and integration suite, `npx tsc -b`, `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npm run build`, and the e2e suite. Sweep dev servers with `npm run kill:dev`. Verify: every command exits clean.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review, sync the main spec, and publish both commits.
