## Why

Both side panes carry `padding: 4px 16px 4px 4px` — 4px on the left, 16px on the right. That right value dates from when each pane was a bare `overflow-y: auto`, before the scroll regions reserved a gutter. Now `scrollbar-gutter: stable` already holds a 16px lane for the pane's own bar, so the padding doubles up with the lane: measured, the pane's content sits 4px from the left border but 32px from the right, and inside a listing the body's own 4px padding and reserved lane push the rows further still.

## What Changes

- Set the left sidebar's padding to `4px` on all four sides (was `4px 16px 4px 4px`).
- Set the right meta panel's padding to `4px` on all four sides (same change).
- The reserved scrollbar lane is untouched: the pane keeps its 16px gutter and its inset thumb. Only the redundant right padding goes, so the content no longer double-insets beside the lane.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- None. This is a spacing correction that no requirement text specifies; the Kami token rule (4px base) and the scrollbar-gutter requirement both continue to hold, and the change brings the padding closer to the stated base rather than away from it. The change sets `skip_specs: true`.

## Non-goals

- No change to the reserved lane, the inset thumb, or any scroll behavior.
- No change to the pane widths, the accordion, or the row styles.
- No new token: `4px` is the existing Kami spacing base, not a new value.

## Impact

- `src/components/Sidebar.module.css` and `src/components/MetaPanel.module.css`, one declaration each.
- No component, spec, or test changes. `src/scrollRegions.test.ts` still passes: the gutter declarations are untouched.
