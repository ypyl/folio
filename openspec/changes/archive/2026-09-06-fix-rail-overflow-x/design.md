## Context

FolderRail.module.css `.rail` is `width: 56px; box-sizing: border-box; padding: 12px 8px; border-right: 1px solid var(--border); overflow-y: auto;`. Content box = 56 − (8+8 padding) − 1 border = **39px**. `.add`/`.avatar` are `width: 40px; flex-shrink: 0` → 40 > 39 → constant 1px horizontal overflow. `overflow-y: auto` makes the computed `overflow-x` `auto`, so Chromium paints a horizontal scrollbar in the rail (verified live: rail `scrollWidth 56 > clientWidth 55`; it is the only overflowing element on the page at widths ≥600px).

## Goals / Non-Goals

**Goals:**
- Remove the rail's horizontal scrollbar with the smallest possible change.
- Keep vertical scrolling of the avatar list working.

**Non-Goals:**
- Not resizing the rail, remeasuring padding, or reworking the layout — the 40px buttons in a 56px rail with 8px side padding + hairline border is a deliberate DESIGN token layout; the overflow is a scrollbar artifact, not a spacing bug.

## Decisions

**D1 — `overflow-x: hidden` on `.rail`.** One declaration; the vertical axis stays `auto`. Alternatives rejected: `overflow: hidden` (kills vertical scrolling of a tall avatar list), shrinking `.add`/`.avatar` to 39px (changes the DESIGN-mandated 40px control size), widening the rail (breaks the fixed 56px column). Hiding a dead 1px horizontal axis is the minimal, token-preserving fix.

## Risks / Trade-offs

- [A wider control or long rail content is now clipped instead of scrollable] → The rail only ever holds 40px-wide controls; a hidden horizontal axis can never hide meaningful content. No realistic risk.