# keyboard-shortcuts-help — Tasks

## 1. Shortcuts reference data

- [x] 1.1 Create a `SHORTCUTS` constant (label + key combination per entry) in the new component module listing every real editor binding — bold, italic, inline code, undo/redo, headings 1–6, paragraph, ordered/bullet lists, blockquote, code block, indent/outdent, hard break — plus the app's search shortcut, annotated with its preset source (`commonmark` keymaps, `plugin-history`, search). Verify: the list matches the bindings enumerated in design.md exactly, with nothing invented (links/strikethrough absent).
- [x] 1.2 Add platform-aware key rendering: `Mod` displays as `Ctrl` on Windows/Linux and `Cmd` on macOS. Verify: a small unit test for the mapping function covers both platforms.

## 2. The help button and dialog

- [x] 2.1 Add the circular `?` help button to the header's right slot, beside the vault status and always rendered (also without a vault), with a `title`/`aria-label` describing it as keyboard shortcuts help and Kami focus treatment. Verify: `Header` renders the button with and without a vault and `npm run lint`/`npm run build` pass.
- [x] 2.2 Create the `ShortcutsDialog` component — portal to `document.body`, `role="dialog"` + `aria-modal`, Kami surface tokens from DESIGN.md, `Esc` and a close control to dismiss, focus moves into the dialog on open and returns to the button on close — and compose it in `App` behind the button. Verify: the dialog opens on button activation and renders the `SHORTCUTS` list; lint/build pass.
- [x] 2.3 Add dialog behavior tests (testing-library): activation opens it with focus inside; `Esc` closes it and returns focus to the button; it is exposed as `role="dialog"`; the close control dismisses it. Verify: new tests pass.
- [x] 2.4 Update `Header.test.tsx` for the button (renders beside the vault status when a vault is active; still renders with none). Verify: header tests pass.

## 3. Binding drift pin and integration

- [x] 3.1 Pin one listed shortcut to the editor's real binding: drive the preset's bold toggle through the mounted editor (`editor.action` + `commandsCtx` calling `toggleStrongCommand`, imported from `@milkdown/preset-commonmark`) on a selected range, and assert the strong mark toggles — proving the sheet's Bold entry matches what the editor actually binds. Verify: test passes against the current preset.
- [x] 3.2 Run `npm test`, `npm run lint`, and `npm run build`; verify the whole suite stays green.