# Proposal

## Why

Naming the schedule inside the removal item's label made the action and its
detail one sentence: `Remove reminder (every year from October 19, 2026)` reads as
a paragraph, widens the menu, and buries the verb. The schedule is a detail of the
action, not part of its name.

## What Changes

- **A menu item can carry a description.** The reminder item reads `Remove
  reminder` with the schedule beneath it as a small, muted second line — a button
  with a description, not a longer label.
- **The description is the accessible description, not part of the name.** The
  item's name stays `Remove reminder`; assistive technology reads the schedule
  from `aria-describedby`, the same as a visible caption.
- **The schedule's wording is unchanged**: still `every year from October 19,
  2026`, and `once, on October 20, 2026` for a one-off, in the words the
  replacement confirmation uses.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `favorites`: the row menu's removal item is a two-line action — a label and a
  described schedule — rather than a label that carries the schedule.
- `reminders`: the removal item labels the action and describes the schedule
  beneath it.

## Non-goals

- No second line on any other menu item; the description is optional and only the
  removal item sets it.
- No change to removal's effect, the feature gate, or the replacement
  confirmation.
- No tooltip, and no icon: the caption below the label is the whole affordance.

## Impact

- `src/components/RowContextMenu.tsx` and its CSS module: an optional
  `description`, a two-line item layout, and `aria-describedby` wiring.
- `src/components/Sidebar.tsx`: the removal item passes `Remove reminder` as its
  label and `describeSchedule(rule)` as its description.
- Tests: menu-item tests cover the description line and accessible description;
  the reminder tests query the item by its exact name again and assert the caption.
- README: the removal sentence describes the two lines.
- Version bump: a minor bump (the menu item now shows a description line).
