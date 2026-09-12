## Why

The status bar's leading pin control sits in a 24px box after 16px of bar padding, so the bar's leading cell is 40px of content plus the gap — nothing like the rail's column above it, which is `var(--rail-w)` (56px) wide. Measured in the running app: the rail's right border is at x=56, the pin occupies x=16..40, and the breadcrumb starts at x=50. The bar's leading cell therefore reads as a stray control rather than as the rail's column continued downward. The header already mirrors the workspace's columns; the status bar does not.

## What Changes

- The status bar's leading cell becomes the pin control sized to `var(--rail-w)`, so its column is exactly the rail's column width, at the same x as the rail above it.
- The bar drops its left inset (`padding-left: 0`) so the cell starts at the bar's edge and its center line matches the rail's.
- Nothing else moves: the breadcrumb, the hairline, the status text, and the vault group keep their order and spacing, and the pin keeps its glyph size, behavior, disabled rules, accessible name, and title.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ui-shell`: the app-level status bar requirement gains a leading column rule — the bar's leading cell is the pin control at the folder rail's column width, starting at the bar's edge — so the bar's first column lines up with the rail above it.

## Impact

- `src/components/StatusBar.module.css` only (`.bar`, `.pin`). No component, prop, or markup change; no test asserts layout in jsdom, so the test surface is unchanged.
- Reuses the existing `--rail-w` token from `src/index.css`; no new token, no ADR (ADR-0006 unchanged — this is a spacing alignment, not a feature).
