## Why

When the Links section is collapsed, the panel leaves a gap between Contents and
the collapsed Links row: Contents stops at its content height while the empty
Links band keeps the rest. Collapsing Links is a request for more room, so the
freed height should go to Contents.

## What Changes

- When the **Links section is open**, nothing changes: Contents sizes to its
  content up to its cap, and Links takes the panel's remaining height.
- When **Links is collapsed**, the Contents section grows to take the height
  Links gave up, its body scrolling within itself when its list is longer than
  that space. The collapsed Links summary still sits directly above the
  keyboard-shortcuts row.
- Contents is unaffected while the panel is not showing the page sections (a
  board is open, no page is open).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-shell`: the meta-panel requirement's Contents sizing gains the
  Links-collapsed case, and its "A collapsed section is one row" scenario says
  the freed height goes to Contents.
- `page-contents`: the Contents requirement states it takes the height Links
  gives up when Links is collapsed.

## Non-goals

- No change to Contents while Links is open, or to the cap and scroll behavior
  of either section in their current states.
- No change to the sidebar, the Links rows, or search.
- No change to the keyboard-shortcuts row's placement.
- No new ADR.

## Impact

- `src/components/MetaPanel.module.css`: a `:has()` rule makes Contents grow when
  the Links `<details>` is closed (Guard: only while Contents itself is open).
- Tests: no test asserts pixel layout (jsdom has none); a browser check verifies
  the growth. Specs: `ui-shell`, `page-contents`.
