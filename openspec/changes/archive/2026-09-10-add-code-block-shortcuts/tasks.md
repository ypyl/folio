## 1. Shortcuts reference content

- [x] 1.1 Add two rows to `SHORTCUT_GROUPS` in `src/components/shortcuts.ts`: `{ label: 'Exit code block', keys: ['Mod-Enter'] }` and `{ label: 'Cancel code block', keys: ['Backspace'] }`, grouped directly after `Code block`; verify `npx vitest run src/components/ShortcutsList.test.ts` passes and each row shows its label and key on one line
- [x] 1.2 Extend `src/components/shortcuts.test.ts` to assert both rows exist with those chords and that `displayKeys('Mod-Enter')` renders as the platform chord; verify `npx vitest run src/components/shortcuts.test.ts` passes

## 2. Verification

- [x] 2.1 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify the last command is clean
- [x] 2.2 Run `npm test` and `npm run build`; verify both pass
- [x] 2.3 Check the running app: open the Keyboard shortcuts section and confirm the "Exit code block" and "Cancel code block" rows appear (grouped with "Code block"), each row is a single line, `Mod-Enter` appears in both its rows, and pressing `Mod-Enter` inside a code block still exits it while `Mod-Enter` inside a reference still opens the reference
