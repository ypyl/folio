## Context

See `proposal.md` for why. Facts that shape the approach:

- `.bar` is a flex row: `padding: 4px 16px`, `gap: 10px`, children in order `[pin button][path][divider][center][vault]` (`src/components/StatusBar.module.css`). The hairline therefore sits *after* the breadcrumb, separating the path group from the status group — not at the bar's leading edge.
- `--rail-w: 56px` is the shared column token (`src/index.css`); the workspace and the header grid both open with it.
- Measured in the running app before the change: the pin occupies x=16..40, the breadcrumb starts at x=50, the hairline at x=60, and the `<nav>` rail spans x=0..56 with its right border at x=56. So the leading cell is 40px wide where the rail's column is 56px.
- After the change: the pin occupies x=0..56, the rail spans x=0..56, and the breadcrumb follows at x=66 (the bar's 10px gap).

## Goals / Non-Goals

**Goals:**

- The bar's leading cell is exactly `var(--rail-w)` wide and starts at the bar's edge, sharing the rail's x range.
- One rule set, no new token, no markup change, no component logic touched.

**Non-Goals:**

- No restructuring of the bar into a workspace-mirroring grid (see D1).
- No change to the pin's glyph size, hover/focus treatment, or states beyond the size of its box.
- No reordering of the bar's children and no move of the hairline (D2).
- No attempt to align the star's glyph with the rail avatars' centers (D3).

## Decisions

### D1 Keep the flex row; make the pin the leading column

The bar's children keep their order. Two declarations:

- `.bar` loses its left inset: `padding: 4px 16px 4px 0`.
- `.pin` becomes the column: `width: var(--rail-w)` (was 24px), still `justify-content: center`, so the star stays on the column's center line, at the same x as the rail's center line above. The rule also keeps `flex-shrink: 0`, so the cell holds its width when the breadcrumb grows.

Rejected: rebuilding the bar as a CSS grid mirroring the workspace (`grid-template-columns: var(--rail-w) var(--sidebar-w) minmax(0, 1fr) var(--panel-w)`, as `.header` does). The bar's content is not one-thing-per-column — the path group fits its content and the vault group is pinned right by `margin-left: auto` — so a grid would require re-specifying where every group starts and would fight the bar's auto-margin. A two-declaration flex tweak is smaller and keeps the bar's existing spacing rules intact.

Rejected: leaving `padding-left: 16px` and widening the pin to 56px. The cell would measure 56px but sit at x=16..72, so the column would not match the rail's column position — only its width — which is not what "the same column" means.

### D2 The hairline stays where it is, after the breadcrumb

The bar's children are `[pin][path][divider][center][vault]`, so the hairline separates the breadcrumb from the status group and its x depends on the breadcrumb's width — it is empty-path-dependent (x=66 with no page open, further right as the path grows). It is therefore not a column boundary and cannot be "aligned to the rail" without reordering the bar's children so the hairline leads the breadcrumb, which would leave the status group with no separator and change the bar's design. The hairline is deliberately left untouched.

An earlier draft of this change had `.divider` cancel the bar's flex gap (`margin-left: -10px`) to land the hairline on x=56. It was wrong for the reason above: because the divider follows the path group, the negative margin only closed the 10px gap to the breadcrumb, crowding the hairline against the path text and leaving the actual leading edge (the breadcrumb) at x=66 anyway. Reverted; the geometry check in the tasks is what caught it.

### D3 Center the star in its column, not on the rail avatars

The pin centers in its 56px cell (x=28). The rail's avatars center at x=26 because the rail's padding is asymmetric (4px left, 8px right) around a 40px box. The two-pixel difference is below the threshold where a 14px glyph reads as misaligned, and matching the avatars would mean encoding the rail's padding into the status bar — a coupling that would silently break if the rail's padding changed. The column is the alignment that matters.

### D4 The pin's whole cell is the control

`width: var(--rail-w)` on the button makes the leading cell one hit target: its click, hover, and focus area is the column, not a 24px box inside it, while the visual is unchanged (transparent background, centered 14px glyph). The `:focus-visible` ring draws around the cell instead of hugging the star; that reads as the column being focused, which matches what the cell is.

## Risks / Trade-offs

- [A wider button means a click left of the star toggles the pin] → The cell holds no other control and the region is 24px tall inside the bar; the larger target helps on touch. Accepted.
- [The pin's cell and the rail's column are aligned by value (`--rail-w`), so a future rail padding change could re-open a small offset] → Both read the same token, and the offset in question is the rail's own internal padding (2px at the glyph), not the column. Accepted; the column edge, which is the visible boundary, stays aligned.

## Migration Plan

None. One CSS file, no persisted state, no data shape.
