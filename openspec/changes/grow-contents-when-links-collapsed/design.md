## Context

See `proposal.md`. The panel is a flex column: `Contents` (`flex: 0 0 auto`,
body capped at 40vh), the `.links` group (`flex: 1 1 0`, bottom-justified with
`justify-content: flex-end`), and the keyboard-shortcuts footer
(`margin-top: auto`). Collapsing Links removes its body but the `.links` band
keeps its `flex-grow`, so the free space sits empty between Contents and the
collapsed summary.

## Goals / Non-Goals

**Goals:**

- Give the freed height to Contents when Links is collapsed.

**Non-Goals:**

- Changing either section while Links is open.
- Changing the sidebar.

## Decisions

### D1: Express the state in CSS with `:has()`

The Links section's `<details>` open/closed state is already the source of
truth, so the layout can key on it: `.panel:has(.links details:not([open]))`
selects the panel while Links is collapsed. When it matches and Contents is
open, Contents becomes a flex column that grows, its body drops its 40vh cap and
fills, and `.links` stops growing so the collapsed summary sits at the bottom.

Guarded by `.contents[open]` so a collapsed Contents is still exactly its
summary row.

Alternative — track the state in React and add a class — rejected: the DOM
already carries it, so a class would be derived state kept in sync by hand.

### D2: The `::details-content` wrapper carries the flex chain

Chromium renders an open `<details>`'s content through `::details-content`, the
same wrapper the `.section` rules already flex. The Contents rules add it too,
so the body fills the section rather than the wrapper.

### D3: The footer's auto margin is zeroed in this state

`margin-top: auto` on the footer competes with Contents' `flex-grow` for the
free space. In the Links-collapsed state the footer keeps its place at the
bottom by order, so its auto margin is set to zero there, leaving the free space
for Contents.

## Risks / Trade-offs

- **`::details-content` is a Chromium-only selector path** → Folio is
  Chromium-first (ADR-0002), and the `.section` rules already depend on it.
- **No jsdom coverage** → jsdom has no layout, so this is verified by a browser
  check, not a unit test; the existing tests still assert structure and state.

## Migration Plan

CSS-only; no persisted state.
