## Why

The pane's `.document` wrapper pads the content `40px 48px 64px`. The 40px top was sized to balance the title heading that used to sit above the editor; with the heading gone (remove-title-heading), the content starts too far down. Halve the top padding so the editor surface sits closer to the pane's top edge while keeping the side/bottom breathing room.

## What Changes

- Change `.document` padding from `40px 48px 64px` to `20px 48px 64px` (top halved, sides/bottom unchanged).
- No behavioral or test change: no test asserts padding.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `static-navigation`: the pane's content column starts with compact top padding instead of the pre-heading measure.