# Proposal

## Why

The calendar lets you right-click any day, including days that have passed. A
reminder anchored on a past day makes no sense: a `once` rule would never fire,
and a recurrence would be anchored in the past. The menu should only offer
reminders for today or a day still to come.

## What Changes

- **The day menu offers reminder items only for today and later.** Right-clicking
  a day before today offers no reminder items, the same as a journal day or no
  open page.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `reminders`: the calendar day menu's reminder items are offered only for a day
  that is today or later.

## Non-goals

- No change to a rule's matching, materialization, or removal.
- No change to the recurrence kinds or their labels.
- No blocking of past reminders already written; the note keeps its lines.

## Impact

- `src/components/Sidebar.tsx`: the day menu compares the clicked day with today.
- Tests: the Sidebar and App reminder tests gain the past-day case.
- Version bump: a patch bump.
