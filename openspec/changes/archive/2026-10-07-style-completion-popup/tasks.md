# Tasks

## 1. Give the popup the app's floating-surface recipe

- [x] 1.1 In `src/components/EditorPane.module.css`, under `.editor
  :global(...)`, style `.cm-tooltip.cm-tooltip-autocomplete` (ivory fill, no
  border, 4px padding, 8px radius, the `0 4px 12px rgba(20,20,19,0.1)` whisper
  shadow), its `> ul` (UI font in place of monospace, keeping CM's width and
  height bounds), and its `> ul > li` (6px 8px padding, 6px radius, 13px,
  `--near-black`), with `li[aria-selected]` and `li:hover` on `--warm-sand`.
  Verify with `npm run dev:test`: open a folder, type `#` plus a page's first
  letters, and confirm the popup and its active row match `DESIGN.md`; sweep the
  server with `npm run kill:dev`.
- [x] 1.2 Add one computed-style assertion to the existing completion e2e case in
  `tests/e2e/editing.spec.ts`: with the popup visible, assert the active row's
  background is the warm interactive fill (not CM's `#17c`) and the popup's
  background is the ivory surface, so a CodeMirror upgrade that renames
  `.cm-tooltip-autocomplete` fails the suite. Verify with `npm run test:e2e --
  tests/e2e/editing.spec.ts`.
- [x] 1.3 Confirm the popup's list keeps the platform scrollbar and CM's
  width/height bounds (a long candidate list still scrolls inside the popup, and
  a long page name still ellipsizes) — observable in the same dev-server check,
  with no reserved gutter or custom thumb added.

## 2. Integration checks

- [x] 2.1 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint
  --deny-warnings --format=agent`; verify all are clean.
- [x] 2.2 Run `npm run test:unit`, `npm run test:integration`, `npm run build`,
  and `npm run test:e2e`; verify all pass.
- [x] 2.3 Bump `version` in `package.json` (patch) and verify the status bar's
  version badge names the new build.
