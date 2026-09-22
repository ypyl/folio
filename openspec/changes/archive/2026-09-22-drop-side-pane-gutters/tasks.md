## 1. Drop the pane gutters

- [x] 1.1 In `src/components/Sidebar.module.css`, remove `.sidebar`'s `scrollbar-gutter: stable` and its comment, and delete the `.sidebar::-webkit-scrollbar`, `-track`, and `-thumb` rules. Verify: the file has no `scrollbar-gutter` on `.sidebar` and no `.sidebar::-webkit-scrollbar` selector.
- [x] 1.2 In `src/components/MetaPanel.module.css`, do the same for `.panel`. Verify: the file has no `scrollbar-gutter` on `.panel` and no `.panel::-webkit-scrollbar` selector.
- [x] 1.3 Confirm `overflow-y: auto` stays on both panes (the fallback). Verify: each pane's rule still declares `overflow-y: auto`.

## 2. Update the rule and its guard

- [x] 2.1 Update `DESIGN.md`'s "Scroll regions": drop the two panes from the region list and add them to the no-reservation paragraph with their reason. Verify: the section names the panes as reserving nothing.
- [x] 2.2 Update `src/scrollRegions.test.ts`: add `.sidebar` and `.panel` to the regions that reserve nothing, and update the comments and the two test names that count them. Verify: `npx vitest run src/scrollRegions.test.ts` passes and no other region was caught by the widened match.
- [x] 2.3 Sync the `ui-shell` delta into `openspec/specs/ui-shell/spec.md` at archive time. Verify: `openspec validate --specs` passes after the sync.

## 3. Verification

- [x] 3.1 Run `npx oxlint --fix`, `npm run fmt`, `npm run test`, and `npm run build`; resolve anything they report. Verify: all four exit clean.
- [x] 3.2 Browser-check in Chromium: start with `npm run dev:test`, confirm the log says `ready in`, and measure the sidebar pane's band inset. Verify: the band's right edge sits 4px from the pane border (pane padding only) instead of 20px, the Pages body still has its own reserved lane, and the section dividers reach the pane's edge; then `npm run kill:dev`.
- [x] 3.3 Run `npx oxlint --deny-warnings --format=agent` and confirm zero warnings before finishing.
