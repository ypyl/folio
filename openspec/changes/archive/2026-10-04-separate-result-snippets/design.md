# Design

## Context

`MatchBody` renders one `.window` per snippet inside a `.snip` block, with `.window + .window { margin-top: 6px }` between them. The surfaces separate their result rows with `border-bottom: 1px solid var(--border-soft)` on `.item` (`SearchSpotlight.module.css`). The gap alone does not read as a division: in a row whose first snippet ends on a line and whose second begins on the next, the two run together as one passage.

## Goals / Non-Goals

**Goals:**

- Two snippets in one row are visibly separate.
- The divider uses the app's existing vocabulary, no new token or component.

**Non-Goals:**

- Changing which snippets a row shows, or how many.
- Touching the row or group separators.
- Adding text (an ellipsis) into the snippet.

## Decisions

### D1 — The same `--border-soft` hairline the rows use

`.window + .window` gains `border-top: 1px solid var(--border-soft)` with `padding-top: 6px` beside the existing `margin-top: 6px`. That is the same divider the result rows already carry, so a divider means one thing in the dropdown whether it separates results or the places inside one.

Alternatives considered:

- **A centered ellipsis between snippets.** Rejected: it puts a glyph into the snippet text, and the app has no such convention anywhere.
- **A larger gap alone.** Rejected: a gap is what reads as one passage today; the reader needs a mark, not more space.

The divider is inset to the snippet's width rather than the row's full width, because it sits inside the row body's own padding. It separates the places; it is not a row boundary.

## Risks / Trade-offs

- **[A row with the full five snippets carries four dividers, which is more visual noise]** → Accepted, and bounded by the surface's snippet cap. If it reads busy, the lever is the divider's colour (`--border-soft` → transparent at a lower contrast), not its existence.
- **[The divider adds height to an already tall row]** → Small: `padding-top: 6px` per divider after the first, bounded by the cap.
