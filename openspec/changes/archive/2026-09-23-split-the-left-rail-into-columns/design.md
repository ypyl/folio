## Context

See proposal.md — Why. The rail is `.gutter` in `EditorPane.module.css`: absolutely positioned at the document's left edge, 32px wide, with the document's own left padding at 32px. `gutter.ts` measures top-level blocks and fold items in one pass, writes the numbers and arrows, and currently shifts a top-level number down by the arrow's height so the two do not overlap (the arrow is 20px of the 32px rail).

## Goals / Non-Goals

**Goals:**

- Two readable columns: numbers left, arrows right next to the prose, on the same line.
- A 12px number, matching the metadata floor.
- Keep the single measure-then-write pass and the off-the-keystroke-path update.

**Non-Goals:**

- Any change to fold semantics, fold state, or the editor seam.
- Any change to the other panes' geometry.
- Reflowing the document narrower or wider than the added rail width.

## Decisions

### D1 — Two columns, sized from the rail's right edge

The rail widens to 56px and the document's left padding grows to match, so the prose starts after both columns. The number column is right-aligned at `right: 28px` and the arrow column is `right: 2px` with its 20px control; a 12px number of up to four digits fits the left column with a gap to the arrow. Both are placed on the same line; the old stacking shift is gone.

Alternative considered: keep the 32px rail and shrink the arrow (rejected — a 20px chevron plus a legible number do not fit two columns in 32px, and shrinking the target hurts the control).

### D2 — The number is 12px with line-height 1

`GUTTER_MARKER_HEIGHT` is 12 and the centring rule keeps it; a 12px font with `line-height: 1` makes the rendered box exactly that height, so the measurement and the box agree without touching the constant. The arrow keeps its 14px box.

### D3 — No stacking in the rail update

`updateGutterDom` stops shifting a number under a first-level arrow. It measures blocks and fold items, then writes each at its own line offset. This removes the `ARROW_GAP` and the coincidence check, and the tests that asserted the shift become same-line assertions.

### D4 — The added width stays inside the editor pane

The 32px document padding is local to `EditorPane.module.css`, not a shared `:root` token, so widening it shifts only the prose inside the pane and cannot drift the sidebar, meta panel, or status bar. If it needs to align with another surface later, it should become a token then.

## Risks / Trade-offs

- [The prose shifts right by 24px] → Accepted for two legible columns; the change is one rule in one stylesheet and its width is easy to tune.
- [A five-digit line number overflows the 28px number column] → At the rail's scale this is a hypothetical page; the number stays right-aligned and the failure is cosmetic, and the column can be widened without touching anything else.
- [The chevron's inline SVG has no intrinsic size] → Give it an explicit size with the image control's own pattern (`.folio-image-control svg { width: 12px; height: 12px }`), so it fills the 14px box rather than falling back to a replaced element's default.
- [The number font and `GUTTER_MARKER_HEIGHT` drift] → D2 ties them with `line-height: 1`; the existing "honours a custom marker height" test keeps the constant honest.

## Migration Plan

None. Nothing is stored; revert the commit to roll back.
