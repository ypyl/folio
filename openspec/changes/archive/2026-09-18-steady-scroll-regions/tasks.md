## 1. The reservation (CSS only)

- [x] 1.1 `src/components/EditorPane.module.css`: add `scrollbar-gutter: stable` to `.pane`, beside its `overflow-y: auto`, with a comment naming the rule and why the language popup below it opts out.
- [x] 1.2 `src/components/Sidebar.module.css`: add it to `.sidebar` and to `.scrollBody`, so both the pane's fallback scroll and each band's body reserve the lane.
- [x] 1.3 `src/components/MetaPanel.module.css`: add it to `.panel` and to `.fillBody`, mirroring the sidebar.
- [x] 1.4 `src/components/SearchResultsView.module.css`: add it to `.pane`.
- [x] 1.5 Confirm `src/components/SearchBox.module.css` keeps its existing `scrollbar-gutter: stable` untouched, and that neither `FolderRail.module.css` nor `.language-list` gained one. Added beyond the plan: `src/scrollRegions.test.ts` turns this grep into a check the suite runs, and `tsconfig.app.json` gained `node` in `types` so that one file can read the stylesheets (vitest replaces a CSS-module import with a proxy of class names, so the declaration is only visible on disk). Verified the guard fires by removing `.fillBody`'s and `.scrollBody`'s declarations in turn: each named the file and selector.

## 2. The rule

- [x] 2.1 `DESIGN.md`: add a "Scroll regions" section under the layout rules stating that a scroll region the app owns reserves its gutter, naming the included regions and the two opt-outs (the folder rail, whose controls are sized to its fixed column, and an overlay popup, whose width is content-sized), and stating that no scrollbar is ever restyled or replaced.

## 3. Verification and release

- [x] 3.1 Walk every scenario in the `ui-shell` delta and say which are covered by the browser check and which are structural. jsdom has no layout and the repo mocks CSS modules to class names, so none of these can be a unit test — state that rather than implying coverage.
- [ ] 3.2 (left for the user's own browser session) Browser check with `npm run dev:test` (confirm the log says `ready in`): with a vault open, open a page and grow it past the pane's height (type lines until the pane scrolls) and confirm the text does not move as the scrollbar appears; collapse and re-expand a long Pages listing so its body crosses its band's height and confirm the rows do not shift and no band changes height; open the search dropdown with enough matches to scroll and confirm its width is as it was; open a code block's language list and confirm the popup's width does not change when it scrolls. Sweep with `npm run kill:dev`.
- [x] 3.3 Run `npx oxlint --fix`, `npm run fmt`, `npm test`, and `npm run build`; then `npx oxlint --deny-warnings --format=agent` clean.
- [x] 3.4 Bump `package.json` to 0.14.1 (a layout fix) and add the numbered task to `PLAN.md` describing what shipped, including the rail's latent clipping as a follow-up.

- [x] 3.5 Verified the rule ships: the built stylesheet carries `scrollbar-gutter: stable` on exactly the seven regions (the six added plus the search dropdown, which already had it), the folder rail keeps `overflow: hidden auto` with no gutter, and the language popup carries none.
