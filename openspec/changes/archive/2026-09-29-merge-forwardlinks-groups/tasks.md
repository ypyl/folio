## 1. Row model (App)

- [x] 1.1 Add `kind: 'page' | 'board' | 'asset'` to `LinkRow` in `MetaPanel.tsx` and set it in `App`'s row builders (pages `page`; assets `asset`; boards `board`), verifying with a unit test or type check that every row carries a kind.
- [x] 1.2 Merge the page and file rows into one memoized Forwardlinks array in `App` (pages in document order, then assets, then boards) and pass it as a single prop, removing the separate `references` prop; verify the panel receives one list.

## 2. MetaPanel

- [x] 2.1 Render Forwardlinks as one `LinkList` over the merged rows, removing the "Pages"/"Files" group labels and their markup/CSS; verify the panel shows no group labels.
- [x] 2.2 Render a leading kind badge on board (`b`) and asset (`a`) rows and none on page rows, matching the sidebar; verify a board row and an asset row show their badge and a page row does not.
- [x] 2.3 Dispatch activation by kind in `LinkList` (page → `onSelect`, file → `onOpenAsset`) and dim any non-asset unmaterialized row; verify a page row navigates, a file row opens, and an unmaterialized page or board row is dimmed while an asset row is not.
- [x] 2.4 Show one empty-state copy only when the merged list is empty; verify an open page referencing only pages shows page rows and no copy.

## 3. Styling

- [x] 3.1 Make the panel row a flex row and add the badge style from Kami tokens per `DESIGN.md`; verify the badge renders before the label without layout shift and reads as presentational.

## 4. Tests

- [x] 4.1 Update `MetaPanel.test.tsx` for the single list and badges; verify it passes.
- [x] 4.2 Update `App.test.tsx` Forwardlinks assertions (group labels gone, badges present, activation by kind); verify the full suite passes.

## 5. Finish

- [x] 5.1 Run `npx oxlint --fix`, then `npm run fmt`, and confirm clean with `npx oxlint --deny-warnings --format=agent`.
- [x] 5.2 Run `npm run test` and `npm run build`; both pass.
- [x] 5.3 Bump `version` in `package.json` as part of the commit (MINOR — a user-facing change).
