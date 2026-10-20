# Proposal

## Why

The page row menu's removal item reads `Remove reminder` whatever the rule is. A
page has at most one rule, but the user cannot see which one that is from the
menu: a `daily` reminder and a `yearly` one look the same, so activating it is a
blind destructive act. The schedule is what the removal deletes.

## What Changes

- **The row menu's removal item names the schedule it removes.** It reads
  `Remove reminder (every day from October 6, 2026)`, or
  `Remove reminder (once, on October 20, 2026)` for a one-off, in the same words
  the replacement confirmation already uses.
- **The sidebar receives each page's rule, not just a flag.** The row menu's
  reminder item has one lookup for the rule and derives both the presence and the
  label from it, so the item can never name a schedule the page does not have.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `favorites`: the row menu's reminder item is described as naming the schedule it
  removes, not as the bare label.
- `reminders`: the page row menu's removal item carries the rule's schedule.

## Non-goals

- No change to what removal does: one activation, the page and every written
  journal line stay.
- No confirmation for removal, and no change to the replacement confirmation.
- No second line or subtext in menu items: the row menu stays one line per item.
- No change to the day menu, which no longer offers removal.

## Impact

- `src/components/Sidebar.tsx`: the reminder prop becomes a map from lowercased
  page name to the rule; the removal item's label is built from it.
- `src/App.tsx`: memoizes that map from `reminders` (replacing the set).
- Tests: Sidebar and App row-menu tests assert the labelled item; the e2e reminds
  path finds the item by its new name.
- README: the removal sentence names the schedule in the item.
- Version bump: a minor bump (the row menu now shows what it will delete).
