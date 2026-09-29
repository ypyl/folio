## 1. Row model (App)

- [x] 1.1 Add `badge: 'in' | 'out' | 'a' | 'b'` to `LinkRow` and set it in every builder: backlink rows `in`, forwardlink page rows `out`, assets `a`, boards `b`, board-referrer rows `in`; verify with a type check and a unit test that each row carries a badge and its `kind`.
- [x] 1.2 Build one memoized `linkRows` array in `App` (backlinks, then forwardlink pages, then assets, then boards) and pass it as a single `links` prop to `MetaPanel`, removing `backlinks` and `forwardlinks`; verify the panel receives one list.

## 2. MetaPanel

- [x] 2.1 Replace the Backlinks and Forwardlinks accordions with one `Links` accordion (open by default, the `.links` group, remaining height); verify the panel shows Contents, Links, and Keyboard shortcuts.
- [x] 2.2 Render the row badge from `row.badge` (`in`, `out`, `a`, `b`) and keep activation dispatching on `row.kind`; verify a backlink page shows `in`, a forwardlink page `out`, an asset `a`, and a board `b`, and each activates correctly.
- [x] 2.3 Show one empty copy ("No links yet.") only when the list is empty; verify a page with any link shows no copy and a page with none shows it.
- [x] 2.4 Badge the board-mode Referenced-by rows `in`; verify a referrer row shows `in` and still navigates.

## 3. Styling

- [x] 3.1 Size the badge box to its text (min-width plus padding) so `in`/`out` fit without clipping, per `DESIGN.md`; verify the badge renders before the label with no layout shift.

## 4. Tests

- [x] 4.1 Update `MetaPanel.test.tsx` for the single Links section and the four badges; verify it passes.
- [x] 4.2 Update `App.test.tsx` for the Links section (section list, badges, activation, empty copy); verify the full suite passes.

## 5. Finish

- [x] 5.1 Run `npx oxlint --fix`, then `npm run fmt`, and confirm clean with `npx oxlint --deny-warnings --format=agent`.
- [x] 5.2 Run `npm run test` and `npm run build`; both pass.
- [x] 5.3 Bump `version` in `package.json` as part of the commit (MINOR).
