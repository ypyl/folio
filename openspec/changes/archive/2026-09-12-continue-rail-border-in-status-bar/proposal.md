## Why

The status bar's vertical hairline is a flex item that follows the breadcrumb, so its x depends on the open page's path: at x=76 with no page open, further right as the path grows. It therefore reads as a stray mark floating inside the bar rather than as a boundary, and the rail's column — which the header and the workspace both honour — has no edge in the bar at all. The rail's right border stops where the workspace ends, at the same x the bar should pick it up.

## What Changes

- The hairline becomes the leading column's right edge, drawn where the rail's right border is drawn (x=55..56), so the rail's border continues into the status bar.
- The leading column keeps the rail's width (`--rail-w`) and starts at the bar's leading edge; the pin sits centered inside it at its own 24px size, so the focus ring hugs the star again.
- The bar holds exactly one vertical hairline. The breadcrumb, the status group, and the vault group keep their order and spacing after the column, with no separator between the breadcrumb and the status text.
- **BREAKING (behavior)**: the bar's hairline no longer separates the breadcrumb from the save/indexing text. The `add-status-bar` requirement said it did; that clause is replaced.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: "The shell shows an app-level status bar" — the status group is no longer described as separated from the breadcrumb by a hairline, since the bar's only hairline is now the leading column's edge.
- `ui-shell`: "The status bar's leading column matches the folder rail" — the column is now closed by that hairline, the pin keeps its own size inside it, and the requirement no longer describes a separate hairline separator sitting between the breadcrumb and the status group.

## Impact

- `src/components/StatusBar.tsx` (the leading column wraps the pin; the standalone divider element goes) and `src/components/StatusBar.module.css`.
- No test asserts the hairline: `StatusBar.test.tsx` counts buttons, not children, so the no-pin case (`querySelectorAll('button')` empty) is unaffected.
- Supersedes the decision in `align-status-bar-pin-column` that the whole leading cell is the pin's hit target (D4 there): the column is now a frame with its own edge, and the control inside it returns to 24px.
- No new token, no ADR (spacing and border alignment, not an architectural decision; ADR-0006 unchanged).
