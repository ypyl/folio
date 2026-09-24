## Context

See proposal.md — Why. Tables are rendered by Milkdown's table block component over a GFM table, styled in `src/components/EditorPane.module.css` under the `.editor :global(...)` selectors. The cells are `th`/`td` in a `border-collapse: collapse` table. `DESIGN.md`'s Tables section currently prescribes no framed box, no vertical rules, and hairline row rules only. The only existing vertical line is an inset shadow on an empty cell.

## Goals / Non-Goals

**Goals:**
- A table reads as a table: a full 1px grid, an outer frame, and a header that stands apart from the body.
- Stay inside the existing palette and the Kami rules (warm surfaces, warm grays, no hard shadows).
- One place: the table rules in `EditorPane.module.css`, with `DESIGN.md` updated to match.

**Non-Goals:**
- No new token, font, or component.
- No change to the caret strip, the handles, or the selection fill.
- No change to the empty-cell minima or the keystroke path.

## Decisions

**Decision 1: A background fill on the grid, not a new border color.**
Use `--border` (`#e8e6dc`) for every cell edge. A line on its own is faint, but the grid draws many, including a closed frame, so the structure reads without darkening the palette. The header carries `--warm-sand` (the same warm gray as `--border`), which is filled, not outlined, so `DESIGN.md` rule 6 (do not stack border and fill) is respected: the body is border-only, the header is border plus a fill, and no radius is introduced.

*Alternatives considered:* a new `--border-strong` token — rejected for now: it expands the palette for one screen surface; if the grid proves too faint in use, that token is the clean follow-up. `--stone` for the grid — rejected: it is a text ink and would read as a heavy box, not a table.

**Decision 2: Keep `border-collapse: collapse`.**
Adjacent 1px cell borders collapse to single lines, so the grid and the outer frame come from one rule on `th`/`td` with no double lines and no change to column sizing.

**Decision 3: Remove the empty-cell inset shadow.**
The rule existed only because row rules left an empty cell invisible. With a border on every cell the case is handled, so the special case and its comment go. The `min-width: 5rem` floor stays, because an empty table still needs columns wide enough to press.

**Decision 4: Header fill, not a heavier header rule.**
`--warm-sand` behind the existing muted uppercase labels separates the header without a second line weight.

## Risks / Trade-offs

- [A full grid is more visual weight than the editorial style, against DESIGN rule 5 (restraint)] → intended by the user: a table is a structured object and the grid is information, not ornament. `DESIGN.md` records the change.
- [`--border` on parchment is low contrast] → the closed frame plus the header fill carry the structure; if it still reads faint in use, add `--border-strong` as the recorded alternative.
- [Removing the empty-cell shadow could leave an all-empty table hard to aim at] → the grid plus `min-width: 5rem` already give every cell an edge and a width.
