## Why

The editor pane's `.document` wrapper caps at `max-width: 720px`, so on any wider window the content surface stops two-thirds across the pane and the right side is unused space. Folio's pane column already takes all available width (`minmax(0, 1fr)`); the cap is what wastes it and should go: the editor should use the whole pane.

## What Changes

- Remove the `max-width: 720px` cap from the pane's `.document` wrapper; the editor surface spans the full width of the pane column.
- Keep the wrapper's padding (breathing room at the pane edges) and the pane layout unchanged.
- No behavioral or test change: no test asserts a content width.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `static-navigation`: the editor surface fills the pane's full width rather than a fixed 720px measure.