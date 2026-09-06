## 1. Folder lifecycle: close and home actions

- [x] 1.1 Add `closeFolder(id)` to `src/vault/useVault.ts`: drop the folder row and `clearVaultHandle(id)`; when the closed folder was active, return home (set no active folder and clear the last-active pointer); when it was not active, leave the active folder untouched. Verify: `npm run build` and `npm run lint` pass
- [x] 1.2 Add `goHome()` to `src/vault/useVault.ts`: set no active folder and clear the last-active pointer, forgetting nothing. Verify: `npm run build` passes
- [x] 1.3 Add `clearLastActiveId` to `src/vault/handleStore.ts` (delete the `meta` `lastActiveId` key, null-safe like the rest) and use it in `closeFolder` (active case) and `goHome`. Verify: `npm run build` passes and the existing `useVault` tests still pass
- [x] 1.4 Extend `src/vault/useVault.test.ts` covering every delta: closing a non-active folder keeps the active folder and shrinks the list; closing the active folder returns home (no active folder, last-active cleared) while other folders stay listed; closing the last folder returns home with nothing listed; `goHome` clears the active folder and last-active pointer without removing any folder; the closed folder's handle is cleared from the registry; a closed folder is never resurrected by restore. Verify: `npm run test` passes with coverage thresholds intact

## 2. Rail close control

- [x] 2.1 Add a corner close (×) button to each entry in `src/components/FolderRail.tsx`: always visible, distinct surface from the switch action, click stop-propagated so it never triggers `onActivate`, `aria-label="Close folder <name>"` and the folder name in `title`; style it in `FolderRail.module.css` with Kami tokens only (warm-sand surface, stone icon — no second chromatic color). Verify: `npm run lint` passes and a manual dev check shows the badge on every entry, including pending ones
- [x] 2.2 Extend `src/components/FolderRail.test.tsx`: every entry renders a close control; clicking it calls the close callback with that folder's id and does not call the activate callback; the active entry is closable too. Verify: `npm run test` passes

## 3. Header brand as home

- [x] 3.1 Make the brand (mark + title) in `src/components/Header.tsx` an interactive home control: a button with an accessible label, keyboard-focusable, Kami-styled (no second chromatic accent), wired to a new `onHome` prop. Verify: `npm run lint` passes and a manual dev check shows the brand focusable and clickable
- [x] 3.2 Extend `src/components/Header.test.tsx`: the brand is an interactive control; activating it calls the home callback; it renders and works whether or not a vault is active. Verify: `npm run test` passes

## 4. App wiring

- [x] 4.1 Wire the rail's close callback in `src/App.tsx` to `useVault`'s `closeFolder` and the brand's home callback to `goHome`; the existing `activeFolder?.id` effect already resets the open page, drafts, saver, and search, so no new teardown code is added. Verify: existing `src/App.test.tsx` passes and a manual dev check shows closing the active folder (or clicking the brand) lands on the empty state with other folders still on the rail

## 5. Integration checks

- [x] 5.1 Grep gate: nothing outside `src/vault/` imports `clearLastActiveId`, and `closeFolder`/`goHome` are referenced only by `useVault.ts` and `App.tsx`. Verify: `grep -rn "closeFolder\|goHome\|clearLastActiveId" src --include="*.tsx" --include="*.ts"` shows only those files; `npm run lint`, `npm run build`, `npm run test`, and `openspec validate` all pass