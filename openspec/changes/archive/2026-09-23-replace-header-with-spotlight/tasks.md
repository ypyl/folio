## 1. Shell layout

- [x] 1.1 Delete `src/components/Header.tsx` and `src/components/Header.module.css`, and remove the `Header` import and `<Header>` render from `src/App.tsx`; verify `npm run build` type-checks with no dangling references
- [x] 1.2 Change `.app-shell` in `src/index.css` from `grid-template-rows: auto 1fr auto` to `grid-template-rows: 1fr auto`, and delete the now-unused Header-only helpers/comments; verify the workspace and status bar fill the shell with no gap
- [x] 1.3 Remove `src/components/Header.test.tsx`; verify `npx vitest run` no longer references a missing module

## 2. Folder rail brand and search trigger

- [x] 2.1 Add `onHome` and `onSearch` props (and a `searchDisabled` flag, or reuse `hasVault`) to `src/components/FolderRail.tsx`, rendering the `FolioMark` brand button first and the search trigger directly below it above the add control (ui-shell: folder-rail requirement); verify `npm run build` passes
- [x] 2.2 Render the brand and search trigger in every state, including `status === 'restoring'` (no early return that drops them); verify a `FolderRail` test asserts both are present while restoring, with folders listed, and with no vault
- [x] 2.3 Style the two controls in `FolderRail.module.css` from Kami tokens at a fixed size in the 56px column, with a disabled state for the search trigger; verify no horizontal scrollbar appears with the controls and entries laid out
- [x] 2.4 Update `src/components/FolderRail.test.tsx` for the brand (home fires `onHome`) and the search trigger (fires `onSearch` when enabled; disabled and inert while `searchDisabled`); verify those tests pass

## 3. Search spotlight

- [x] 3.1 Rework `src/components/SearchBox.tsx` into `src/components/SearchSpotlight.tsx` (and its module CSS): accept `open`, keep the existing `query`/`results`/`Fuse`/`active` state, and return `null` while `open` is false (design: mounted-but-null); verify existing search tests pass against the new component
- [x] 3.2 Render the overlay: a fixed scrim with `role="dialog"`, `aria-modal="true"`, `aria-label="Search notes"`, and the input + the existing dropdown markup inside it; verify a test finds the dialog by role and the input within it
- [x] 3.3 Focus the input on open and restore the previously focused element on close; contain Tab within the overlay; verify tests assert focus lands in the input on open and returns to the editor on close, and that Tab wraps inside the dialog
- [x] 3.4 Close on Escape and on a scrim click, keeping the query (search: "Outside click closes but keeps the query"); verify tests cover both, and that reopening restores the dropdown
- [x] 3.5 Bind `Ctrl/Cmd+P` and `Ctrl/Cmd+K` on one document listener gated on a usable vault, calling `preventDefault()`; verify a test dispatches each chord and the dialog opens with the input focused, and that neither fires with no vault
- [x] 3.6 Style the scrim and overlay from Kami tokens (parchment surface, hairline border, no shadow), with the results list keeping its capped per-group slice and the see-all row; verify `oxlint` passes and no banned colors appear
- [x] 3.7 Update `src/components/SearchBox.test.tsx` to `SearchSpotlight.test.tsx` covering open/typing/groups/keyboard nav/Escape/see-all against the overlay; verify the suite passes

## 4. App wiring

- [x] 4.1 Add `searchOpen` state to `src/App.tsx`, pass `open` to `SearchSpotlight` (keyed on `activeFolder?.id`), and pass `onHome` / `onSearch` to `FolderRail`; verify the app builds and the spotlight opens from the rail
- [x] 4.2 Keep `handleQueryResult` / `handleOpenResults` wired so editing the query while the results view is open updates both surfaces and a no-match query closes the view (search: results-view keyboard requirement); verify an `App` test covers the edit-updates-both path
- [x] 4.3 Reset `searchOpen` with the open page on a folder switch so the spotlight cannot survive a vault change; verify an `App` test switches folders and asserts the dialog is gone

## 5. Shortcuts reference

- [x] 5.1 Change the App group's Search notes row in `src/components/shortcuts.ts` to `keys: ['Mod-k', 'Mod-p']`; verify `shortcuts.test.ts` still guards the bound chords and both controls render
- [x] 5.2 Point the search row's replay at opening the spotlight (ensure `applyShortcut`'s document dispatch reaches the spotlight listener) and disable it while no vault is usable; verify a test activates the row and the dialog opens with focus in the input, and is dimmed/inert without a vault

## 6. Verification and release

- [x] 6.1 Run `npx oxlint --fix`, `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify all three pass clean
- [x] 6.2 Run `npm run test`; verify the full suite passes, including updated `App.test.tsx`, `FolderRail.test.tsx`, and `SearchSpotlight.test.tsx`
- [x] 6.3 Start a browser check with `npm run dev:test`, confirm the log says `ready in`, then verify by hand that no header shows, `Ctrl+P` and `Ctrl+K` open the spotlight, Escape/scrim close it, the see-all row opens the results view, and the rail's search trigger opens the spotlight; sweep servers with `npm run kill:dev`
- [x] 6.4 Bump `version` in `package.json` (minor, new user-facing capability) and verify the status-bar badge names the new build
