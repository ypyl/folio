## Why

The sidebar and the meta panel both reserve a scrollbar lane (`scrollbar-gutter: stable`), so 16px of their width is held empty on the right even though neither pane is the thing that normally scrolls — the accordion bodies inside them are. The reservation stacks with the body's own reserved lane: measured, a Pages row sat 8px from the pane's left border but 39px from its right, 31px of it the two lanes. Dropping the pane-level lane gives that width back to the bands.

## What Changes

- Remove `scrollbar-gutter: stable` from the sidebar pane (`.sidebar`) and the meta panel (`.panel`).
- Remove those panes' `::-webkit-scrollbar` thumb recipes: a region that reserves no lane does not carry the app's thumb, so the panes keep the platform's own bar.
- Leave each pane's `overflow-y: auto` in place as a last-resort fallback (a window too short for the sections' floors), so content stays reachable rather than clipped.
- Update the `ui-shell` scroll-region requirement so the two panes are no longer listed as reserving regions.
- Update `DESIGN.md`'s "Scroll regions" rule with the same carve-out, and `src/scrollRegions.test.ts` so the panes are recognized as regions that reserve nothing.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: the "A scroll region reserves its scrollbar's gutter" requirement drops the sidebar pane and the meta panel from the list of regions that reserve, adding them to the regions that reserve nothing (with a scenario).

## Non-goals

- No change to the accordion bodies: they keep their reserved lanes and inset thumbs, so a listing crossing its band height still does not shift.
- No change to the editor pane, the search results list, or the search dropdown.
- No change to the section minimum heights or to the panes' fallback scrolling; the panes still scroll on a window too short for the floors.
- No change to the pane widths or to the collapse toggles.

## Impact

- `src/components/Sidebar.module.css`, `src/components/MetaPanel.module.css`: drop the gutter and thumb rules from the two pane selectors.
- `src/scrollRegions.test.ts`: add `.sidebar` and `.panel` to the regions that reserve nothing.
- `DESIGN.md`: the "Scroll regions" section's region list and its no-reservation clause.
- `openspec/specs/ui-shell/spec.md` via the delta in this change.
- The fallback pane scroll accepts one visible cost: on a window too short for the sections' floors, the pane's platform bar now appears without a reserved lane, so the bands shift once. The alternative — keeping the lane — costs 16px on every window.
