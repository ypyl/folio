## 1. The thumb, always shown while there is overflow (CSS only)

- [x] 1.1 In each of the five stylesheets (`EditorPane`, `Sidebar`, `MetaPanel`, `SearchResultsView`, `SearchBox`), change the thumb's `background-color` from `transparent` to `var(--stone)` and delete the `:hover::-webkit-scrollbar-thumb` rule that revealed it. The `::-webkit-scrollbar` and track rules, the inset border, `background-clip`, radius, and `min-height` are unchanged. Verify on disk that no region carries a `:hover::-webkit-scrollbar-thumb` rule and that each thumb is inked unconditionally.
- [x] 1.2 Update each region's comment so it says the thumb is shown while the region can scroll, not revealed on hover.

## 2. The rule

- [x] 2.1 `DESIGN.md`: in "Scroll regions", change the thumb clause to "shown for as long as the region can scroll and absent while it cannot", drop the "revealed while the pointer is over the region" wording and the "no reveal from anything but hover" sentence, and make the warning say not to gate the thumb on hover or on the region's scrolling. Keep the gutter, the lane width, the recipe's shape, and the two opt-outs as they are.

## 3. The check

- [x] 3.1 `src/scrollRegions.test.ts`: assert every gutter region's thumb is inked unconditionally (`background-color: var(--stone)` on the `::-webkit-scrollbar-thumb` rule) and that no region carries a `:hover::-webkit-scrollbar-thumb` rule. Drop the resting-transparent assertion. Verify the check fires by reverting one region's thumb to `transparent`.

## 4. Verification and release

- [x] 4.1 Walk every scenario in the `ui-shell` delta and say which are covered by the browser check and which are structural.
- [x] 4.2 Browser check with `npm run dev:test` (confirm the log says `ready in`): confirm in Chromium that a region with overflow shows its `--stone` thumb with the pointer away from it, and that a region with no overflow shows no thumb while still reserving the lane. Sweep with `npm run kill:dev`.
- [x] 4.3 Run `npx oxlint --fix`, `npm run fmt`, `npm test`, and `npm run build`; then `npx oxlint --deny-warnings --format=agent` clean.
- [x] 4.4 Bump `package.json` to 0.15.1 and add the numbered task to `PLAN.md`.
