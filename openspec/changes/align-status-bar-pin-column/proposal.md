## Why

The status bar's leading pin control sits in a 24px box after 16px of bar padding, so the bar's first column measures 40px of content before the 10px gap and the vertical hairline that opens the path group. The rail's own column above it is `var(--rail-w)` (56px) wide. The hairline therefore lands 4px to the right of the rail's right border, and the bar's leading cell reads as a stray control rather than as the rail's column continued downward. The header already mirrors the workspace's columns; the status bar does not.

## What Changes

- The status bar's leading cell becomes the pin control sized to `var(--rail-w)`, so its column is exactly the rail's column width.
- The bar drops its left inset (`padding-left: 0`) and the hairline separator cancels the bar's flex gap, so the hairline sits exactly on the rail's right edge (x=56) — continuing the rail's border and starting the path group under the sidebar column.
- Nothing else moves: the path group, the hairline, the status text, and the vault group keep their spacing, and the pin keeps its size, behavior, disabled rules, accessible name, and title.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: the app-level status bar requirement gains a leading column rule — the bar's leading cell is the pin control at the rail's column width, and the bar's hairline separator sits on that column's right edge, so the bar aligns with the rail and the panes above it.

## Impact

- `src/components/StatusBar.module.css` only (`.bar`, `.pin`, `.divider`). No component, prop, or markup change; no test asserts layout in jsdom, so the test surface is unchanged.
- Reuses the existing `--rail-w` token from `src/index.css`; no new token, no ADR (ADR-0006 unchanged — this is a spacing alignment, not a feature).
