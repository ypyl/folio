# Design

## Context

The tour's step content is one array in `src/tour/steps.ts`; each step carries a
`target`, a `title`, a `body`, and a `side`. The card renders `body` as a single
paragraph that wraps to the card's width. See proposal.md — Why.

## Goals / Non-Goals

**Goals:**

- Teach the page and board reference forms in the tour's editor step.
- Keep the change to the step content and the spec clause; touch no behavior.

**Non-Goals:**

- A reference hint on any other surface.
- Any change to the reference grammar or the editor.

## Decisions

**D1 — The copy is content, not code.** The change edits one string in
`steps.ts`. The card already wraps its body, and no layout, placement, or focus
code changes. The `side` and `target` of the editor step are untouched.

**D2 — Name both forms accurately.** `#` references a page (ADR-0012) and `#!`
references a board (ADR-0024); a copy that called `#!` a page reference would be
wrong. The body uses one example per kind (`#word`, `#[[Page]]`, `#!word`) and
states that referencing something new creates it on first save, which is the
existing rule for both a page and a board.

**D3 — The tour step is the right surface.** It already points at the editor and
has the user's attention there, so the linking gesture belongs in its
explanation rather than a second hint elsewhere (the empty-state hint, the
placeholder, or the shortcuts reference).

## Risks / Trade-offs

- [The longer body could crowd the card on a narrow window] → The card is a
  single wrapping paragraph at `min(320px, 100vw - 16px)`, so the text reflows;
  the browser check confirms it reads on the no-folder state.
- [The copy could drift from the grammar] → `Tour.test.tsx` asserts the editor
  step names both reference markers, so a future edit that drops one fails the
  suite.
