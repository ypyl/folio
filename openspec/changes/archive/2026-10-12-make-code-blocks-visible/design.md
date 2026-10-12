# Design

## Context

See proposal.md - Why. The relevant current state:

- `render(view)` in `src/editor/codemirror.ts` computes view-only decorations
  for the visible region from the markdown syntax tree. It already emits a
  `Decoration.mark({ class: 'folio-cm-fence' })` over the whole `FencedCode`
  node, and `folioTheme` sets that class's fill to `#f5f4ed` — the page colour.
- A `Decoration.mark` is an inline span, so it paints the text's box only. A
  continuous panel needs the line box, which is what `Decoration.line` paints.
- The constraint that shaped ADR-0029 still holds: a view plugin may emit line
  decorations (it must not replace line breaks), so no state field is required
  for this change — unlike the table, which replaces line breaks.
- The typing budget (AGENTS.md) bounds any per-recompute work to what scales
  with the viewport, not the document.
- DESIGN.md's Code entry already specifies an ivory fill, no border, and 8px
  radius, so no design-language change is needed.

## Goals / Non-Goals

**Goals:**

- A fenced block reads as one continuous, full-width panel.
- The block's first and last lines are padded and the panel's ends rounded.
- Work per recompute stays proportional to the code lines in the viewport.

**Non-Goals:**

- Hiding the fence lines, adding a border or accent rule, or changing token
  colours. See proposal.md - Non-goals.
- Making the fill a fixed pixel panel with its own scroll region; the code is
  still the page's text.

## Decisions

### D1: Paint the panel with per-line decorations, not an inline mark or CSS

Each line of a visible `FencedCode` node gets a `Decoration.line` carrying a
panel class. Alternatives considered:

- **Inline `Decoration.mark` (today).** Cannot paint the line box; the reason
  the block has no shape.
- **CSS `.cm-line:has(.folio-cm-fence)`.** Zero JavaScript and full-width, but
  CSS cannot identify the block's first and last lines, so the 8px radius is
  impossible. Rejected because the rounded ends are part of the specified look.
- **A block widget for the whole fence (Obsidian-style).** Rejected in
  ADR-0029: it would re-introduce a second highlighting pass and lose native
  code editing. Not needed to solve a styling problem.

### D2: Two role classes, mirroring the search frame

The line decoration for the node's first line also carries `...-first` (top
radius, top padding) and the last line carries `...-last` (bottom radius,
bottom padding). `frameDecorations` already uses this exact first/last pattern
for search frames, so the approach is established rather than new.

### D3: The line paints fill and padding; the mark keeps the text colour

The panel class owns `background`, horizontal padding, and the vertical padding
on the role lines. The existing `.folio-cm-fence` mark keeps the block's text
colour and drops its background, so there is exactly one fill and no double
paint. Token spans inside the block keep overriding the colour, unchanged.

### D4: Clamp to visible lines; roles follow the node, not the viewport

Line decorations are emitted only for lines inside `view.visibleRanges`. A
`first`/`last` role is attached only to the node's true first/last line, and
only when that line is visible — so a fence scrolled past its top shows no top
radius, which is the correct rendering rather than a mislabelled edge.

### D5: Fill, padding, radius only — no border, no shadow

Per DESIGN.md rules 4 and 6. The current design drift is the colour; the shape
is what carries the visibility.

## Risks / Trade-offs

- **Per-recompute allocation.** Naively emitting a decoration per line of a
  fence could allocate proportional to a huge fence, not the viewport →
  Mitigation: clamp the loop to `view.visibleRanges` lines (D4).
- **Non-uniform line heights.** Padding on the first/last line makes those line
  boxes taller, so CodeMirror measures them like any other line. Stable classes
  per block mean no repeated relayout, but this must not be animated.
- **Subtle contrast.** Ivory against parchment is a lift, not a boundary. The
  panel's shape is what makes the block legible; if it still reads as too quiet
  in review, the sanctioned follow-up is a left rule (a separate change).
- **Panel colour drift.** The theme cannot import a CSS custom property, so the
  ivory hex is repeated in `codemirror.ts`. That is the existing convention
  (`codeHighlight.ts` states the same rule); a comment ties the hex to the token.

## Open Questions

None that affect the specs or the approach. The padding values (a 4px-grid step
for top/bottom, a wider horizontal inset) are tunable during implementation
without changing behavior.
