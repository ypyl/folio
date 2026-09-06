## Why

The FolderRail (`<nav aria-label="Open folders">`, the 56px left column) shows a permanent horizontal scrollbar at its bottom edge. Root cause: the rail is `width: 56px` with `box-sizing: border-box`, `padding: 12px 8px`, and a 1px right border → a 39px content box, while its `.add`/`.avatar` buttons are a fixed `flex-shrink: 0` 40px wide → a constant 1px horizontal overflow. `.rail` declares `overflow-y: auto`, so `overflow-x` computes to `auto` and Chromium renders a 1px-triggered horizontal scrollbar in the rail. Verified live: it is the only overflowing element on the page (vault open, editor pane, all widths ≥600px).

## What Changes

- `.rail` gains `overflow-x: hidden` — the rail column must never scroll horizontally; vertical scroll of the avatar list is unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: the folder rail SHALL NOT render a horizontal scrollbar — it scrolls only vertically.