## 1. Shortcuts reference content

- [ ] 1.1 Add two rows to `SHORTCUT_GROUPS` in `src/components/shortcuts.ts`: `{ label: 'Exit code block', keys: ['Mod-Enter'] }` and `{ label: 'Code block to paragraph (at start)', keys: ['Backspace'] }`; verify `npx vitest run src/components/ShortcutsList.test.ts` passes and the rows render as label plus key tokens
- [ ] 1.2 Extend `src/components/shortcuts.test.ts` to assert both rows exist with those chords and that `displayKeys('Mod-Enter')` renders as the platform chord; verify `npx vitest run src/components/shortcuts.test.ts` passes

## 2. Verification

- [ ] 2.1 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify the last command is clean
- [ ] 2.2 Run `npm test` and `npm run build`; verify both pass
- [ ] 2.3 Check the running app: open the Keyboard shortcuts section and confirm the "Exit code block" and "Code block to paragraph (at start)" rows appear, `Mod-Enter` appears in both its rows, and pressing `Mod-Enter` inside a code block still exits it while `Mod-Enter` inside a reference still opens the reference
