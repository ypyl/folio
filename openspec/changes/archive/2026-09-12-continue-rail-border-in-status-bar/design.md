## Context

See `proposal.md` for why. Facts that shape the approach:

- `.bar` is a flex row with `gap: 10px` and `padding: 4px 16px 4px 0`; children are `[pin][path][divider][center][vault]` (`src/components/StatusBar.module.css`). The hairline is a 1px flex item that follows the breadcrumb, so its x tracks the path's width.
- The rail is `width: 56px; border-right: 1px solid var(--border)` with `box-sizing: border-box`, so its border occupies x=55..56 and its content column is 55px. Measured: `<nav>` spans [0,56].
- `--rail-w` is the shared column token (`src/index.css`).
- Measured before this change: pin cell [0,56], breadcrumb starts at 66, hairline at 76 with no page open.
- `StatusBar.test.tsx` asserts on `.path`, `.crumbDirs`, `.crumbLast`, `.statusText`, `.vault`, and the number of buttons — never on the hairline or on child order.

## Goals / Non-Goals

**Goals:**

- The hairline's x range is exactly 55..56: the same pixels the rail's border occupies.
- One hairline in the bar, no magic offsets standing in for a real edge.

**Non-Goals:**

- No second hairline between the breadcrumb and the status group (that is what the change removes).
- No change to the bar's height, vertical padding, or horizontal spacing after the column (still 32px tall, 10px gaps, 16px right inset).
- No change to the pin's behavior, states, or accessible name.
- No styling of the breadcrumb's ink to re-establish the path/status grouping (a possible follow-up, not this change).

## Decisions

### D1 The hairline is the leading column's right edge, not a flex item

The leading column becomes a 56px box with `border-right: 1px solid var(--border)`, holding the centred pin; the standalone divider element goes.

Why: as a flex item the hairline can only reach the column edge by cancelling the bar's 10px gap (a negative margin, or `order` plus a negative margin) and landing 1px inside a 56px cell via `calc(var(--rail-w) - 1px)`. As the column's own border it is on the edge by construction, uses the same `border-right` declaration and the same token as the rail it continues, and the two lines cannot drift: change `--rail-w` and both move.

Rejected: keeping the divider element and reordering it before the path group with `.pin { margin-right: -10px }` and a 55px pin box. Two magic numbers (`-10px`, the 1px subtraction) to reconstruct an edge the box already has.

Rejected: moving the divider with CSS `order` while leaving the DOM order alone. The visual order would diverge from the DOM order for no benefit, and the gap still needs cancelling.

`box-sizing: border-box` (global) keeps the box at exactly `--rail-w` including the border, so the hairline sits at 55..56 and the bar's 10px gap then puts the breadcrumb at 66 — the same x the rail's content column ends at.

### D2 The pin returns to its own 24px box, centred in the column

`align-status-bar-pin-column` D4 made the pin's box the whole 56px cell to widen the hit target. With the cell now carrying a border, keeping that would put the button's right edge on the hairline and make the focus ring and hit area include the column's border. The button goes back to 24x24 centred in the column, so the focus ring hugs the star again; the click target is the star, as it was before that change. This supersedes D4 there, and the requirement text says "centred in the column" so the two cannot drift.

### D3 Exactly one hairline, so the breadcrumb and the status text lose their separator

The bar's single hairline now closes the column. The alternative — keep the old separator as well — is what the user's report rejects: a hairline floating wherever the breadcrumb's width happens to end it. Two vertical lines 20px apart in a 32px bar read as noise, and the status text is a short sentence ("Saving…", "Indexing notes…") that does not need a rule to be told apart from a file path. Accepted cost, stated in the proposal as breaking.

### D4 The hairline spans the column's content height, not the bar's full height

The column is a flex item with the bar's `align-items: center`, so its height is its content — the 24px pin — and the border spans 24px of the bar's 32px, leaving the bar's 4px vertical padding above and below it. That is the height the hairline has today; the rail's border still visually continues into the bar, interrupted only by the bar's own padding. Rejected: removing the bar's vertical padding so the line meets the bar's top border edge to edge — it would change the bar's height from 32px to 30px, which is beyond this ask.

## Risks / Trade-offs

- [The breadcrumb and the status text now run together with 10px between them] → Accepted and stated as breaking in the proposal. If it reads badly with a page open, distinguishing the breadcrumb's ink is a separate change (Non-Goals here).
- [The 1px offset risk between the two lines] → They are the same declaration on boxes of the same declared width, and the task verifies the measured x range rather than trusting it.
- [The column renders its border even when the bar has no pin control] → The pin is always passed by `App`; the column stays a fixed part of the bar's structure rather than appearing and disappearing, and the no-pin test only counts buttons.

## Migration Plan

None. Two files, no persisted state, no data shape.
