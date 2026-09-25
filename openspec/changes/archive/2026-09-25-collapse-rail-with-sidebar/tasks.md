## 1. Workspace layout

- [x] 1.1 In `src/index.css`, add a live `--rail-cur` (default `var(--rail-w)`) beside `--sidebar-cur`, reorder `.workspace` columns to `var(--strip-w) var(--rail-cur) var(--sidebar-cur) minmax(0, 1fr) var(--panel-cur) var(--strip-w)`, and make `.app-shell.left-collapsed` zero both `--rail-cur` and `--sidebar-cur`. Verify by loading the app and seeing the strip as the leftmost column with the rail immediately to its right.
- [x] 1.2 In `src/App.tsx`, render the left `PaneCollapseToggle` before `FolderRail` and pass `collapsed={leftCollapsed}` to `FolderRail`. Verify the app builds (`npm run build`) and the rail and sidebar both disappear when the left strip is activated.

## 2. Folder rail collapsed state

- [x] 2.1 In `src/components/FolderRail.tsx`, add a `collapsed` prop that applies a new `.collapsed` class, and add `id="folder-rail"` to the nav. In `FolderRail.module.css`, implement `.collapsed` as `visibility: hidden; overflow: hidden; padding: 0; border-width: 0` (the `Sidebar.module.css` pattern, so the grid item keeps its slot). Verify with a focused test that the rail is hidden and its controls are not in the tab order while collapsed.

## 3. Toggle semantics

- [x] 3.1 In `src/components/PaneCollapseToggle.tsx`, keep `side="left"` folding the combined unit: the accessible name reads `Collapse left navigation` / `Expand left navigation`, and the arrow logic is unchanged. Verify `PaneCollapseToggle.test.tsx` asserts the new names and arrow directions.

## 4. Tests

- [x] 4.1 Update `src/components/PaneCollapseToggle.test.tsx` for the left unit's new name and the space-separated `aria-controls`. Verify the test file passes.
- [x] 4.2 Update `src/components/FolderRail.test.tsx` with a collapsed case asserting the rail applies the collapsed class and stays out of the tab order. Verify the test file passes.
- [x] 4.3 Update `src/App.test.tsx` so the left toggle hides both the rail and the sidebar and returns both widths to the editor. Verify the test file passes.
- [x] 4.4 Run the full check: `npx oxlint --deny-warnings --format=agent`, `npm run fmt`, and `npm test`. Verify all pass.

## 5. Wrap-up

- [x] 5.1 Bump `version` in `package.json` (minor: a new user-facing behavior) and confirm the status-bar version badge shows the new value. Verify the build and the badge.
