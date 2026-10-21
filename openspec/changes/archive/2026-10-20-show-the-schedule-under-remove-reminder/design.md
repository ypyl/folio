# Design

## Context

See proposal.md - Why. The pieces that shape the approach:

- `RowContextMenu` items are `{ label, onSelect, disabled? }`; the label is the
  button's whole content and its accessible name.
- The removal item currently builds `Remove reminder (<schedule>)` with
  `describeSchedule`.
- The menu's heading already establishes the muted caption style (`--stone`,
  small, no interactive behavior), which the description line should match.

## Goals / Non-Goals

**Goals:**

- The label stays the action; the schedule reads as a caption under it.
- One optional capability on the menu item, not a second item shape.
- The name stays exactly `Remove reminder`, so the action is found by the same
  words however the schedule reads.

**Non-Goals:**

- No other item gets a description, no icon, no tooltip.

## Decisions

### D1: `description` is a second line inside the same button

`RowMenuItem` gains `description?: string`. The button renders the label in a span
and, when present, the description in a second span; the item becomes a column so
two lines align left, and the description takes the muted `--stone` tone at 11px,
matching the menu heading's caption rather than the item's 13px label. The button
keeps its padding, focus ring, and one-button-per-item keyboard model.

Alternative rejected: a separate non-focusable row under the item. It would split
one action across two nodes, and a click on the caption would do nothing.

### D2: The description is the accessible description, not part of the name

The button gets `aria-describedby` pointing at its description span (ids from
`useId`, one per item). A screen reader then announces "Remove reminder" as the
name and the schedule as its description, which is what the two lines mean
visually; folding the caption into the label would make the name a sentence
again, which is the wording this change undoes.

### D3: The sidebar passes the caption, the menu renders it

`Sidebar` sets `label: 'Remove reminder'` and `description:
describeSchedule(menuRowRule)`. The schedule's wording stays in one function, so
the caption, the confirmation dialog, and their tests keep agreeing.

## Risks / Trade-offs

- [Two-line items make the menu taller] → Only the reminder item is two-line, and
  the menu is already clamped to the viewport.
- [A long schedule could wrap] → The description is one line at caption size; the
  longest wording is short enough for the menu's width without wrapping.
