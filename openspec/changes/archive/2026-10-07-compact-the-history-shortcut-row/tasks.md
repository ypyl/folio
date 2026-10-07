# Tasks

## 1. Share one row for the history chords

- [x] 1.1 In `src/components/shortcuts.ts`, replace a row's `keys: string[]`
  with `ShortcutKey[]` where each key carries its `chord`, an optional `label`,
  and an optional `surface`; remove `ShortcutItem.surface`. Merge the two history
  items into one `{ label: 'Back / Forward', keys: [{ chord: 'Mod-[', label:
  'Back', surface: 'back' }, { chord: 'Mod-]', label: 'Forward', surface:
  'forward' }] }`. Verify the type check covers the converted rows.
- [x] 1.2 In `src/components/ShortcutsList.tsx`, read each key's own `label`
  (falling back to the row's) for the control's accessible name and each key's
  own `surface` (falling back to the group's `target`) for its disabled state.
  Verify `npm run build` type-checks.
- [x] 1.3 Update `src/components/shortcuts.integration.test.ts` to normalise the
  key objects back to chords in the pinned inventory and to keep the formatting
  guard green; verify with `npm run test:integration`.
- [x] 1.4 Update `src/components/ShortcutsList.integration.test.tsx`: the
  history controls are named "Back Ctrl+[" and "Forward Ctrl+]" under one row
  labelled "Back / Forward", and a gate of `{ back: false, forward: true }`
  disables the Back control while leaving the Forward control live. Verify with
  `npm run test:integration`.
- [x] 1.5 Update the reference assertions in `src/App.integration.test.tsx` and
  `tests/e2e/navigation.spec.ts` to the shared row and its two named controls.
  Verify with `npm run test:integration` and `npm run test:e2e --
  tests/e2e/navigation.spec.ts`.

## 2. Integration checks

- [x] 2.1 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint
  --deny-warnings --format=agent`; verify all are clean.
- [x] 2.2 Run `npm run test:unit`, `npm run test:integration`, `npm run build`,
  and `npm run test:e2e`; verify all pass.
- [x] 2.3 Bump `version` in `package.json` (patch) and verify the status bar's
  version badge names the new build.
