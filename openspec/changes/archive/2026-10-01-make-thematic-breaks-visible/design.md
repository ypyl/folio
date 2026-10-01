# Design

## Context

The editor renders a thematic break through one rule in `src/components/EditorPane.module.css`. Milkdown emits a real `<hr>` element, so there is no node view and no component to change: the whole treatment is CSS, and the same rule already applies wherever a break appears, including nested inside a blockquote or a list item.

The palette has four line-capable tokens and no mid-grey besides `--stone`:

| Token | Value | DESIGN.md role |
| --- | --- | --- |
| `--border` | `#e8e6dc` | primary border — section dividers, table grid, controls |
| `--border-soft` | `#e5e3d8` | secondary border — row separators, subtle dividers |
| `--warm-sand` | `#e8e6dc` | interactive secondary surface |
| `--stone` | `#6b6a64` | tertiary — dates, metadata; the scrollbar thumb |

The break currently uses `--border`, the primary border. On parchment (`#f5f4ed`) that is a contrast ratio near 1.1:1 — below the threshold at which a 1px line reads as a line at all.

## Goals / Non-Goals

**Goals:**

- A thematic break reads as a visible rule on parchment, so an author's section break is seen as a break.
- The rule stays subordinate to body text: it is the quietest thing that is still clearly visible, not a second heading weight.
- Existing tokens only, existing geometry (`1px`, `24px` margin), one CSS declaration changed.

**Non-Goals:**

- Not a thicker rule, and not a rule that spans less (or more) than the block.
- Not a change to any other construct, including the presentation view's nested break.
- Not a change to the Markdown, the parse, the serialization, or the keystroke path.

## Decisions

**D1 — Use `--stone` for the rule.** `--stone` is the palette's only ink between text and border: strong enough to be unmistakable as a line on parchment, weak enough to stay quiet beside `--near-black` and `--olive` text. It is already the token for marks that must be seen but are not content (the scrollbar thumb, dates, metadata), which is exactly what a divider is.
- *Alternative:* keep the border token and darken it — rejected: `--border` and `--border-soft` are both a warm-sand weight by definition, and darkening either would change every table grid, pane divider, and control border in the app.
- *Alternative:* thicken the line to `2px` — rejected: more ink than the construct warrants, and weight is a blunter instrument than colour here.
- *Alternative:* add a new token — rejected: inventing a value for one construct when an existing one fits is the ornament the palette resists.

**D2 — Leave the geometry alone.** Weight, margin, and full block width are unchanged, so the change is legible as "the same rule, now visible" and no layout shifts.

**D3 — Leave the presentation view's nested break.** A slide is a different surface at a larger type scale, and top-level breaks do not render there at all (they delimit slides). Changing it would be a speculative consistency edit; if it should match, that is its own change.

**D4 — No test.** The change is one declaration and a colour, with nothing to exercise: no branch, no loop, no parse. The repository's comparable change (`add-table-borders`) also verified visually rather than adding a CSS assertion, and the existing block, parse, and serialization tests already cover the behaviour that must not move. Verification is the full suite plus the browser render.

## Risks / Trade-offs

- **The rule may read as too strong** in a document with many breaks, since `--stone` is the same ink as dates and the scrollbar thumb. This is the deliberate side of the trade: too faint is the reported defect, and the placebo is one word (`--border-soft`) away. The browser check judges it on a page holding several breaks before the change ships.
- **The specification now names a colour.** The requirement says `--stone` rather than only "visible", so a future palette change must touch the requirement, not just the CSS. That is intentional: the ink is the decision, and the `DESIGN.md` record keeps the two in step.
