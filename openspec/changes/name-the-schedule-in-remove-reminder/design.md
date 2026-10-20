# Design

## Context

See proposal.md - Why. The pieces that shape the approach:

- The row menu's items are `{ label, onSelect, disabled? }`; the reminder item is
  built in `Sidebar` from `reminderTargets`, a memoized `Set` of lowercased page
  names that App derives from `reminders`.
- `describeSchedule(rule)` in `src/components/recurrences.ts` already names a rule
  the way the replacement confirmation does ("every day from October 6, 2026",
  "once, on October 20, 2026").
- The day menu no longer offers removal, so the row menu is the only surface that
  needs the label.

## Goals / Non-Goals

**Goals:**

- One lookup per row-menu open yields both "has a rule" and "which rule".
- One vocabulary for a rule across the confirmation and the removal item.

**Non-Goals:**

- No menu API change, no second line, no new styles.
- No change to removal's effect or to the feature gate.

## Decisions

### D1: The label carries the schedule, in the confirmation's words

The item reads `Remove reminder (<schedule>)`, built with `describeSchedule`, so
the item that deletes a rule and the dialog that replaces one describe it
identically. A single label keeps `RowContextMenu` unchanged: one line per item,
the existing keyboard model, and the accessible name is the visible text.

Alternative rejected: a muted second line under the label. It reads nicely, but
it needs a new item shape, extra markup and styles, and `aria-describedby` wiring
for a detail a parenthetical already carries.

### D2: The sidebar receives the rules, not just a set of names

App replaces the memoized `Set` with a `ReadonlyMap` from lowercased page name to
the rule, memoized on `reminders` alone. The row menu does one `get`, and the item
exists exactly when the map holds the row's page - the same cost and the same
invalidation as before, but with the schedule in hand. Deriving the label from
the same lookup means the item cannot name a schedule the page does not have.

### D3: The label is built where the menu is built

`Sidebar` reads `describeSchedule` from the recurrences module, the same place
the dialog reads it. No prop grows a copy of the text, so a reworded schedule
changes both surfaces at once.

## Risks / Trade-offs

- [A long schedule widens the row menu] → The menu is a floating box clamped to
  the viewport, and the longest wording ("every month from September 30, 2026") is
  still shorter than the widest listing row.
- [The item's accessible name is longer] → It is the visible text and it names the
  thing being deleted, which is the point; tests match the `Remove reminder`
  prefix.
