## Context

See `proposal.md` for why. Facts that shape the approach:

- `.bar` is a flex row: `padding: 4px 16px`, `gap: 10px`, children in order `[pin button][path][divider][center][vault]` (`src/components/StatusBar.module.css`).
- `--rail-w: 56px` is the shared column token (`src/index.css`); the workspace and the header grid both open with it.
- Measured in the running app: the pin occupies x=16..40, the divider sits at x=60, the `<nav>` rail is 56px wide. So the hairline is 4px past the rail's right border, and the leading cell is 28px shy of the rail's width.
- The rail centers its 40px avatars in a 56px column with `padding: 4px 8px 4px 4px`.

## Goals / Non-Goals

**Goals:**

- The bar's leading cell is exactly `var(--rail-w)` wide and the hairline is its right edge, at x=56.
- One rule set, no new token, no markup change, no component logic touched.

**Non-Goals:**

- No restructuring of the bar into a workspace-mirroring grid (see D1).
- No change to the pin's own box outside the bar, its glyph size, or its hover/focus treatment.
- No attempt to align the star's glyph with the rail avatars' centers (D2).

## Decisions

### D1 Keep the flex row; make the pin the column, and cancel the gap on the divider

The bar's children keep their order and spacing. Three declarations:

- `.bar` loses its left inset: `padding: 4px 16px 4px 0`.
- `.pin` becomes the column: `width: var(--rail-w)` (was 24px), still `justify-content: center`, so the star stays on the column's center line.
- `.divider` cancels the bar's flex gap (`margin-left: -10px`) so the hairline lands on the column's edge rather than 10px inside the path group.

Rejected: rebuilding the bar as a CSS grid mirroring the workspace (`grid-template-columns: var(--rail-w) var(--sidebar-w) minmax(0, 1fr) var(--panel-w)`, as `.header` does). The bar's content is not one-thing-per-column — the path group fits its content and the vault group is pinned right by `margin-left: auto` — so a grid would require re-specifying where every group starts and would fight the bar's auto-margin. A 3-declaration flex tweak is smaller and keeps the bar's existing spacing rules intact.

Rejected: sizing the cell `calc(var(--rail-w) - 10px)` to avoid the negative margin. It dodges the trick at the cost of the cell no longer being the rail's width, which is the whole point. The negative margin is documented in the rule so the reason survives.

Rejected: leaving `padding-left: 16px` and widening the pin to 40px. It lands the hairline at 66px, 10px past the rail border — aligned neither with the rail's border nor with the sidebar's content.

### D2 Center the star in the column, not on the rail avatars

The pin centers in its 56px cell (x=28). The rail's avatars center at x=26 because the rail's padding is asymmetric (4px left, 8px right) around a 40px box. The two-pixel difference is below the threshold where a 14px glyph reads as misaligned, and matching the avatars would mean encoding the rail's padding into the status bar — a coupling that would silently break if the rail's padding changed. The column edge, which the hairline makes visible, is the alignment that matters.

### D3 The pin's whole cell is the control

`width: var(--rail-w)` on the button makes the leading cell one hit target: its click, hover, and focus area is the column, not a 24px box inside it, while the visual is unchanged (transparent background, centered 14px glyph). The `:focus-visible` ring draws around the cell instead of hugging the star; that reads as the column being focused, which matches what the cell is.

## Risks / Trade-offs

- [A wider button means a click left of the star toggles the pin] → The cell holds no other control and the region is 24px tall inside the bar; the larger target helps on touch. Accepted.
- [A future fourth group added to the bar must remember the negative-margin trick] → The `.divider` rule carries a comment naming why the margin is negative; the bar's leading cell is also asserted by the spec scenario, so a regression is a spec failure rather than a silent drift.

## Migration Plan

None. One CSS file, no persisted state, no data shape.
