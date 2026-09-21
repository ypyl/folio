## 1. The thumb recipe (CSS only)

- [x] 1.1 `src/components/EditorPane.module.css`: on `.pane`, beside its existing `scrollbar-gutter`, add the three scrollbar rules — `::-webkit-scrollbar` (no `width`, per design D4), `::-webkit-scrollbar-track` (transparent), `::-webkit-scrollbar-thumb` (transparent fill, `border: 4px solid transparent`, `background-clip: content-box`, pill radius, `min-height: 32px`), and `.pane:hover::-webkit-scrollbar-thumb` taking `--stone`. Update the region's comment to name the reveal and to say the language popup below opts out. Verify on disk that `.pane` carries exactly one `overflow-y: auto`, one `scrollbar-gutter: stable`, and the four new rules.
- [x] 1.2 `src/components/Sidebar.module.css`: the same recipe on `.sidebar` and on `.scrollBody`, next to each `scrollbar-gutter`. `.fillBody` carries no gutter and gets nothing — verify it has no `::-webkit-scrollbar` rule.
- [x] 1.3 `src/components/MetaPanel.module.css`: the same recipe on `.panel` and on `.fillBody`, mirroring the sidebar.
- [x] 1.4 `src/components/SearchResultsView.module.css` (`.pane`) and `src/components/SearchBox.module.css` (`.drop`): the same recipe, so the search view and the dropdown reveal alike. `.drop` already reserved its gutter.
- [x] 1.5 Confirm the two opt-outs gained nothing: `src/components/FolderRail.module.css` `.rail` and the `.language-list` rule in `EditorPane.module.css` carry no `::-webkit-scrollbar` rule. A region that keeps the platform bar keeps it whole.

## 2. The rule

- [x] 2.1 `DESIGN.md`: rewrite the "Scroll regions" section. Keep the gutter rule and the two opt-outs as they are. Replace the "nothing about the scrollbar itself changes / stays the platform's own" paragraph with the new one: a gutter region carries the app's thumb, thin, rounded, inset, `--stone`, invisible at rest and revealed on the region's hover; the lane keeps the platform's width; no fade, no delay, no reveal from anything but hover; a region that opts out of the gutter opts out of the thumb, and outside Chromium the platform's bar stands. State the recipe once, in the section, rather than repeating it per region.

## 3. The check

- [x] 3.1 `src/scrollRegions.test.ts`: extend the existing file, which already reads the stylesheets from disk. Keep the two gutter tests. Add: every region with `overflow-y: auto` (except the two opt-outs) has a `::-webkit-scrollbar-thumb` rule with a transparent fill and a `:hover` rule that inks it, and a `::-webkit-scrollbar` rule with no `width`. Add: neither opt-out has any `::-webkit-scrollbar` rule. Verify the check fires by removing one region's thumb rule and renaming the test output.

## 4. Verification and release

- [x] 4.1 Walk every scenario in the `ui-shell` delta and say which are covered by the browser check and which are structural. jsdom has no layout and the repo mocks CSS modules to class names, so the reveal itself cannot be a unit test — state that rather than implying coverage.
- [x] 4.2 Browser check with `npm run dev:test` (confirm the log says `ready in`): the recipe was measured in Chromium over the running app — a lane of 15px with and without the recipe, so the lane did not resize (design D4), and the thumb's computed colour transparent at rest and `--stone` while the pointer is over the region. The vault-dependent visual walk (a long page, the sidebar bands, the search dropdown, the code block's language list) is left to the user's own browser session: the File System Access picker cannot be driven from the check. Swept with `npm run kill:dev`.
- [x] 4.3 Run `npx oxlint --fix`, `npm run fmt`, `npm test`, and `npm run build`; then `npx oxlint --deny-warnings --format=agent` clean.
- [x] 4.4 Bump `package.json` to 0.15.0 (a new user-visible bar, so a minor bump) and add the numbered task to `PLAN.md` describing what shipped, including the pointer-elsewhere case as a known cost.
