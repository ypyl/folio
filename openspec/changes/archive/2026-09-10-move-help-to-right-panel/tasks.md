## 1. Panel width

- [x] 1.1 Add `--rail-w: 56px`, `--sidebar-w: 264px`, `--panel-w: 220px` to `:root` in `src/index.css` and point `.workspace`'s `grid-template-columns` at them; verify the shell still renders four side-by-side panes (existing `App.test.tsx` passes)
- [x] 1.2 Point `.header`'s `grid-template-columns` in `src/components/Header.module.css` at the same three custom properties; verify `Header.test.tsx` passes and the header's brand/search/slot stay aligned with the panes beneath
- [x] 1.3 Set `--panel-w: 280px`; verify the panel's content column measures 252px in the dev app and `MetaPanel.test.tsx` and `App.test.tsx` still pass

## 2. Shortcut data

- [x] 2.1 Replace `Heading 1-6`'s six chords in `src/components/shortcuts.ts` with the single range `keys: ['Mod-Alt-1..6']`; verify `displayKeys('Mod-Alt-1..6')` returns `Ctrl+Alt+1..6` (and `Cmd+Alt+1..6` on mac)
- [x] 2.2 Remove the `SHORTCUTS_DIALOG_ID` export from `src/components/shortcuts.ts`; verify no import of it remains and the build typechecks

## 3. ShortcutsList component

- [x] 3.1 Create `src/components/ShortcutsList.tsx` rendering `SHORTCUT_GROUPS` as one `<section aria-labelledby>` per group with a `<p>` label and a `<ul>` of label + `kbd` rows; verify a test renders both group labels and every entry
- [x] 3.2 Move the group/row/label/kbd styles out of `ShortcutsDialog.module.css` into `src/components/ShortcutsList.module.css`; verify the rendered list is visually unchanged in the dev app
- [x] 3.3 Create `src/components/shortcuts.test.ts` with the `displayKeys` platform tests plus the live-keymap drift guard, extended to assert heading levels one through six are bound to `Mod-Alt-N`; verify the test fails when the range chord is edited to a wrong level
- [x] 3.4 Create `src/components/ShortcutsList.test.tsx` covering both group labels, every entry with its key tokens, the single heading-range entry, and that the list is not exposed as a dialog
- [x] 3.5 Delete `src/components/ShortcutsDialog.tsx`, `ShortcutsDialog.module.css`, and `ShortcutsDialog.test.tsx`; verify no reference to them remains and the build passes

## 4. Panel section

- [x] 4.1 Add the third accordion to `src/components/MetaPanel.tsx` — title "Keyboard shortcuts", collapsed by default, after Forwardlinks, rendering `<ShortcutsList />`; verify a test asserts it is the last section and starts collapsed
- [x] 4.2 Change the panel's accessible name to `aria-label="Page sidebar"`; verify a test asserts the new name
- [x] 4.3 Verify the section renders in every panel state — no page open, index building, and search-results surfaces — by extending `MetaPanel.test.tsx` and running it
- [x] 4.4 Anchor the collapsed reference to the panel's bottom edge — panel becomes a flex column, reference accordion gets `margin-top: auto` and `position: sticky; bottom: 0` on an opaque panel-colored background — and verify in the browser that the collapsed row sits at the bottom with both short and overflowing metadata sections

## 5. Remove the modal and the status bar button

- [x] 5.1 Remove the `?` button, the `onHelp`/`helpOpen` props, and the `.help` style from `src/components/StatusBar.tsx` and `StatusBar.module.css`; verify `StatusBar.test.tsx` asserts the bar exposes no help control and the vault group stays right-aligned
- [x] 5.2 Remove the `helpOpen` state, the `onHelp` prop, and the `ShortcutsDialog` render from `src/App.tsx`; verify `App.test.tsx` no longer opens or closes a dialog
- [x] 5.3 Update `StatusBar.test.tsx` and `App.test.tsx` for the removed button and dialog, including the two assertions that currently count the help button as the bar's only control; verify the full test suite passes

## 6. Docs and final verification

- [x] 6.1 In `PLAN.md`, add the new numbered task describing this change and delete the two matching "Later ideas" bullets ("I don't like how shortcut helper popup looks like" and "help not in the corner lie button and modal window..."); verify the numbered list has the new entry as `[ ]` and the two bullets are gone
- [ ] 6.2 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`; verify all three pass clean
- [x] 6.3 Run `npm run build` and the full test suite; verify both succeed, then in the dev app confirm the reference's collapsed row sits at the panel's bottom edge (with short metadata sections and with overflowing ones), that opening it expands in place with the panel still scrolling as a single region, and that the shell has no modal and no status bar help button
